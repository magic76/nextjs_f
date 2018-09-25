const YCB = require('ycb');

const configArray = [
    {
        dimensions: [
            {
                page: {
                    index: null,
                },
            },
        ],
    },
    {
        settings: ['master'],
    },
    {
        settings: ['page:/'],
        page: '/',
    },
];

export default (params: any) => {

    // 新增頁面時，可不用加dimension就可以直接寫config
    (configArray as any)[0].dimensions[0].page[params.page] = null;
    const ycbObj = new YCB.Ycb(configArray);
    return ycbObj.read(params);
};
