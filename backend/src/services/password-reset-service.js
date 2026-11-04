const { createHash, randomBytes } = require('node:crypto');
const argon2 = require('argon2');
const User = require('../models/User');
const { createPasswordResetEmail } = require('./password-reset-email');
const AppError = require('../utils/AppError');

const hashToken = token => createHash('sha256').update(token).digest('hex');
const invalidToken = () => new AppError(
    'Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới.',
    400,
    'INVALID_RESET_TOKEN'
);

const requestReset = async ({ email }, config) => {
    if (!config.smtpHost || !config.smtpUser || !config.smtpPass ||
        !config.resetEmailFrom || !config.passwordResetUrl || !config.passwordResetPageUrl) {
        throw new AppError('Chức năng gửi email chưa được cấu hình.', 503, 'MAIL_UNAVAILABLE');
    }
    const nodemailer = require('nodemailer');
    const token = randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const user = await User.findOneAndUpdate(
        { email, isActive: { $ne: false } },
        { $set: {
            passwordResetTokenHash: tokenHash,
            passwordResetExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        } },
        { returnDocument: 'after' }
    );
    if (!user) return { accountNotEligible: true };

    const url = new URL(config.passwordResetPageUrl);
    // Fragments stay in the browser and are not sent in HTTP requests or access logs.
    url.hash = new URLSearchParams({ token }).toString();
    let transport;
    try {
        transport = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        requireTLS: !config.smtpSecure,
        auth: { user: config.smtpUser, pass: config.smtpPass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        logger: false,
        debug: false,
        });
        const result = await transport.sendMail({
            from: config.resetEmailFrom,
            to: user.email,
            ...createPasswordResetEmail(url.href),
            disableFileAccess: true,
            disableUrlAccess: true,
        });
        if (!result.accepted?.length) throw new Error('Mail recipient rejected.');
        return { deliveryAccepted: true };
    } catch (error) {
        await User.updateOne(
            { _id: user._id, passwordResetTokenHash: tokenHash },
            { $unset: { passwordResetTokenHash: '', passwordResetExpiresAt: '' } }
        );
        // Preserve the same public response for existing and unknown accounts.
        // Do not log the provider response, recipient, token or recovery URL.
        return {
            deliveryFailed: true,
            providerStatus: Number.isInteger(error.responseCode) ? error.responseCode : undefined,
            providerError: ['EAUTH', 'ECONNECTION', 'ETIMEDOUT', 'ESOCKET', 'EENVELOPE', 'EMESSAGE'].includes(error.code)
                ? error.code : 'SMTP_ERROR',
        };
    } finally {
        transport?.close();
    }
};

const resetPassword = async ({ token, password }) => {
    const filter = {
        passwordResetTokenHash: hashToken(token),
        passwordResetExpiresAt: { $gt: new Date() },
        isActive: { $ne: false },
    };
    if (!await User.exists(filter)) throw invalidToken();
    const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1,
    });
    // Conditional single-document update consumes the token atomically, including
    // on standalone MongoDB. Concurrent requests cannot both change the password.
    const user = await User.findOneAndUpdate(
        { ...filter, passwordResetExpiresAt: { $gt: new Date() } },
        {
            $set: { passwordHash, passwordChangedAt: new Date() },
            $unset: { passwordResetTokenHash: '', passwordResetExpiresAt: '' },
        },
        { returnDocument: 'after', runValidators: true }
    );
    if (!user) throw invalidToken();
};

module.exports = { requestReset, resetPassword };
