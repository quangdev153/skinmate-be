const path = require('node:path');
const dotenv = require('dotenv');
const Joi = require('joi');

const parseOrigins = (origins) =>
    [
        ...new Set(
            origins
                .split(',')
                .map((origin) => origin.trim())
                .filter(Boolean)
        ),
    ].map((origin) => {
        const url = new URL(origin);
        if (
            !['http:', 'https:'].includes(url.protocol) ||
            url.username ||
            url.password ||
            url.pathname !== '/' ||
            url.search ||
            url.hash
        ) {
            throw new Error('Invalid origin.');
        }
        return url.origin;
    });

const schema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'test', 'production')
        .default('development'),
    PORT: Joi.number().integer().min(1).max(65535).default(5000),
    MONGO_URI: Joi.string()
        .trim()
        .pattern(/^mongodb(?:\+srv)?:\/\/[^/?#\s]+(?:[/?]\S*)?$/)
        .required(),
    LOG_LEVEL: Joi.string()
        .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
        .default('info'),
    CORS_ORIGINS: Joi.string()
        .allow('')
        .default('')
        .custom((value, helpers) => {
            try {
                parseOrigins(value);
                return value;
            } catch {
                return helpers.error('any.invalid');
            }
        }),
    SMTP_HOST: Joi.string().trim().allow('').default(''),
    SMTP_PORT: Joi.number().integer().min(1).max(65535).default(587),
    SMTP_SECURE: Joi.boolean().default(false),
    SMTP_USER: Joi.string().trim().allow('').default(''),
    SMTP_PASS: Joi.string().allow('').default(''),
    RESET_EMAIL_FROM: Joi.string().trim().max(254).allow('').default(''),
    PASSWORD_RESET_URL: Joi.string().trim().allow('').default('').custom((value, helpers) => {
        if (!value) return value;
        try {
            const url = new URL(value);
            if (!['exp:', 'exps:', 'https:', 'skinmate:'].includes(url.protocol) ||
                url.username || url.password || url.search || url.hash) {
                return helpers.error('any.invalid');
            }
            return value;
        } catch { return helpers.error('any.invalid'); }
    }),
    PASSWORD_RESET_PAGE_URL: Joi.string().trim().allow('').default('').custom((value, helpers) => {
        if (!value) return value;
        try {
            const url = new URL(value);
            if (!['http:', 'https:'].includes(url.protocol) ||
                url.username || url.password || url.search || url.hash ||
                url.pathname !== '/reset-password' ||
                (helpers.state.ancestors[0].NODE_ENV === 'production' && url.protocol !== 'https:')) {
                return helpers.error('any.invalid');
            }
            return value;
        } catch { return helpers.error('any.invalid'); }
    }),
    RATE_LIMIT_MAX: Joi.number().integer().positive().default(100),
    JWT_ACCESS_SECRET: Joi.string().trim().min(32).required(),
    JWT_REFRESH_SECRET: Joi.string()
        .trim()
        .min(32)
        .invalid(Joi.ref('JWT_ACCESS_SECRET'))
        .required(),
    TERMS_VERSION: Joi.string()
        .trim()
        .max(100)
        .required()
        .when('NODE_ENV', {
            is: 'production',
            then: Joi.invalid('development-only'),
        }),
    PRIVACY_VERSION: Joi.string()
        .trim()
        .max(100)
        .required()
        .when('NODE_ENV', {
            is: 'production',
            then: Joi.invalid('development-only'),
        }),
});

const parseConfig = (environment) => {
    const { error, value } = schema.validate(environment, {
        abortEarly: false,
        allowUnknown: true,
    });

    if (error) {
        const fields = [
            ...new Set(error.details.map((detail) => detail.path.join('.'))),
        ];
        const configError = new Error(
            `Invalid environment configuration: ${fields.join(', ')}. Check backend/.env.`
        );
        configError.code = 'INVALID_ENV';
        throw configError;
    }

    return Object.freeze({
        passwordResetUrl: value.PASSWORD_RESET_URL,
        passwordResetPageUrl: value.PASSWORD_RESET_PAGE_URL,
        smtpHost: value.SMTP_HOST,
        smtpPort: value.SMTP_PORT,
        smtpSecure: value.SMTP_SECURE,
        smtpUser: value.SMTP_USER,
        smtpPass: value.SMTP_PASS,
        resetEmailFrom: value.RESET_EMAIL_FROM,
        nodeEnv: value.NODE_ENV,
        port: value.PORT,
        mongoUri: value.MONGO_URI,
        logLevel: value.LOG_LEVEL,
        corsOrigins: Object.freeze(parseOrigins(value.CORS_ORIGINS)),
        rateLimitMax: value.RATE_LIMIT_MAX,
        jwtAccessSecret: value.JWT_ACCESS_SECRET,
        jwtRefreshSecret: value.JWT_REFRESH_SECRET,
        termsVersion: value.TERMS_VERSION,
        privacyVersion: value.PRIVACY_VERSION,
    });
};

const loadConfig = () => {
    const result = dotenv.config({
        path: path.resolve(__dirname, '../../.env'),
        quiet: true,
        override: false,
    });

    if (result.error && result.error.code !== 'ENOENT') {
        const error = new Error('Unable to read backend/.env.');
        error.code = 'ENV_READ_ERROR';
        throw error;
    }

    return parseConfig(process.env);
};

module.exports = { loadConfig, parseConfig };
