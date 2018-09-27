import App, { Container } from 'next/app';
import React from 'react';
import withI18n from '~/component/withI18n';
import withApollo from '~/component/withApollo';
import util from '~/util/util';
import { AppContext } from '~/store/initContext';
import getConfig from '~/config/pageConfig';
import eventUtil from '~/util/eventUtil';
import graphqlApiUtil from '~/util/graphqlApiUtil';

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
    config: any;
    pageConfig: any;
    domain: string;
    pathname: string;
    isMobile: boolean;
}

const keepParamInCSRList = ['showkey', 'perf'];
class MyApp extends App {

    constructor(props: IProps) {
        super(props);
        if (util.isClient && props.isStartFromServer) {
            !(global as any).boyu && ((global as any).boyu = {});
            keepParamInCSRList.map((item: string) => (global as any).boyu[item] = (props as any)[item]);
        }
        eventUtil.on('graphqlApi', ({ gql, args, cb }: any) => {
            graphqlApiUtil.query(gql, {
                domain: props.domain,
                pathname: props.pathname,
                lang: props.lang,
                isMobile: props.isMobile,
            }, args).then((data: any) => cb(data));
        });

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
            isMobile: false,
            isStartFromServer: !util.isClient,
            pageConfig: getConfig(ctx.pathname),
        };

        // 在CSR換頁時，仍然保持與SSR時一樣的參數
        keepParamInCSRList.map((item: string) => (propsObj as any)[item] = ctx.query[item] || util.getValue(global, ['boyu', item]));
        return propsObj;
    }

    render(): JSX.Element {
        const { Component, pageProps, i18n, query, lang, isStartFromServer, pageConfig }: IProps = this.props;
        const customProps: any = { i18n, query, lang, isStartFromServer, pageConfig };
        return (
            <Container>
                <AppContext.Provider value={customProps}>
                    <Component {...pageProps}/>
                </AppContext.Provider>
            </Container>
        );
    }
}

export default withApollo(withI18n(MyApp));
