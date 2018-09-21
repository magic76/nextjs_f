import * as jscookie from 'js-cookie';

import util from './util';

/**
 * cookie專用
 *
 * @export
 * @class cookieUtil
 */
export default class cookieUtil {

    /**
     * 設定cookie
     *
     * @static
     * @param {string} key key
     * @param {string} value value
     * @param {number} [expireDay=30] 過期日（等於0代表session cookie，瀏覽器關閉即消失）
     * @param {string} [domain=''] 域名
     */
    public static set(key: string, value: string, expireDay: number = 30, domain: string = '', serverContext?: any): void {
        let domainName: string = '';
        let newValue: string = '';
        if (domain !== '') {

            // 濾掉port，不然本機localhost:3000設定會失效
            domainName = domain.indexOf(':') > -1 ? domain.split(':')[0] : domain;
        } else {
            if (util.isClient) {
                if (util.isDev) {
                    const host: string = util.getValue(global, ['location', 'host']);
                    domainName = `${host.split(':')[0]}`.toLowerCase();
                } else {
                    domainName = util.getValue(global, ['location', 'host']);
                }
            } else {
                if (util.isDev) {
                    const host: string = serverContext.req.headers.host;
                    domainName = `${host.split(':')[0]}`.toLowerCase();
                } else {
                    const host: string = serverContext.req.headers.host;
                    const hosts: string[] = host.split(':')[0].split('.');
                    domainName = `${hosts[1]}.${hosts[2]}`.toLowerCase();
                }
            }
        }
        newValue = value;
        if (util.isClient) {
            const cookieOption: any = {};
            domainName && (cookieOption.domain = domainName);
            expireDay !== 0 && (cookieOption.expires = expireDay);
            jscookie.set(key, newValue, cookieOption);
        } else if (serverContext) {
            serverContext.res.cookie.set(key, newValue, {
                maxAge: 60 * 60 * 24 * 1000 * expireDay,
                encode: String,
                domain: domainName,
                httpOnly: false,
                overwrite: true,
            });
        }
    }

    /**
     * 取得cookie
     *
     * @static
     * @param {string} key key
     * @param {*} serverContext SSR務必帶入
     * @returns {string}
     */
    public static get(rawKey: string, serverContext?: any): string {
        let value: string = '';
        const key: string = rawKey;

        if (util.isClient) {
            value = jscookie.get(key);
        } else if (serverContext) {
            value = serverContext.res.cookie.get(key);
        }

        return value;
    }

    /**
     * 刪除cookie
     *
     * @static
     * @param {string} key key
     * @param {*} serverContext SSR務必帶入
     * @returns {string}
     */
    public static remove(key: string, serverContext?: any): void {
        let domainName: string = '';
        if (util.isClient) {

            // 若在server上，需指定為根域名，避免不同市場分開cookie
            !util.isDev && (domainName = util.getValue(global, ['location', 'host']));
            if (domainName) {
                jscookie.remove(key, { domain: domainName });
            } else {
                jscookie.remove(key);
            }
        } else if (serverContext) {

            // 若在server上，需指定為根域名，避免不同市場分開cookie
            !util.isDev && (domainName = `${serverContext.req.headers.host.split('.')[1]}.${serverContext.req.headers.host.split('.')[2]}`);
            if (domainName) {
                serverContext.res.cookie.set(key, null, { domain: domainName });
            } else {
                serverContext.res.cookie.set(key, null);
            }
        }
    }
}
