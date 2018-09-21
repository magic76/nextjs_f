import App, { Container } from 'next/app';
import React from 'react';
import withI18n from '~/component/withI18n';

interface IProps {
    Component: any;
    ctx: any;
    pageProps: any;
    i18n: any;
}
class MyApp extends App {
    static async getInitialProps({ Component, ctx }: IProps): Promise<any> {
        let pageProps = {};

        if (Component.getInitialProps) {
            pageProps = await Component.getInitialProps(ctx);
        }

        return { pageProps };
    }

    render(): JSX.Element {
        const { Component, pageProps, i18n }: IProps = this.props;
        const customProps: any = { i18n };
        return (
            <Container>
                <Component {...pageProps} {...customProps}/>
            </Container>
        );
    }
}

export default withI18n(MyApp);
