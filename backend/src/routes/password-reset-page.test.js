const assert = require('node:assert/strict');
const { test } = require('node:test');
const vm = require('node:vm');
const express = require('express');
const helmet = require('helmet');
const request = require('supertest');
const createRoutes = require('./password-reset-page');

const config = {
    nodeEnv: 'development',
    passwordResetUrl: 'exp://10.0.2.2:8081/--/reset-password',
};
const createApp = (settings = config) => {
    const app = express();
    app.use(helmet());
    app.use(createRoutes(settings));
    return app;
};

const runPageScript = (html, hash) => {
    const elements = { message: {}, 'open-app': { hidden: true } };
    const script = html.match(/<script nonce="[^"]+">([\s\S]*?)<\/script>/)[1];
    vm.runInNewContext(script, {
        URL, URLSearchParams,
        window: { location: { hash } },
        document: { getElementById: id => elements[id] },
    });
    return elements;
};

test('recovery page is private and permits only nonce-authorized script', async () => {
    const response = await request(createApp()).get('/reset-password').expect(200);
    assert.match(response.headers['content-type'], /text\/html/);
    assert.equal(response.headers['cache-control'], 'no-store');
    assert.equal(response.headers['referrer-policy'], 'no-referrer');
    const nonce = response.text.match(/<script nonce="([^"]+)">/)[1];
    assert.ok(response.headers['content-security-policy'].includes(`script-src 'nonce-${nonce}'`));
    assert.ok(!response.headers['content-security-policy'].includes('upgrade-insecure-requests'));
    assert.ok(!response.text.includes('http-equiv="refresh"'));
});

test('fragment token reaches the configured app only after a user clicks the link', async () => {
    const { text } = await request(createApp()).get('/reset-password').expect(200);
    const token = 'a'.repeat(64);
    const elements = runPageScript(text, `#token=${token}`);
    assert.equal(elements['open-app'].hidden, false);
    const destination = new URL(elements['open-app'].href);
    assert.equal(destination.protocol, 'exp:');
    assert.equal(destination.pathname, '/--/reset-password');
    assert.equal(destination.searchParams.get('token'), token);
    assert.equal(destination.hash, '');
});

test('missing and malformed tokens never produce an app link', async () => {
    const { text } = await request(createApp()).get('/reset-password').expect(200);
    for (const hash of ['', '#token=bad', '#token=%3Cscript%3E']) {
        const elements = runPageScript(text, hash);
        assert.equal(elements['open-app'].hidden, true);
        assert.equal(elements['open-app'].href, undefined);
        assert.match(elements.message.textContent, /invalid/);
    }
});

test('unconfigured page fails without rendering an app link', async () => {
    await request(createApp({})).get('/reset-password').expect(503);
});

test('production page preserves HTTPS upgrade directive', async () => {
    const response = await request(createApp({ ...config, nodeEnv: 'production' }))
        .get('/reset-password').expect(200);
    assert.match(response.headers['content-security-policy'], /upgrade-insecure-requests/);
});
