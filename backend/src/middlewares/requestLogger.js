const { randomUUID } = require('node:crypto');
const pino = require('pino');
const pinoHttp = require('pino-http');

const createRequestLogger = (config) =>
    pinoHttp({
        logger: pino({ level: config.logLevel }),
        genReqId(req, res) {
            const id = randomUUID();
            res.setHeader('X-Request-Id', id);
            return id;
        },
        wrapSerializers: false,
        serializers: {
            req: (req) => ({
                requestId: req.id,
                method: req.method,
                path: req.url.split('?')[0],
            }),
            res: (res) => ({ statusCode: res.statusCode }),
            // Error messages and stacks may contain request data or credentials.
            err: (err) => ({ type: err.name }),
        },
        customLogLevel(req, res, error) {
            if (error || res.statusCode >= 500) return 'error';
            if (res.statusCode >= 400) return 'warn';
            return 'info';
        },
        customSuccessMessage: () => 'Request completed',
        customErrorMessage: () => 'Request failed',
    });

module.exports = createRequestLogger;
