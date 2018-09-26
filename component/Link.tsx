import React from 'react';
import Link from 'next/link';
import { withRouter } from 'next/router';

interface IProps {

    // 該連結顯示內容(子元件 or 文字)
    children: JSX.Element | string;

    // NextJS 的 Router API
    router: any;

    // NextJS的Link屬性，顯示的網址
    as: string;

    // 連結位址
    href: string;

    // 連結目標
    target: string;

    // 是否為純連結 (true: SSR讀取專用)
    isPureLink: boolean;
}

/**
 * 客製化連結（增加 Desktop 和 Mobile 導轉的判斷）
 *
 * @export
 * @class CustomLink
 * @extends {React.PureComponent}
 */
class CustomLink extends React.PureComponent<IProps, {}> {

    render(): JSX.Element | null {
        const { href = '', children, as: asP }: IProps = this.props;
        return <Link href={href} as={asP}>{children}</Link>;
    }
}

export default withRouter(CustomLink);
