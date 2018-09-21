
import keyComponent from '../component/KeyComponent';
import config from '../config/config';

const langObj: any = {};

/**
 * 一般共用模組
 *
 * @export
 * @class util
 */
export default class util {
    public static isDev: boolean = !config.envStage;
    public static isClient: boolean = (global as any).document;

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
        let result: any = obj || {};
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
     * 設定語系檔案資料
     *
     * @static
     * @param {string} lang 語系
     * @returns {*}
     */
    public static setLang(lang: string): any {
        let request: any;
        if (!langObj[lang]) {
            const targetPath: string = util.getStaticUrl('lang.json');
            try {
                if ((global as any).document) {
                    request = new (global as any).XMLHttpRequest();
                    if (request) {
                        request.open('GET', targetPath, false);
                        request.send();
                        (request.status === 200) && (langObj[lang] = JSON.parse(request.responseText));
                    }
                }
            } catch (error) {
                console.log(error);
            }
        }
        const showkey: string = '0';
        return {
            get: (key: string): string | JSX.Element => {
                const targetLang: any = util.getValue(global, ['langObj', lang]) || langObj[lang] || {};
                if (showkey === '1') {
                    return `<${key}> ${targetLang[key]}`;
                } else if (showkey === '2') {
                    return keyComponent(key, targetLang[key]);
                } else if (targetLang[key] === undefined) {
                    return '';
                } else {
                    return targetLang[key];
                }
            },
        };
    }

    /**
     * 取得父層的域名
     *
     * @static
     * @return {string}
     */
    public static getParentDomainName(): string {
        const parentDomain: string = (global as any).document.referrer;
        if (!!parentDomain && parentDomain !== '') {
            return parentDomain.split('/')[2];
        } else {
            return (global as any).document.URL.split('/')[2];
        }
    }

    /**
     * 處理浮點數加減問題
     *
     * @static
     * @param {number} num1
     * @param {number} num2
     * @returns {number}
     * @memberof util
     */
    public static numAdd(num1: number = 0, num2: number = 0): number {
        let baseNum: number;
        let baseNum1: number;
        let baseNum2: number;
        try {
            baseNum1 = num1.toString().split('.')[1].length;
        } catch (e) {
            baseNum1 = 0;
        }
        try {
            baseNum2 = num2.toString().split('.')[1].length;
        } catch (e) {
            baseNum2 = 0;
        }
        baseNum = Math.pow(10, Math.max(baseNum1, baseNum2));
        return (num1 * baseNum + num2 * baseNum) / baseNum;
    }

    /**
    * 取得靜態檔案網址
    *
    * @static
    * @param {string} src 路徑
    * @returns {string}
    */
    public static getStaticUrl(src: string): string {
        return `/static/${src}`;
    }

    /**
     * 新增Client Script
     *
     * @static
     * @param {string} src 來源網址
     * @returns {void}
     */
    public static createIncludeScript(src: string): void {
        const script: any = (global as any).document.createElement('script');
        script.async = true;
        script.src = `${src}?v=`;
        (global as any).document.body.appendChild(script);
    }

    /**
     *
     * 轉導父層iframe的url
     *
     * @static
     * @param {string} url
     * @memberof util
     */
    public static setIframeParentUrl(url: string): void {
        const parentDomain: string = (global as any).document.referrer;
        (global as any).window.top.location.href = `${parentDomain.split('/').slice(0, 3).join('/')}${url}`;
    }


    public static checkIfIncludedCSS(file: string): boolean {
        const links: any = (global as any).document.getElementsByTagName('link');
        for (let i: number = 0; i < links.length; i = i + 1) {
            if (links[i].href.substr(-file.length) === file) {
                return true;
            }
        }
        return false;
    }
}
