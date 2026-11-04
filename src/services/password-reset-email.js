const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

const createPasswordResetEmail = (url) => ({
    subject: 'Reset your SkinMate password',
    text: `Reset your SkinMate password\n\nWe received a request to reset your password. Open this link on the device where you use SkinMate:\n\n${url}\n\nThis link expires in 15 minutes and can only be used once. If you did not request this, you can ignore this email. Your password will stay unchanged.\n\nNever share this email or reset link with anyone.\nThe SkinMate team`,
    html: `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Reset your password</title></head>
<body style="margin:0;padding:0;background-color:#FEFAF3;color:#1e293b;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">Your secure password reset link expires in 15 minutes.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FEFAF3;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
<tr><td style="padding:0 0 24px;text-align:center;font-size:24px;font-weight:bold;color:#0f766e;">SkinMate</td></tr>
<tr><td style="padding:32px 24px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:20px;">
<p style="margin:0 0 12px;font-size:12px;font-weight:bold;letter-spacing:2px;color:#0f766e;">ACCOUNT SECURITY</p>
<h1 style="margin:0 0 20px;font-size:28px;line-height:36px;">A fresh start for your password</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:26px;color:#64748b;">We received a request to reset your SkinMate password. Tap the button below on the device where you use the app to choose a new one.</p>
<table role="presentation" cellspacing="0" cellpadding="0"><tr><td bgcolor="#0f766e" style="border-radius:28px;text-align:center;"><a href="${escapeHtml(url)}" style="display:inline-block;padding:16px 28px;border:1px solid #0f766e;border-radius:28px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">Reset password</a></td></tr></table>
<p style="margin:24px 0;font-size:14px;line-height:22px;color:#64748b;">This link expires in <strong>15 minutes</strong> and can only be used once. Never share this email or reset link.</p>
<hr style="border:0;border-top:1px solid #e2e8f0;margin:24px 0;">
<p style="margin:0;font-size:14px;line-height:22px;color:#64748b;">Didn't request a password reset? You can safely ignore this email. Your password will stay unchanged.</p>
</td></tr>
<tr><td style="padding:24px 16px;text-align:center;font-size:12px;line-height:20px;color:#64748b;">Gentle care for your skin. Thoughtful care for your account.<br>The SkinMate team</td></tr>
</table></td></tr></table>
</body></html>`,
});

module.exports = { createPasswordResetEmail };
