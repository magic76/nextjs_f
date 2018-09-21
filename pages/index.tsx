import * as React from 'react';
import withI18n from '~/component/withI18n';

const Index: (props: any) => JSX.Element = (props: any): JSX.Element => {
    const { i18n }: any = props;
    return <h1>Hello World {i18n('test')}</h1>;
};

export default withI18n(Index);
