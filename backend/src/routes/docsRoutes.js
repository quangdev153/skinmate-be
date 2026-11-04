const express = require('express');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');

const createDocsRoutes = (config) => {
    const router = express.Router();
    const options = {
        customSiteTitle: 'SkinMate API Docs',
        swaggerOptions: {
            url: '/api-docs.json',
            validatorUrl: null,
            persistAuthorization: false,
            displayRequestDuration: true,
            filter: true,
            docExpansion: 'list',
        },
    };

    // Keep script restrictions; allow local HTTP assets during development.
    router.use(
        helmet.contentSecurityPolicy({
            directives: {
                connectSrc: ["'self'"],
                upgradeInsecureRequests:
                    config.nodeEnv === 'production' ? [] : null,
            },
        })
    );
    router.use(
        swaggerUi.serveFiles(null, options),
        swaggerUi.setup(null, options)
    );

    return router;
};

module.exports = createDocsRoutes;
