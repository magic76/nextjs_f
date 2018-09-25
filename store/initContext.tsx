import React from 'react';

export const AppContext = React.createContext({});

export const withApp = (Child: any): any => {
    return class App extends React.Component<any, any> {
        static async getInitialProps(ctx: any = {}): Promise < any > {
            if (Child.hasOwnProperty('getInitialProps')) {
                const context: any = (Object as any).assign(ctx, {});
                const childProps: any = await Child.getInitialProps(context) || {};
                return (Object as any).assign(childProps, {});
            } else {
                return {};
            }
        }
        render(): JSX.Element {
            return (
                <AppContext.Consumer>
                    {(app: any) => <Child {...this.props} app={app}/>}
                </AppContext.Consumer>
            );
        }
    };
};
