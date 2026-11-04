const Joi = require('joi');
const AppError = require('../utils/AppError');

const registerSchema = Joi.object({
    fullName: Joi.string().trim().min(2).max(100).required().messages({
        'any.required': 'Vui lòng nhập họ và tên.',
        'string.base': 'Họ và tên phải là chuỗi ký tự.',
        'string.empty': 'Vui lòng nhập họ và tên.',
        'string.min': 'Họ và tên cần ít nhất 2 ký tự.',
        'string.max': 'Họ và tên không được vượt quá 100 ký tự.',
    }),
    email: Joi.string()
        .trim()
        .lowercase()
        .email({ tlds: { allow: false } })
        .max(254)
        .required()
        .messages({
            'any.required': 'Vui lòng nhập email.',
            'string.base': 'Email phải là chuỗi ký tự.',
            'string.empty': 'Vui lòng nhập email.',
            'string.email': 'Địa chỉ email chưa đúng định dạng.',
            'string.max': 'Email không được vượt quá 254 ký tự.',
        }),
    password: Joi.string().min(8).max(128)
        .pattern(/[A-Z]/)
        .pattern(/[^\p{L}\p{N}\s]/u)
        .required().messages({
        'any.required': 'Vui lòng nhập mật khẩu.',
        'string.base': 'Mật khẩu phải là chuỗi ký tự.',
        'string.empty': 'Vui lòng nhập mật khẩu.',
        'string.pattern.base': 'Mật khẩu cần ít nhất một chữ in hoa và một ký tự đặc biệt.',
        'string.min': 'Mật khẩu cần ít nhất 8 ký tự.',
        'string.max': 'Mật khẩu không được vượt quá 128 ký tự.',
    }),
    confirmPassword: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({
            'any.required': 'Vui lòng xác nhận mật khẩu.',
            'any.only': 'Mật khẩu xác nhận chưa trùng khớp.',
            'string.base': 'Mật khẩu xác nhận phải là chuỗi ký tự.',
            'string.empty': 'Vui lòng xác nhận mật khẩu.',
        }),
    acceptedTerms: Joi.boolean().strict().valid(true).required().messages({
        'any.required':
            'Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.',
        'any.only':
            'Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.',
        'boolean.base': 'Thông tin đồng ý điều khoản phải là giá trị boolean.',
    }),
})
    .required()
    .messages({
        'any.required': 'Vui lòng gửi thông tin đăng ký.',
        'object.base': 'Thông tin đăng ký phải là một đối tượng JSON.',
        'object.unknown': 'Trường thông tin không được hỗ trợ.',
    });

const loginSchema = Joi.object({
    email: registerSchema.extract('email'),
    password: Joi.string().max(128).required().messages({
        'any.required': 'Vui lòng nhập mật khẩu.',
        'string.base': 'Mật khẩu phải là chuỗi ký tự.',
        'string.empty': 'Vui lòng nhập mật khẩu.',
        'string.max': 'Mật khẩu không được vượt quá 128 ký tự.',
    }),
})
    .required()
    .messages({
        'any.required': 'Vui lòng gửi thông tin đăng nhập.',
        'object.base': 'Thông tin đăng nhập phải là một đối tượng JSON.',
        'object.unknown': 'Trường thông tin không được hỗ trợ.',
    });

const validateAuthBody = (schema, message) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        allowUnknown: false,
    });

    if (error) {
        return next(
            new AppError(
                message,
                400,
                'VALIDATION_ERROR',
                error.details.map((detail) => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                }))
            )
        );
    }

    req.body = value;
    return next();
};

const validateRegister = validateAuthBody(
    registerSchema,
    'Thông tin đăng ký chưa hợp lệ.'
);
const validateLogin = validateAuthBody(
    loginSchema,
    'Thông tin đăng nhập chưa hợp lệ.'
);

const validateForgotPassword = validateAuthBody(
    Joi.object({ email: registerSchema.extract('email') }).required(),
    'Vui lòng nhập email hợp lệ.'
);
const validateResetPassword = validateAuthBody(
    Joi.object({
        token: Joi.string().pattern(/^[a-f0-9]{64}$/).required(),
        password: registerSchema.extract('password'),
        confirmPassword: registerSchema.extract('confirmPassword'),
    }).required(),
    'Thông tin đặt lại mật khẩu chưa hợp lệ.'
);

module.exports = {
    validateForgotPassword,
    validateResetPassword,
    registerSchema,
    validateRegister,
    loginSchema,
    validateLogin,
};
