const assert = require('node:assert/strict');
const { test } = require('node:test');
const { parseConfig } = require('./env');

const environment = {
    MONGO_URI: 'mongodb://localhost/test',
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
    TERMS_VERSION: 'development-only',
    PRIVACY_VERSION: 'development-only',
};

test('SMTP settings parse TLS and port values from environment strings', () => {
    const config = parseConfig({ ...environment, SMTP_PORT: '465', SMTP_SECURE: 'true' });
    assert.equal(config.smtpPort, 465);
    assert.equal(config.smtpSecure, true);
});

test('SMTP defaults to STARTTLS on port 587', () => {
    const config = parseConfig(environment);
    assert.equal(config.smtpPort, 587);
    assert.equal(config.smtpSecure, false);
});

test('browser recovery URL accepts emulator HTTP and rejects unsafe URLs', () => {
    const config = parseConfig({ ...environment, PASSWORD_RESET_PAGE_URL: 'http://10.0.2.2:5000/reset-password' });
    assert.equal(config.passwordResetPageUrl, 'http://10.0.2.2:5000/reset-password');
    for (const url of ['exp://host/reset-password', 'https://host/wrong-path', 'https://host/reset-password?token=value', 'https://host/reset-password#token=value', 'https://user:pass@host/reset-password']) {
        assert.throws(() => parseConfig({ ...environment, PASSWORD_RESET_PAGE_URL: url }), /PASSWORD_RESET_PAGE_URL/);
    }
});

test('production browser recovery URL requires HTTPS', () => {
    const production = { ...environment, NODE_ENV: 'production', TERMS_VERSION: 'v1', PRIVACY_VERSION: 'v1' };
    assert.throws(() => parseConfig({ ...production, PASSWORD_RESET_PAGE_URL: 'http://host/reset-password' }), /PASSWORD_RESET_PAGE_URL/);
    assert.equal(parseConfig({ ...production, PASSWORD_RESET_PAGE_URL: 'https://host/reset-password' }).passwordResetPageUrl, 'https://host/reset-password');
});

test('invalid SMTP settings are rejected without exposing their values', () => {
    assert.throws(() => parseConfig({ ...environment, SMTP_SECURE: 'invalid' }), /SMTP_SECURE/);
    assert.throws(() => parseConfig({ ...environment, SMTP_PORT: '70000' }), /SMTP_PORT/);
});
