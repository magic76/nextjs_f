const reactDOMServer: any = require('react-dom/server');
import * as React from 'react';

import memcachedUtil from './memcachedUtil';

/**
 * HTML cache 工具，取出memcached的cache
 *
 * @export
 * @class htmlCacheUtil
 */
export default class htmlCacheUtil {

    private static defaultCacheKey: string = 'HTML_CACHE_KEY_';

    /**
    * 依key儲存html到cache，並將元件輸出成字串
    *
    * @static
    * @param {*} Child 要做靜態暫存的元件
    * @param {*} props 要做靜態暫存元件的props
    * @param {string} key 存入memcached的key值
    * @param {number} lifeTimeBySecond 有效時間秒數
    * @param {string} lang 語系參數
    * @returns {Promise<any>}
    */
    public static async getHtmlAndSetCache(child: any, props: any, key: string, lifeTimeBySecond: number, lang: string):
        Promise<any> {
        const currentKey: string = `${this.defaultCacheKey}${key}`;
        const isServer: boolean = !(global as any).document;
        const htmlString: any = reactDOMServer.renderToString(React.createElement(child, props));
        isServer && memcachedUtil.set(currentKey, htmlString, lifeTimeBySecond, lang);
        return { __html: htmlString };
    }

    /**
     * 依key從memcached取cache的html string
     *
     * @static
     * @param {string} key 存入memcached的key值
     * @param {string} lang 語系參數
     * @returns {Promise<any>}
     */
    public static async getHtmlCache(key: string, lang: string): Promise<any> {
        const currentKey: string = `${this.defaultCacheKey}${key}`;
        const isServer: boolean = !(global as any).document;
        const htmlString: string = isServer ? await memcachedUtil.get(currentKey, lang) : null;
        return { __html: htmlString };
    }
}
