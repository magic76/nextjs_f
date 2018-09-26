const YCB = require('ycb');
import getNextConfig from 'next/config';
let publicRuntimeConfig: any = {};
try {
    publicRuntimeConfig = getNextConfig().publicRuntimeConfig || {};
} catch (e) {
}
const getParam: any = (name: string): string => {
    return publicRuntimeConfig[name] || process.env[name];
};
const configArray = [
    {
        dimensions: [
            {
                environment: {
                    dev: null,
                    qa: null,
                    beta: null,
                    alpha: null,
                    production: null,
                },
            },
        ],
    },
    {
        settings: ['master'],
        envStage: getParam('ENV_STAGE') || 'alpha',
        internalGqlHost: getParam('INTERNAL_GQL_HOST') || 'https://api.xanqjapi.com',
        serverApiTimeout: getParam('SERVER_API_TIMEOUT') || 2000,
    },
    {
        settings: ['environment:production'],
    },
    {
        settings: ['environment:dev'],
    },
];
const ycbObj = new YCB.Ycb(configArray);
export default ycbObj.read({ environment: process.env.ENV_STAGE || 'dev' });
