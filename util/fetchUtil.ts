/**
 * promise專用
 *
 * @export
 * @class fetchUtil
 */
export default class fetchUtil {

    /**
     * 送出請求
     *
     * @static
     * @param {*} promise promise
     * @param {number} [timeout=3000] timout時間
     * @returns {Promise<any>}
     */
    public static promiseTimeout(promise: Promise<any>, timeout: number): Promise<any> {
        let abortFunc: any = null;

        // usage for about Promise
        const abortPromise: Promise<any> = new Promise((_resolve: any, reject: any): any => {
            abortFunc = (): any => {
                reject(new Error('promise timeout'));
            };
        });

        // Promise.race return first finished Promise (fetch or about)
        const abortablePromise: Promise<any> = Promise.race([
            promise,
            abortPromise,
        ]);

        setTimeout(() => abortFunc(), timeout);

        return abortablePromise;
    }
}
