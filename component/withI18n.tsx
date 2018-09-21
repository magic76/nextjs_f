import * as React from 'react';
import * as fetch from 'isomorphic-fetch';

import KeyComponent from '~/component/KeyComponent';
import util from '~/util/util';
import memcachedUtil from '~/util/memcachedUtil';

!(global as any).langObj && ((global as any).langObj = {});

interface IProps {
    lang: string;
    showkey: string;
}
//  tslint:disable-next-line
const withI18n: any = (Child: any) => class Index extends React.Component<IProps, any> {

    constructor(props: IProps) {
        super(props);
        this.state = {
            i18n: (key: string): string | JSX.Element => {
                let value: JSX.Element | string;
                const showkey = this.props.showkey;
                const lang = this.props.lang;
                switch (showkey) {
                    case '1':
                        value = `<${key}> ${util.getValue((global as any).langObj, [lang, key])}`;
                        break;
                    case '2':
                        value = <KeyComponent langKey={key} value={util.getValue((global as any).langObj, [lang, key])} />;
                        break;
                    case '0':
                    default:
                        value = util.getValue((global as any).langObj, [lang, key]);
                        break;
                }
                return value;

            },
        };
    }
    componentWillMount(): void {
        geti18n(this.props.lang);
    }
    static async getInitialProps(ctx: any = {}): Promise<any> {
        let childProps: any;
        if (Child.hasOwnProperty('getInitialProps')) {
            childProps = await Child.getInitialProps(ctx) || {};
        }
        const lang = childProps.lang;
        await memcachedUtil.getAndSet({
            key: 'I18N_Object',
            time: '60',
            lang: 'LANG',
            cb: geti18n.bind(null, lang),
        });
        return childProps || {};
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
