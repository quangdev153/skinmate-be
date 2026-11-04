const authService = require('../services/authService');
const { sendSuccess } = require('../utils/response');

const register = async (req, res, next) => {
    try {
        const data = await authService.register(
            req.body,
            req.app.locals.config
        );

        return sendSuccess(res, {
            statusCode: 201,
            message: 'Đăng ký thành công.',
            data,
        });
    } catch (error) {
        return next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const data = await authService.login(req.body, req.app.locals.config);

        return sendSuccess(res, {
            statusCode: 200,
            message: 'Đăng nhập thành công.',
            data,
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = { register, login };
