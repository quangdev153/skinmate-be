const cors = require('cors');
const AppError = require('../utils/AppError');

const createCorsMiddleware = (config) =>
    cors({
        origin(origin, callback) {
            const allowDevelopmentOrigins =
                config.nodeEnv !== 'production' &&
                config.corsOrigins.length === 0;

            if (
                !origin ||
                allowDevelopmentOrigins ||
                config.corsOrigins.includes(origin)
            ) {
                return callback(null, true);
            }

            return callback(
                new AppError('Origin is not allowed.', 403, 'CORS_NOT_ALLOWED')
            );
        },
        exposedHeaders: ['X-Request-Id'],
    });

module.exports = createCorsMiddleware;
