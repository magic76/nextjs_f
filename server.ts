import awsXray from './middleware/awsXray';
// import util from './util/util';
// import cookieUtil from './util/cookieUtil';

const Koa: any = require('koa');
const Router: any = require('koa-router');
const bodyParser: any = require('koa-bodyparser');
const next: any = require('next');
const dev: boolean = process.env.NODE_ENV !== 'production';
const port: string | number = process.env.PORT || 3000;
const app: any = next({ dev });
const handler: any = app.getRequestHandler();

const xrayName: string = 'SNK-WEB';
app.prepare().then((): any => {
    const server: any = new Koa();
    const router: any = new Router();
    server.use(async (ctx: any, next: any) => {
        ctx.res.statusCode = 200;
        ctx.res.cookie = ctx.cookies;

        // Create res.redirect method
        ctx.res.redirect = (url: string, status: number, message: string): void => {
            if (status) ctx.status = status;
            ctx.redirect(url);
            if (message) ctx.body = message;
        };
        await next();
    });

    router.post('/api/log', bodyParser(), awsXray.openSegment(xrayName), async (ctx: any, next: any): Promise<any> => {
        const body: any = ctx.request.body || {};

        if (body.serviceName) {
            const parentSubsegment: any = ctx.req.segment.addNewSubsegment(body.serviceName);
            parentSubsegment.namespace = 'remote';
            const logParam: any = body.logParam || {};
            const subsegment: any = parentSubsegment.addNewSubsegment(logParam.requestPath || 'default');
            subsegment.addAnnotation('type', 'api');
            const requestTime: number = Number(logParam.responseMilliSecond) || 0;
            const statusCode: number = Number(body.responseStatus) || 200;
            ctx.status = statusCode;

            // 使xRay的時間跟api response時間一樣。
            const xRayTime: any = (): any => new Promise(((resolver: any): any => {
                return setTimeout(() => {
                    subsegment.addAnnotation('domain', ctx.req.headers.host);
                    Object.keys(logParam).map((param: any) => {
                        subsegment.addAnnotation(param, logParam[param]);
                    });
                    resolver();
                }, requestTime);
            }));
            await xRayTime();
            subsegment.close();
            parentSubsegment.close();
        }
    });

    router.get('/(_next|/static)/*', async (ctx: any, next: any): Promise<any> => {
        await handler(ctx.req, ctx.res);
        ctx.respond = false;
    });
    router.get('*', awsXray.openSegment(xrayName), async (ctx: any, next: any): Promise<any> => {
        const reqUrl: string = ctx.url || '/';

        await setXRayPageSegment(ctx, 'deviceType', async () => {
            await app.render(ctx.req, ctx.res, reqUrl, ctx.query);
        });
        ctx.respond = false;

    });
    server.use(router.routes());
    server.listen(port, (err: any): any => {
        if (err) throw err;
        console.log(`> SNK Ready on http://localhost:${port}`);
    });
});

// 設定Xray頁面分段資料
const setXRayPageSegment: any = async (ctx: any, deviceType: number, callback: any): Promise<void> => {
    // const url: string = ctx.url;

    // xray segment名字不支援問號，要濾掉
    // const subsegment: any = ctx.req.segment.addNewSubsegment(url.indexOf('?') > -1 ? url.split('?')[0] : url);
    // subsegment.addAnnotation('type', 'page');
    // subsegment.addAnnotation('computerName', util.getValue(process, ['env', 'COMPUTERNAME']) || '');
    // subsegment.addAnnotation('domain', ctx.req.headers.host);
    // subsegment.addAnnotation('requestPath', url);
    // subsegment.addAnnotation('deviceType', deviceType);

    // const token: string = cookieUtil.get('config.COOKIE_TOKEN', ctx);
    // token && subsegment.addAnnotation('token', token);
    // subsegment.addAnnotation('account', cookieUtil.get('config.COOKIE_ACCOUNT', ctx) || 'guest');
    // cookieUtil.set('config.COOKIE_XRAY_ROOT_TRACE_ID', ctx.req.segment.trace_id, 1, '', ctx);

    await callback();
    // subsegment.close();
};
