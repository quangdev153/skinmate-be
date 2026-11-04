const { randomBytes } = require('node:crypto');
const express = require('express');
const helmet = require('helmet');

const createPasswordResetPageRoutes = (config) => {
    const router = express.Router();

    router.get('/reset-password', (req, res) => {
        res.set({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
        if (!config.passwordResetUrl) {
            return res.status(503).type('text').send('Password recovery is not configured. Please try again later.');
        }
        const nonce = randomBytes(16).toString('base64');
        helmet.contentSecurityPolicy({
            directives: {
                defaultSrc: ["'none'"],
                scriptSrc: [`'nonce-${nonce}'`],
                styleSrc: [`'nonce-${nonce}'`],
                baseUri: ["'none'"],
                formAction: ["'none'"],
                frameAncestors: ["'none'"],
                upgradeInsecureRequests: config.nodeEnv === 'production' ? [] : null,
            },
        })(req, res, () => {});
        const target = JSON.stringify(config.passwordResetUrl).replace(/</g, '\\u003c');
        return res.type('html').send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<title>Reset your password</title>
<style nonce="${nonce}">
:root { color-scheme: light; --primary: #0f766e; --background: #fefaf3; --text: #1e293b; --muted: #64748b; }
* { box-sizing: border-box; }
body { margin: 0; padding: 32px 16px; min-height: 100vh; display: grid; place-items: center; background: var(--background); color: var(--text); font: 16px/1.6 system-ui, sans-serif; }
main { width: 100%; max-width: 480px; padding: 32px 24px; border-radius: 24px; background: white; box-shadow: 0 12px 40px #1e293b0d; }
.brand { color: var(--primary); font-size: 22px; font-weight: 750; }
h1 { font-size: 28px; line-height: 1.25; }
p { color: var(--muted); }
a { display: block; margin: 24px 0; padding: 15px 20px; border-radius: 28px; background: var(--primary); color: white; text-decoration: none; text-align: center; font-weight: 700; }
a:focus-visible { outline: 3px solid var(--text); outline-offset: 4px; }
[hidden] { display: none; }
small { color: var(--muted); }
</style>
</head>
<body>
<main>
<div class="brand">SkinMate</div>
<h1>Let's reset your password</h1>
<p id="message" role="status">Checking your recovery link…</p>
<a id="open-app" hidden>Open in Expo Go</a>
<p>Keep Expo Go installed and your SkinMate development server running. If nothing opens, use your browser's menu to open this page in Chrome, then try again.</p>
<small>This link expires after 15 minutes and can only reset your password once. Never share it.</small>
<noscript><p>Please enable JavaScript to open the recovery screen.</p></noscript>
</main>
<script nonce="${nonce}">
(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
    const message = document.getElementById('message');
    const link = document.getElementById('open-app');
    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
        message.textContent = 'This recovery link is incomplete or invalid. Request a new email from the app.';
        return;
    }
    const target = new URL(${target});
    target.searchParams.set('token', token);
    link.href = target.href;
    link.hidden = false;
    message.textContent = 'Tap below to open SkinMate and choose a new password. Your browser may ask for permission to open Expo Go.';
})();
</script>
</body>
</html>`);
    });

    return router;
};

module.exports = createPasswordResetPageRoutes;
