import * as React from 'react';
import util from '~/util/util';
import memcachedUtil from '~/util/memcachedUtil';
import * as fetch from 'isomorphic-fetch';

!(global as any).langObj && ((global as any).langObj = {});
const lang: string = 'zh-cn';

//  tslint:disable-next-line
const withI18n: any = (Child: any) => class Index extends React.Component<any, any> {

    constructor(props: any) {
        super(props);
        this.state = {
            i18n: (key: string): string => util.getValue((global as any).langObj, [lang, key]),
        };
    }
    componentWillMount(): void {
        geti18n(lang);
    }
    static async getInitialProps(ctx: any = {}): Promise<any> {
        await memcachedUtil.getAndSet({
            key: 'I18N_Object',
            time: '60',
            lang: 'LANG',
            cb: geti18n.bind(null, lang),
        });

        if (Child.hasOwnProperty('getInitialProps')) {
            const childProps: any = await Child.getInitialProps(ctx) || {};
            return childProps;
        } else {
            return {};
        }
    }
    render(): JSX.Element {
        return <Child {...this.props} {...this.state}/>;
    }
};

function geti18n(lang: string): Promise<any> | undefined {
    const host: string = util.isClient ? '' : 'http://localhost:3000';
    const url: string = `${host}/static/lang.json`;
    if (util.isClient) {
        if (!(global as any).langObj[lang]) {
            const data: any = geti18nClient(url);
            (global as any).langObj[lang] = data;
        }
    } else {
        return geti18nServer(url).then((data: any) => {
            (global as any).langObj[lang] = data;
            return data;
        });
    }
    return ;
}

function geti18nServer(url: string): Promise<any> {
    return fetch(url).then((data: any) => data.json());
}

function geti18nClient(url: string): any {
    const request: any = new (global as any).XMLHttpRequest();
    request.open('GET', url, false);
    request.send();
    return JSON.parse(request.responseText) || {};
}

export default withI18n;
