export default class eventUtil {

    /**
     * 取得巢狀物件的值
     *
     * @static
     * @param {*} obj 物件
     * @param {*} array 層次名稱的陣列
     * @param {*} [defaultValue] 預設值
     * @returns {*}
     */
    public static getValue(obj: any, array: any, defaultValue?: any): any {
        let result: any = obj;
        array.some((key: string): any => {
            result = result[key];
            if (!result) {
                return true;
            } else {
                return false;
            }
        });
        return result ? result : defaultValue;
    }

    /**
     * 建立event listener
     *
     * @static
     * @returns {string}
     */
    public static on(eventName: string, func: any): void {
        if (!(global as any).document) {
            return ;
        }
        const elem: any = (global as any).document;
        const cb: any = (e: any): void => {
            func(e.detail);
        };
        if (elem.addEventListener) {

            // W3C DOM
            elem.addEventListener(eventName, cb, false);
        } else if (elem.attachEvent) {

            // IE DOM
            elem.attachEvent(`on${eventName}`, cb);
        } else {
            elem[eventName] = cb;
        }
    }

    /**
     * 執行對應key的event
     *
     * @static
     * @returns {string}
     */
    public static emit(eventName: string, data: any): void {
        if (!(global as any).document) {
            return ;
        }
        const event: any = new (global as any).CustomEvent(eventName, {
            detail: data,
        });
        (global as any).document.dispatchEvent(event);
    }

    /**
     * 刪除event listener
     *
     * @static
     * @returns {string}
     */
    public static remove(eventName: string, func: any): void {
        if (!(global as any).document) {
            return ;
        }
        (global as any).document.removeEventListener(eventName, func);
    }
}
