const YCB = require('ycb');

const configArray = [
    {
        dimensions: [
            {
                page: {
                    '/': null,
                    '/index': null,
                },
            },
        ],
    },
    {
        settings: ['master'],
    },
    {
        settings: ['page:/,/index'],
        page: '/',
        testObj: {
            title: 'home page',
            number: 8,
        },
    },
];

export default (page: string) => {
    const ycbObj = new YCB.Ycb(configArray);
    return ycbObj.read({ page });
};
