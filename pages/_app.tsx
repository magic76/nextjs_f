import App, { Container } from 'next/app';
import React from 'react';
import withI18n from '~/component/withI18n';
import util from '~/util/util';
import { AppContext } from '~/store/initContext';

interface IProps {
    Component: any;
    ctx: any;
    pageProps: any;
    i18n: any;
    query: any;
    showkey: string;
    isStartFromServer: boolean;
    perf: string;
    lang: string;
}

const keepParamInCSRList = ['showkey', 'perf'];
class MyApp extends App {

    constructor(props: IProps) {
        super(props);
        if (util.isClient && props.isStartFromServer) {
            !(global as any).boyu && ((global as any).boyu = {});
            keepParamInCSRList.map((item: string) => (global as any).boyu[item] = (props as any)[item]);
        }

    }
    static async getInitialProps({ Component, ctx }: IProps): Promise<any> {
        let pageProps = {};
        if (Component.getInitialProps) {
            pageProps = await Component.getInitialProps(ctx);
        }
        const propsObj = {
            pageProps,
            lang: 'zh-cn',
            query: ctx.query,
            isStartFromServer: !util.isClient,
        };
        keepParamInCSRList.map((item: string) => (propsObj as any)[item] = ctx.query[item] || util.getValue(global, ['boyu', item]));
        return propsObj;
    }

    render(): JSX.Element {
        const { Component, pageProps, i18n, query, lang, isStartFromServer }: IProps = this.props;
        const customProps: any = { i18n, query, lang, isStartFromServer };
        return (
            <Container>
                <AppContext.Provider value={customProps}>
                    <Component {...pageProps}/>
                </AppContext.Provider>
            </Container>
        );
    }
}

export default withI18n(MyApp);
