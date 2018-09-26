import React from 'react';
import initApollo from '~/store/initApollo';
import Head from 'next/head';
import { ApolloProvider, getDataFromTree } from 'react-apollo';

export default (App: any) => {
    return class Apollo extends React.Component {
        apolloClient: any;
        static displayName: string = 'withApollo(App)';
        static async getInitialProps(ctx: any): Promise<any> {
            const { Component, router }: any = ctx;

            let appProps: any = {};
            if (App.getInitialProps) {
                appProps = await App.getInitialProps(ctx);
            }

            // Run all GraphQL queries in the component tree
            // and extract the resulting data
            const apollo = initApollo(
                {
                    isMobile: appProps.isMobile,
                    lang: appProps.lang,
                    domain: 'domain',
                    pathname: '/',
                    res: ctx.ctx.res,
                },
            );
            if (!(global as any).document) {
                try {
                    // Run all GraphQL queries
                    await getDataFromTree(
                            getApolloHoc(App, apollo, { Component, router, ...appProps }),
                        );
                } catch (error) {
                    // Prevent Apollo Client GraphQL errors from crashing SSR.
                    // Handle them in components via the data.error prop:
                    // https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-query-data-error
                    console.error('Error while running `getDataFromTree`', error);
                }

                // getDataFromTree does not call componentWillUnmount
                // head side effect therefore need to be cleared manually
                Head.rewind();
            }

                // Extract query data from the Apollo store
            const apolloState = apollo.cache.extract();

            return {
                ...appProps,
                apolloState,
            };
        }

        constructor (props: any) {
            super(props);
            console.log('before rednd', props);
            this.apolloClient = initApollo({
                isMobile: props.isMobile,
                lang: props.lang,
                domain: 'domain',
                pathname: '/',
            }, props.apolloState);
        }

        render(): JSX.Element {
            return getApolloHoc(App, this.apolloClient, this.props);

        }
    };
};

const getApolloHoc = (App: any, apolloClient: any, props: any) => (
    <ApolloProvider client={apolloClient}>
        <App {...props} />
    </ApolloProvider>
);
