import router from 'next/router';
import util from './util';

/**
 * Router 專用
 *
 * @export
 * @class routerUtil
 */
export default class routerUtil {

    /**
     * 指定route push位置
     *
     * @param {any} obj 物件
     * @param {string} asPath 網址列顯示的url
     * @returns {void}
     */
    public static push(obj: any, asPath: string = ''): void {

        if (util.isClient) {
            router.push(obj, asPath);
        } else {
            console.trace('can not use router push in server side for path: ', obj);
        }
    }
}
