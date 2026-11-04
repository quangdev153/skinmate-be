const express = require('express');
const authController = require('../controllers/authController');
const { validateRegister, validateLogin, validateForgotPassword, validateResetPassword } = require('../validations/authDto');
const passwordResetService = require('../services/password-reset-service');
const { sendSuccess } = require('../utils/response');
const {
    createRegisterRateLimiter,
    createLoginRateLimiter,
} = require('../middlewares/authRateLimitMiddleware');

const createAuthRoutes = () => {
    const router = express.Router();

    router.use((req, res, next) => {
        res.set('Cache-Control', 'no-store');
        return next();
    });
    router.post(
        '/register',
        createRegisterRateLimiter(),
        validateRegister,
        authController.register
    );
    router.post(
        '/login',
        createLoginRateLimiter(),
        validateLogin,
        authController.login
    );

    router.post('/forgot-password', createRegisterRateLimiter(), validateForgotPassword, async (req, res) => {
        const result = await passwordResetService.requestReset(req.body, req.app.locals.config);
        if (result?.deliveryFailed) {
            req.log?.warn({ providerStatus: result.providerStatus, providerError: result.providerError }, 'Password recovery email delivery failed.');
        } else if (req.app.locals.config.nodeEnv === 'development') {
            req.log?.info({ recoveryOutcome: result?.accountNotEligible ? 'ACCOUNT_NOT_ELIGIBLE' : 'PROVIDER_ACCEPTED' }, 'Password recovery processing completed.');
        }
        return sendSuccess(res, {
            message: 'Nếu email thuộc tài khoản đang hoạt động, bạn sẽ nhận được liên kết đặt lại mật khẩu.',
            data: {},
        });
    });
    router.post('/reset-password', createLoginRateLimiter(), validateResetPassword, async (req, res) => {
        await passwordResetService.resetPassword(req.body);
        return sendSuccess(res, { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.', data: {} });
    });

    return router;
};

module.exports = createAuthRoutes;
