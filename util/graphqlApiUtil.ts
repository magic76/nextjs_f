import config from '../config/config';
import initApollo from '~/store/initApollo';

// util
import util from './util';

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
    public static async query(gql: any, ctx?: any, args?: any): Promise<any> {
        try {
            const client: any = initApollo(util.isClient ? {
                domain: 'domain',
                pathname: 'pathname',
                lang: 'zh-cn',
                isMobile: false,
            } : {
                domain: ctx.domain,
                pathname: ctx.pathname,
                lang: 'zh-cn',
                isMobile: ctx.isMobile,
                res: ctx.res,
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
