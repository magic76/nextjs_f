/**
 * Koa middleware module.
 *
 * Exposes Koa middleware functions to enable automated data capturing on a web service. To enable on a Node.js/Koa application,
 * use 'app.use(AWSXRayKoa.openSegment())' before defining your routes.  After your routes, before any extra error
 * handling middleware, use 'app.use(AWSXRayKoa.closeSegment())'.
 * Use AWSXRay.getSegment() to access the current sub/segment.
 * Otherwise, for manual mode, this appends the Segment object to the request object as req.segment.
 * @module koa_mw
 */
const awsXRay: any = require('aws-xray-sdk-core');

const mwUtils: any = awsXRay.middleware;
const IncomingRequestData: any = mwUtils.IncomingRequestData;
const Segment: any = awsXRay.Segment;
const koaMW: any = {

    /**
     * Use 'app.use(AWSXRayKoa.openSegment('defaultName'))' before defining your routes.
     * Use AWSXRay.getSegment() to access the current sub/segment. => automatic mode abnormal in koa.
     * Otherwise, for manual mode, this appends the Segment object to the request object as req.segment.
     * @param {string} defaultName - The default name for the segment.
     * @alias module:koa_mw.openSegment
     * @returns {function}
     */
    openSegment: function openSegment(defaultName: string): any {
        if (!defaultName || typeof defaultName !== 'string') {
            throw new Error('Default segment name was not supplied.  Please provide a string.');
        }
        mwUtils.setDefaultName(defaultName);
        return async function open(ctx: any, next: any): Promise<any> {
            const amznTraceHeader: any = mwUtils.processHeaders(ctx);
            const name: any = mwUtils.resolveName(ctx.host);
            const segment: any = new Segment(
                name,
                amznTraceHeader.Root,
                amznTraceHeader.Parent,
            );
            mwUtils.resolveSampling(amznTraceHeader, segment, ctx);

            segment.addIncomingRequestData(new IncomingRequestData(ctx.req));
            awsXRay.getLogger().debug(
                'Starting koa segment: { url: ' +
                ctx.url +
                ', name: ' +
                segment.name +
                ', trace_id: ' +
                segment.trace_id +
                ', id: ' +
                segment.id +
                ', sampled: ' +
                !segment.notTraced +
                ' }',
            );

            // function不能用arrow function，原因是內部有用this
            ctx.res.on('finish', function (): void {

                // tslint:disable-next-line:no-this-assignment
                const self: any = this;
                if (self.statusCode === 429) {
                    segment.addThrottleFlag();
                }
                if (awsXRay.utils.getCauseTypeFromHttpStatus(self.statusCode)) {
                    segment[awsXRay.utils.getCauseTypeFromHttpStatus(self.statusCode)] = true;
                }
                segment.http.close(self);
                segment.close();
                awsXRay.getLogger().debug(
                'Closed koa segment successfully: { url: ' +
                    ctx.url +
                    ', name: ' +
                    segment.name +
                    ', trace_id: ' +
                    segment.trace_id +
                    ', id: ' +
                    segment.id +
                    ', sampled: ' +
                    !segment.notTraced +
                    ' }',
                );
            });

            ctx.req.segment = segment;
            if (next) {
                await next();
                await koaMW.closeSegment(ctx);
            }
        };
    },
    /**
     * After your routes, before any extra error handling middleware, use 'app.use(AWSXRayKoa.closeSegment())'.
     * @alias module:koa_mw.closeSegment
     * @returns {function}
     */
    closeSegment: async function closeSegment(ctx: any): Promise<any> {
        const segment: any = ctx.req.segment;
        if (segment) {
            segment.close();
            awsXRay.getLogger().debug(
                'Closed koa segment successfully: { url: ' +
                ctx.url +
                ', name: ' +
                segment.name +
                ', trace_id: ' +
                segment.trace_id +
                ', id: ' +
                segment.id +
                ', sampled: ' +
                !segment.notTraced +
                ' }',
            );
        }
    },
};

awsXRay.middleware.setSamplingRules('sampling-rules.json');
export default koaMW;
