import * as React from 'react';
import { withApp } from '~/store/initContext';

const Index: (props: any) => JSX.Element = (props: any): JSX.Element => {
    const { app }: any = props;
    console.log(props);
    return (
        <div>
            <h1>Hello World {app.i18n('test')}</h1>
            <h2>Current lang {app.lang}</h2>
        </div>
    );
};

export default withApp(Index);
