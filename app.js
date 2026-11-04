const express = require('express');
const helmet = require('helmet');
const createRequestLogger = require('./src/middlewares/requestLogger');
const createCorsMiddleware = require('./src/middlewares/corsMiddleware');
const createApiRateLimiter = require('./src/middlewares/rateLimitMiddleware');
const createDocsRoutes = require('./src/routes/docsRoutes');
const createPasswordResetPageRoutes = require('./src/routes/password-reset-page');
const openApi = require('./src/docs/openapi');
const { notFound, errorHandler } = require('./src/middlewares/errorMiddleware');

const createApp = (config) => {
    // Module routes are loaded after server.js has loaded the environment.
    const scanRoutes = require('./src/routes/scanRoutes');
    const authRoutes = require('./src/routes/authRoutes');
    const collectionRoutes = require('./src/routes/collectionRoutes');
    const notificationRoutes = require('./src/routes/notificationRoutes');
    const communityRoutes = require('./src/routes/communityRoutes');
    const routineRoutes = require('./src/routes/routineRoutes');
    const app = express();
    app.locals.config = config;

    app.use(createRequestLogger(config));
    app.use(helmet());
    app.use(createCorsMiddleware(config));
    app.use(express.json({ limit: '1mb' }));
    app.use('/api', createApiRateLimiter(config));

    // Health check endpoint for container orchestration and uptime monitoring.
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'UP',
            timestamp: new Date().toISOString(),
        });
    });

    app.get('/api-docs.json', (req, res) => {
        res.set('Cache-Control', 'no-store');
        return res.json(openApi);
    });
    app.use('/api-docs', createDocsRoutes(config));

    app.use(createPasswordResetPageRoutes(config));
    app.use('/api/collections', collectionRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/community', communityRoutes);
    app.use('/api/scan', scanRoutes);
    app.use('/api/skin-profile', require('./src/routes/skinProfileRoutes'));
    app.use('/api/routines', routineRoutes.profileRouter);
    app.use('/api/routines', routineRoutes.dailyRouter);
    app.use('/api/routine', routineRoutes);
    app.use('/api/account/profile', require('./src/routes/account-profile'));
    app.use('/api/auth', authRoutes());
    app.use(notFound);
    app.use(errorHandler);

    return app;
};

module.exports = createApp;
