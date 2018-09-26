import React from 'react';
import { withApp } from '~/store/initContext';
import Link from '~/component/Link';

const Index: (props: any) => JSX.Element = (props: any): JSX.Element => {
    const { app }: any = props;
    return (
        <div>
            <Link href="/gb"><a>go gb</a></Link>
            <Link href="/style"><a>go style</a></Link>
            <h1>Hello World {app.i18n('test')}</h1>
            <h2>Current lang {app.lang}</h2>
        </div>
    );
};

export default withApp(Index);
