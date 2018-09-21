import ApolloClient from 'apollo-boost';

import config from '../config/config';

// util
import util from './util';

export default class graphqlApiUtil {

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
            const client: any = new ApolloClient({
                uri: graphqlApiUtil.getGraphqlUri(),
                request: async (operation: any): Promise<void> => {
                    operation.setContext({
                        headers: graphqlApiUtil.getGraphqlHeader(ctx),
                    });
                },
            });

            const queryParam: any = {
                query: gql,
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
                host = `http://api.xanqjapi-${config.envStage || 'beta'}.com`;
            }
        } else {
            host = config.internalGqlHost;
        }
        return host;
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
        // const isServer: boolean = !(global as any).document;
        return {};
    }
}
