const mongoose = require('mongoose');
const path = require('node:path');
const fs = require('node:fs');

const createApp = require('./app');
const { loadConfig } = require('./src/config/env');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const AuthSession = require('./src/models/AuthSession');
const { startExpiryScheduler } = require('./src/services/expiryNotificationService');

let server;
let shutdownPromise;
let stopExpiryScheduler;

const ensureUploadDirectories = () => {
    [
        path.join(__dirname, 'temp'),
        path.join(__dirname, 'uploads', 'products'),
        path.join(__dirname, 'uploads', 'community'),
    ].forEach((directory) => fs.mkdirSync(directory, { recursive: true }));
};

const reportShutdownError = () => {
    console.error('Unable to close server resources.');
    process.exitCode = 1;
};

const shutdown = () => {
    if (shutdownPromise) return shutdownPromise;
    shutdownPromise = (async () => {
        const timeout = setTimeout(() => {
            console.error('Shutdown exceeded 10 seconds.');
            server?.closeAllConnections();
            process.exit(1);
        }, 10000);
        timeout.unref();
        try {
            try {
                if (typeof stopExpiryScheduler === 'function') {
                    stopExpiryScheduler();
                    stopExpiryScheduler = undefined;
                }
                if (server?.listening) {
                    await new Promise((resolve, reject) => {
                        server.close((error) => (error ? reject(error) : resolve()));
                    });
                }
            } finally {
                await mongoose.disconnect();
            }
        } finally {
            clearTimeout(timeout);
            process.removeListener('SIGINT', handleSignal);
            process.removeListener('SIGTERM', handleSignal);
        }
    })();
    return shutdownPromise;
};

function handleSignal() {
    shutdown().catch(reportShutdownError);
}

const startServer = async () => {
    try {
        const config = loadConfig();
        ensureUploadDirectories();
        const app = createApp(config);
        await connectDB(config.mongoUri);
        await Promise.all([User.init(), AuthSession.init()]);
        console.log('Database connected successfully.');
        await new Promise((resolve, reject) => {
            server = app.listen(config.port, '0.0.0.0');
            server.once('error', reject);
            server.once('listening', () => {
                server.removeListener('error', reject);
                resolve();
            });
        });
        process.on('SIGINT', handleSignal);
        process.on('SIGTERM', handleSignal);
        console.log(`Server is running on http://0.0.0.0:${server.address().port}`);
        console.log(`Swagger UI: http://localhost:${server.address().port}/api-docs`);
        const cleanup = startExpiryScheduler();
        if (typeof cleanup === 'function') stopExpiryScheduler = cleanup;
        return server;
    } catch (error) {
        await shutdown().catch(reportShutdownError);
        throw error;
    }
};

if (require.main === module) {
    startServer().catch((error) => {
        process.exitCode = 1;
        if (['INVALID_ENV', 'ENV_READ_ERROR'].includes(error.code)) {
            console.error(error.message);
        } else {
            console.error(`Server startup failed (${error.code || error.name || 'UNKNOWN'}). Check backend configuration and module requirements.`);
        }
    });
}

module.exports = { startServer, shutdown };
