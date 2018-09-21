"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const awsXRay = require('aws-xray-sdk-core');
const mwUtils = awsXRay.middleware;
const IncomingRequestData = mwUtils.IncomingRequestData;
const Segment = awsXRay.Segment;
const koaMW = {
    openSegment: function openSegment(defaultName) {
        if (!defaultName || typeof defaultName !== 'string') {
            throw new Error('Default segment name was not supplied.  Please provide a string.');
        }
        mwUtils.setDefaultName(defaultName);
        return async function open(ctx, next) {
            const amznTraceHeader = mwUtils.processHeaders(ctx);
            const name = mwUtils.resolveName(ctx.host);
            const segment = new Segment(name, amznTraceHeader.Root, amznTraceHeader.Parent);
            mwUtils.resolveSampling(amznTraceHeader, segment, ctx);
            segment.addIncomingRequestData(new IncomingRequestData(ctx.req));
            awsXRay.getLogger().debug('Starting koa segment: { url: ' +
                ctx.url +
                ', name: ' +
                segment.name +
                ', trace_id: ' +
                segment.trace_id +
                ', id: ' +
                segment.id +
                ', sampled: ' +
                !segment.notTraced +
                ' }');
            ctx.res.on('finish', function () {
                const self = this;
                if (self.statusCode === 429) {
                    segment.addThrottleFlag();
                }
                if (awsXRay.utils.getCauseTypeFromHttpStatus(self.statusCode)) {
                    segment[awsXRay.utils.getCauseTypeFromHttpStatus(self.statusCode)] = true;
                }
                segment.http.close(self);
                segment.close();
                awsXRay.getLogger().debug('Closed koa segment successfully: { url: ' +
                    ctx.url +
                    ', name: ' +
                    segment.name +
                    ', trace_id: ' +
                    segment.trace_id +
                    ', id: ' +
                    segment.id +
                    ', sampled: ' +
                    !segment.notTraced +
                    ' }');
            });
            ctx.req.segment = segment;
            if (next) {
                await next();
                await koaMW.closeSegment(ctx);
            }
        };
    },
    closeSegment: async function closeSegment(ctx) {
        const segment = ctx.req.segment;
        if (segment) {
            segment.close();
            awsXRay.getLogger().debug('Closed koa segment successfully: { url: ' +
                ctx.url +
                ', name: ' +
                segment.name +
                ', trace_id: ' +
                segment.trace_id +
                ', id: ' +
                segment.id +
                ', sampled: ' +
                !segment.notTraced +
                ' }');
        }
    },
};
awsXRay.middleware.setSamplingRules('sampling-rules.json');
exports.default = koaMW;
