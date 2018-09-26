import fetch from 'isomorphic-fetch';
import { ApolloClient } from 'apollo-boost';
import { createHttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloLink, Observable } from 'apollo-link';
import { onError } from 'apollo-link-error';
import ApolloLinkTimeout from 'apollo-link-timeout';

// util
import util from '~/util/util';
import graphqlApiUtil from '~/util/graphqlApiUtil';
import memcachedUtil from '~/util/memcachedUtil';
import cookieUtil from '~/util/cookieUtil';
import config from '~/config/config';
let apolloClient: any = null;

// 添加graphql header
const authLink: any = (params: any): any => setContext(() => {
    return {
        headers: {
            'brand-id': '5',
            'lang-code': params.lang,
            'currency-id': '2',
            'device-type': params.isMobile ? 2 : 1,
        },
    };
});

// 取得http request link
const getHttpRequestLink: any = () => {
    const httpLink: any = createHttpLink({
        fetch,
        uri: graphqlApiUtil.getGraphqlUri(),
        credentials: 'same-origin',
    });
    const timeoutLink: any = new ApolloLinkTimeout(util.isClient ? 60 * 1000 : config.serverApiTimeout || 2000);
    return timeoutLink.concat(httpLink);
};

// handle錯誤訊息
const errorLink: any = onError(({ graphQLErrors, networkError }: any) => {
    if (graphQLErrors) {
        graphQLErrors.map(({ message, locations, path }: any) => {
            console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
        });
    }
    if (networkError) {
        console.error(`[Network error]: ${networkError}`);
    }
});

// graphql 每一個請求加上log紀錄
const apiLogLink: any = (params: any = {}): any => new ApolloLink((operation: any, forward: any): any => {
    operation.setContext({ start: Date.now() });
    return forward(operation).map((data: any) => {
        const graphqlContext: any = operation.getContext();
        let apiParam: any = {};
        try {

            // data from a previous link
            apiParam = {
                serviceName: 'GraphQL',
                logParam: {
                    deviceType: params.isMobile ? '2' : '1',
                    requestPath: operation.operationName,
                    responseStatus: graphqlContext.status,
                    responseMilliSecond: Date.now() - graphqlContext.start,
                    account: 'guest',
                    createTime: new Date(),
                    url: util.isClient ? util.getValue(global, ['location', 'href'], '') : `http://${params.domain}/${params.pathname}`,
                    cookie: util.isClient ? util.getValue(global, ['document', 'cookie'], '') : '',
                    requestObject: operation.toKey(),
                    responseObject: JSON.stringify(util.getValue(data, ['data']) || util.getValue(data, ['errors']) || {}),
                    source: util.isClient ? 'client' : 'server',
                    token: '',
                },
            };
        } catch (e) {
            console.log(e);
        }
        setTimeout(() => {
            try {
                const serverHost: string = util.isDev ? 'http://localhost:3000/api/log' : 'http://localhost/api/log';
                const clientHost: string = `${util.getValue(global, ['location', 'origin'])}/api/log`;
                fetch(util.isClient ? clientHost : serverHost, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json; charset=UTF-8',
                        'X-Amzn-Trace-Id': `Root=${cookieUtil.get('config.COOKIE_XRAY_ROOT_TRACE_ID', { res: params.res })};Sampled=1`,
                    },
                    body: JSON.stringify(apiParam),
                });
            } catch (e) {
                console.log(e);
            }
        }, 0);
        return data;
    });
});

// memcached的link
const needMemcachedList: any[] = [
].map((gql: any) => gql.definitions[0].name.value);

const memcachedLink: any = (params: any): any => new ApolloLink((operation: any, forward: any): any => {
    const chainObservable: any = forward(operation);

    if (util.isClient) {
        return chainObservable;
    }

    // 沒有在mapping表的直接return不進memcached
    if (needMemcachedList.indexOf(operation.operationName) === -1) { return chainObservable; }

    // 加上送gql的值來做memcached的key，預設為gql原先的名字
    // ${裝置}&${gql名稱}&${gql參數值}
    const gqlKey: string = Object.keys(operation.variables).reduce((result: string, key: any) => {
        return `${result}&${operation.variables[key]}`;
    }, `${params.isMobile ? 2 : 1}&${operation.operationName}`);

    const localObservable: any = new Observable((observer: any): any => {
        const foreverMemcached: any =  new Promise((resolve: any): any => resolve(memcachedUtil.get(`forever_${gqlKey}`, params.lang)));
        const limitMemcached: any = new Promise((resolve: any): any => resolve(memcachedUtil.get(gqlKey, params.lang)));

        return foreverMemcached.then((foreverData: any) => {

            // 總是將forever key value 返回以免讓每一分鐘有一位用戶需等api打回
            observer.next(foreverData);
            observer.complete();

            const errorHandle: any = (): any => {
                memcachedUtil.set(gqlKey, foreverData, 300, params.lang);
            };

            return limitMemcached.then((limitData: any) => {

                // 當limit key value 為空時重新去打gql request
                if (!limitData) {
                    // 新增observer去訂閱api response
                    const subscription: any = chainObservable.subscribe(
                        (result: any): any => {

                            if (result && !result.errors) {

                                // api 正常回應時，設定limitKey & foreverKey
                                memcachedUtil.set(`forever_${gqlKey}`, result, 60 * 60 * 24 * 30, params.lang);
                                memcachedUtil.set(gqlKey, result, 300, params.lang);

                            } else {

                                // api裡面有error時
                                console.info('----- db error 時也會跑到這邊 ------');
                                errorHandle();
                            }
                        },
                        (error: any): any => {

                            // api 錯誤時
                            console.info('----- gql error ------');
                            errorHandle();
                        },
                    );
                    return (): any => {
                        subscription.unsubscribe();
                    };
                }
                return;
            });
        });
    });

    return localObservable;
});

function create(initialState: any, params: any): any {
    const httpRequestLink: any = getHttpRequestLink();
    return new ApolloClient({
        connectToDevTools: true,
        ssrMode: !util.isClient, // Disables forceFetch on the server (so queries are only run once)
        link: ApolloLink.from(
            [
                apiLogLink(getObject(params, ['domain', 'pathname', 'res', 'isMobile'])),
                memcachedLink(getObject(params, ['lang', 'isMobile'])),
                errorLink,
                authLink(getObject(params, ['lang', 'isMobile'])),
                httpRequestLink,
            ],
        ),
        cache: new InMemoryCache().restore(initialState || {}),
    });
}

function getObject(obj: any, propertyArray: string[]): any {
    const newObj: any = {};
    propertyArray.map((key: string) => (newObj[key] = obj[key]));
    return newObj;
}
export default function initApollo(params: any, initialState?: any): any {

    // Make sure to create a new client for every server-side request so that data
    // isn't shared between connections (which would be bad)
    if (!util.isClient) {
        return create(initialState, params);
    }

    // Reuse client on the client-side
    if (!apolloClient) {
        apolloClient = create(initialState, params);
    }
    return apolloClient;
}
