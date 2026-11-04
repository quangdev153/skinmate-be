const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createPasswordResetEmail } = require('./password-reset-email');

test('password reset email includes a button and plain-text fallback', () => {
    const url = 'exp://127.0.0.1:8081/--/reset-password?token=test';
    const email = createPasswordResetEmail(url);
    assert.ok(email.html.includes(`href="${url}"`));
    assert.ok(email.html.includes('Reset password</a>'));
    assert.ok(email.html.includes('15 minutes'));
    assert.ok(email.text.includes(url));
    assert.ok(email.text.includes('only be used once'));
    assert.ok(!email.html.includes(`>${url}<`));
});

test('password reset link is escaped for an HTML attribute', () => {
    const email = createPasswordResetEmail('https://example.invalid/reset?a=1&b="test"');
    assert.ok(email.html.includes('a=1&amp;b=&quot;test&quot;'));
});
