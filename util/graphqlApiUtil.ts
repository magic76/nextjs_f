import config from '../config/config';
import initApollo from '~/store/initApollo';

// util
import util from './util';
import eventUtil from '~/util/eventUtil';

export default class graphqlApiUtil {

    /**
     * 取得graphql機器uri
     *
     * @static
     * @returns {string}
     * @memberof graphqlApiUtil
     */
    public static getGraphqlUri(): string {
        let host: string = '';
        if (util.isClient) {
            if (config.envStage === 'production') {
                host = 'https://api.xanqjapi.com';
            } else {
                host = config.internalGqlHost;
            }
        } else {
            host = config.internalGqlHost;
        }
        return host;
    }

    /**
     * apollo client隨處call query要用的參數皆在_app.tsx一開始就定義
     *
     * @static
     * @param {*} gql
     * @param {*} [args]
     * @returns {Promise<any>}
     * @memberof graphqlApiUtil
     */
    public static async clientQuery(gql: any, args?: any): Promise<any> {
        return new Promise((resolve: any, reject: any) => {
            eventUtil.emit('graphqlApi', {
                gql,
                args,
                cb: (data: any) => {
                    return resolve(data);
                },
            });
        });
    }

    /**
     * apollo 隨處call用（一定要帶上語系 e.q. zh-cn）
     * 若是要在server打且需判斷裝置，記得將ctx傳入，否則會判斷不到裝置
     *
     * @static
     * @param {*} gql
     * @param {any} ctx
     * @param {*} [args]
     * @returns {Promise<any>}
     * @memberof graphqlApiUtil
     */
    public static async query(gql: any, ctx: any, args?: any): Promise<any> {
        try {
            const client: any = initApollo({
                domain: ctx.domain,
                pathname: ctx.pathname,
                lang: ctx.lang,
                isMobile: ctx.isMobile,
            });

            const queryParam: any = {
                query: gql,
                fetchPolicy: 'network-only',
                errorPolicy: 'all',
            };

            if (args) {
                queryParam.variables = args;
            }

            const payload: any = await client.query(queryParam);

            return payload;

        } catch (error) {
            console.log('[ERROR][graphqlApiUtil] ', error);
            return {};
        }
    }

    /**
     * 取得graphql header
     *
     * @static
     * @param {*} [ctx]
     * @returns {*}
     * @memberof graphqlApiUtil
     */
    public static getGraphqlHeader(ctx?: any): any {
        return {
            'brand-id': '5',
            'lang-code': 'zh-cn',
            'currency-id': '2',
            'device-type': 2,
        };
    }
}
