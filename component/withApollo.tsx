import * as React from 'react';
import { ApolloProvider, getDataFromTree } from 'react-apollo';
import Head from 'next/head';
import initApollo from '~/store/initApollo';
import util from '~/util/util';
interface IProps {
    initialProps: any;
    serverState: any;
    isMobile: boolean;
    lang: string;
    currencyID: number;
}
// Gets the display name of a JSX component for dev tools
function getComponentDisplayName(Component: any): any {
    return Component.displayName || Component.name || 'Unknown';
}
const withApollo: any = (ComposedComponent: any): any => {
    class WithData extends React.Component<IProps> {
        static displayName: any = `WithData(${getComponentDisplayName(
            ComposedComponent,
        )})`;
        static async getInitialProps(ctx: any): Promise<any> {
            // Initial serverState with apollo (empty)
            let serverState: any = {
                apollo: {
                    data: {},
                },
            };
            // Evaluate the composed component's getInitialProps()
            let composedInitialProps: any = {};
            if (ComposedComponent.getInitialProps) {
                composedInitialProps = await ComposedComponent.getInitialProps(ctx);
            }

            // 為什麼這邊ctx會有資料呢(在nextjs中)
            // 由於上面會去await ComposedComponent.getInitialProps
            // 會依序去往下跑withMain、withApp、pages的getInitialProps，
            // 所以ctx會在此程序中被更新，所以initApollo的時候ctx裡就會有值

            if (!util.isClient) {
                const apollo: any = initApollo(
                    {
                        headerParam: {
                            isMobile: ctx.isMobile,
                            lang: ctx.lang,
                        },
                    },
                );

                const getGqlData: any = async (): Promise<any> => {

                    try {
                        // Run all GraphQL queries
                        await getDataFromTree(
                            <ApolloProvider client={apollo}>
                                <ComposedComponent {...composedInitialProps} />
                            </ApolloProvider>,
                            {
                                router: {
                                    asPath: ctx.asPath,
                                    pathname: ctx.pathname,
                                    query: ctx.query,
                                },
                            },
                        );
                    } catch (e) {
                        // Prevent Apollo Client GraphQL errors from crashing SSR.
                        // Handle them in components via the data.error prop:
                        // http://dev.apollodata.com/react/api-queries.html#graphql-query-data-error
                    }
                    return apollo.cache.extract();

                };

                // getDataFromTree does not call componentWillUnmount
                // head side effect therefore need to be cleared manually
                Head.rewind();
                // Extract query data from the Apollo store
                serverState = {
                    apollo: {
                        data: await getGqlData(),
                    },
                };
            }
            return {
                serverState,
                ...composedInitialProps,
            };
        }
        apollo: any;
        constructor(props: IProps) {
            super(props);
            this.apollo = initApollo(
                {
                    headerParam: {

                        // 因為withMain有包一層reduxWrapper，所以props多了一層initialProps(reduxWrapper做的)
                        isMobile: props.isMobile,
                        lang: props.lang,
                    },
                },
                props.serverState.apollo.data,
            );
        }
        render(): JSX.Element {
            return (
                <ApolloProvider client={this.apollo}>
                    <ComposedComponent {...this.props} />
                </ApolloProvider>
            );
        }
    }
    return WithData;
};
export default withApollo;
