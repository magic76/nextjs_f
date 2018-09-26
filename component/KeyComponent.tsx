import React from 'react';

export interface Global {
    document: Document;
    window: Window;
}

declare var global: Global;

class KeyComponent extends React.Component<any, any> {
    showkeyTimer: any;
    constructor(props: any) {
        super(props);
        this.state = { isShowKey: false };
    }
    handleHover = (isHoverIn: boolean): any => (): void => {
        if (this.showkeyTimer) clearTimeout(this.showkeyTimer);
        if (isHoverIn) {
            this.setState({ isShowKey: true });
        } else {
            this.showkeyTimer = setTimeout(() => { this.setState({ isShowKey: false }); }, 2000);
        }
    }
    handleClick = (): void => {
        let keyElement: any = (global as any).document.getElementById('showKey');
        if (!keyElement) {
            const div: any = (global as any).document.createElement('div');
            div.id = 'showKey';
            (global as any).document.body.appendChild(div);
            keyElement = (global as any).document.getElementById('showKey');
            keyElement.style.cssText = `position: fixed; border: 2px solid pink; left: 0px; top: 0px; z-index:9999; height: 40px;
            background: darkblue; color: white; padding: 5px; border-radius: 10px;`;
        }
        keyElement.innerHTML = `<div>selected lang key: </div><div>${this.props.langKey}</div>`;
    }
    render(): JSX.Element {
        const { langKey, value }: any = this.props;
        const { isShowKey }: any = this.state;
        return (
            <b
                onMouseEnter={this.handleHover(true)}
                onMouseLeave={this.handleHover(false)}
                onClick={this.handleClick}
            >
                {isShowKey ? langKey : value}
            </b>
        );
    }
}

export default KeyComponent;
