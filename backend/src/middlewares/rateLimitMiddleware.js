const { rateLimit } = require('express-rate-limit');
const AppError = require('../utils/AppError');

const createApiRateLimiter = (config) =>
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: config.rateLimitMax,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        handler(req, res, next) {
            next(
                new AppError(
                    'Too many requests. Please try again later.',
                    429,
                    'RATE_LIMIT_EXCEEDED'
                )
            );
        },
    });

module.exports = createApiRateLimiter;
