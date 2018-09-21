import fetchUtil from './fetchUtil';
import config from '../config/config';

const memcache: any = require('./lib/memcache');

const memcacheAction: any = (isSet: boolean, cb: any): any => {
    const client: any = new memcache.Client(11211, '127.0.0.1');

    client.on('close', (): any => {
    });
    client.on('timeout', (e: any): any => {
        console.log(`${isSet ? 'set' : 'get'} memcached timeout.`, e);
    });
    client.on('error', (e: any): any => {
        console.log(isSet ? 'set' : 'get', e.stack.split('\n')[0]);
        cb();
    });
    client.on('connect', (): any => {
        cb(client);
        client.close();
    });
    client.connect();
};

const memcachedCBCount: any = {};
/**
 * memcached拿取與儲存的工具
 *
 * @export
 * @class memcachedUtil
 */
export default class memcachedUtil {

    /**
     * memcached 將對應的key與data存入服務器
     *
     * @static
     * @param {string} key 欲儲存資料的key
     * @param {*} data 欲儲存資料
     * @param {number} [lifeTimeBySecond=600] 過期時間，以秒為單位
     * @param {string} lang 語系參數
     * @returns {void}
     */
    public static set(key: string, data: any, lifeTimeBySecond: number = 60, lang: string): void {
        if ((global as any).document) {
            return console.log(`key "${key}", memcache cant set in client`);
        } else if (!lang) {
            console.log(`key "${key}" please remind to give a lang parameter or it will use default lang zh-cn.`);
        }
        memcacheAction(true, (client: any) => {
            if (!client) {
                return ;
            }
            const memcachedKey: string = `${config.envStage}_${key}_${lang}`;
            try {
                data && client.set(memcachedKey, JSON.stringify(data), (error: any): any => {
                    if (error) {
                        console.log(`memcache set failed with key "${memcachedKey}"`);
                    }
                }, lifeTimeBySecond);
            } catch (ex) {
                console.log('memcached set failed, please check memcached on working or not.');
            }
        });

    }

    /**
     * memcached 根據key值取得資料
     *
     * @static
     * @param {string} key 欲取得資料的key
     * @param {string} lang 語系參數
     * @returns {*}
     */
    public static get(key: string, lang: string): any {
        if ((global as any).document) {
            console.log(`key "${key}", memcache cant get in client`);
            return new Promise((resolve: any, reject: any): void => {
                resolve();
            });
        } else if (!lang) {
            console.log(`key "${key}" please remind to gve a lang parameter or it will use default lang zh-cn.`);
        }
        const result: any = new Promise((res: any, rej: any): any => {
            memcacheAction(false, (client: any) => {
                if (!client) {
                    return res(undefined);
                }
                const memcachedKey: string = `${config.envStage}_${key}_${lang}`;
                client.get(memcachedKey, (err: any, data: any): any => {
                    try {
                        return data ? res(JSON.parse(data)) : res(undefined);
                    } catch (err) {
                        return res(undefined);
                    }
                });
            });
        });
        return result;
    }

    /**
     * memcached 根據key值取得資料
     *
     * @static
     * @param {string} key 欲儲存資料的key
     * @param {number} [time=600] 過期時間，以秒為單位
     * @param {string} lang 語系參數
     * @param {*} cb 非同步請求
     * @returns {*}
     */
    public static getAndSet({ key, time = 60, lang = 'zh-cn', cb }: any): any {
        if (!(global as any).document) {
            const foreverKey: string = `forever_${key}`;
            const foreverTime: number = 60 * 60 * 24 * 30;
            const cbFunction: any = (): any => {
                return fetchUtil.promiseTimeout(cb(), 120000).then((data: any) => {
                    memcachedCBCount && (memcachedCBCount[key] = 0);
                    memcachedUtil.set(key, data, time, lang);
                    memcachedUtil.set(foreverKey, data, foreverTime, lang);
                    return data;
                });
            };

            return memcachedUtil.get(foreverKey, lang).then((payload: any) => {

                // server一起來，或者foreverKey過期
                if (!payload) {
                    return cbFunction();
                } else {
                    memcachedUtil.get(key, lang).then((currentPayload: any) => {

                        // 如果有值，代表api目前正常，清空count
                        // 如果沒值代表上次api異常，異常則根據下面來處理
                        currentPayload && (memcachedCBCount[key] = 0);

                        // 設定globl變數作為是否停止呼叫cb的依據
                        !memcachedCBCount[key] && (memcachedCBCount[key] = 0);
                        memcachedCBCount[key] += 1;
                        memcachedCBCount[key] > 100 && (memcachedCBCount[key] = 1);

                        // 過期時，更新資料
                        if (!currentPayload && memcachedCBCount[key] === 1) {
                            cbFunction();
                        }
                    });
                    return payload;
                }
            });
        } else {
            return cb();
        }
    }
}
