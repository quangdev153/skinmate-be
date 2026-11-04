const { version } = require('../../package.json');

const schema = (name) => ({ $ref: `#/components/schemas/${name}` });
const response = (name) => ({ $ref: `#/components/responses/${name}` });
const json = (bodySchema) => ({
    'application/json': { schema: bodySchema },
});

const openApi = {
    openapi: '3.0.3',
    info: {
        title: 'SkinMate API',
        version,
        description:
            'Tài liệu các API đang hoạt động của SkinMate. Chọn một API, bấm ' +
            'Try it out, nhập dữ liệu rồi bấm Execute để gọi trực tiếp. ' +
            'Các API hiện tại đều công khai. Đăng ký và đăng nhập cấp phiên ' +
            'với access token 15 phút, refresh token 30 ngày; ' +
            'API refresh và logout sẽ được bổ sung sau.',
    },
    // Resolve against the browser origin, including a custom backend port.
    servers: [{ url: '/', description: 'Backend đang mở tài liệu này' }],
    tags: [
        { name: 'System', description: 'Trạng thái backend' },
        { name: 'Auth', description: 'Tài khoản người dùng' },
        { name: 'Scan', description: 'Quét bảng thành phần mỹ phẩm' },
    ],
    paths: {
        '/health': {
            get: {
                tags: ['System'],
                operationId: 'getHealth',
                summary: 'Kiểm tra backend đang hoạt động',
                responses: {
                    200: {
                        description: 'Backend đang hoạt động.',
                        content: json({
                            type: 'object',
                            required: ['status', 'timestamp'],
                            properties: {
                                status: { type: 'string', enum: ['UP'] },
                                timestamp: {
                                    type: 'string',
                                    format: 'date-time',
                                },
                            },
                        }),
                    },
                },
            },
        },
        '/api/auth/register': {
            post: {
                tags: ['Auth'],
                operationId: 'registerUser',
                summary: 'Đăng ký tài khoản',
                description:
                    'Tạo tài khoản và phiên đăng nhập đầu tiên, chưa xác minh email. ' +
                    'Access token có hạn 15 phút, refresh token 30 ngày. ' +
                    'Giới hạn 5 lần đăng ký/15 phút/IP. Dùng email mới khi thử ' +
                    'lại để tránh lỗi email đã đăng ký.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: schema('RegisterRequest'),
                            example: {
                                fullName: 'Nguyễn Lan Anh',
                                email: 'lananh@example.com',
                                password: 'SkinMate2026!',
                                confirmPassword: 'SkinMate2026!',
                                acceptedTerms: true,
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Tạo tài khoản và phiên thành công.',
                        content: json(schema('RegisterResponse')),
                    },
                    400: response('BadRequest'),
                    409: {
                        description: 'EMAIL_ALREADY_EXISTS: email đã đăng ký.',
                        content: json(schema('ApiError')),
                    },
                    413: response('BodyTooLarge'),
                    429: response('RateLimited'),
                    500: response('InternalError'),
                },
            },
        },
        '/api/auth/login': {
            post: {
                tags: ['Auth'],
                operationId: 'loginUser',
                summary: 'Đăng nhập tài khoản',
                description:
                    'Đăng nhập bằng email và mật khẩu. Mỗi lần thành công tạo ' +
                    'một phiên mới, giữ nguyên các phiên cũ. Chưa yêu cầu xác minh ' +
                    'email. Giới hạn 10 request/15 phút/IP, tính cả request ' +
                    'thành công và thất bại.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: schema('LoginRequest'),
                            example: {
                                email: 'lananh@example.com',
                                password: 'SkinMate2026!',
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Đăng nhập và tạo phiên mới thành công.',
                        content: json(schema('LoginResponse')),
                    },
                    400: response('BadRequest'),
                    401: {
                        description:
                            'INVALID_CREDENTIALS: Email hoặc mật khẩu không đúng. ' +
                            'Dùng cùng thông báo cho email không tồn tại và mật khẩu sai.',
                        content: json(schema('ApiError')),
                    },
                    413: response('BodyTooLarge'),
                    429: response('RateLimited'),
                    500: response('InternalError'),
                },
            },
        },
        '/api/scan': {
            post: {
                tags: ['Scan'],
                operationId: 'scanIngredients',
                summary: 'Quét ảnh bảng thành phần',
                description:
                    'Chọn file ảnh trong trường image, tối đa 10 MiB. ' +
                    'Backend dùng Gemini để trích xuất danh sách thành phần.',
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                required: ['image'],
                                properties: {
                                    image: {
                                        type: 'string',
                                        format: 'binary',
                                        description:
                                            'Ảnh bảng thành phần, tối đa 10 MiB. ' +
                                            'Ví dụ: JPG, PNG, WebP, HEIC hoặc BMP.',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Trả kết quả trích xuất thành phần.',
                        content: json({
                            type: 'object',
                            required: ['success', 'message', 'data'],
                            properties: {
                                success: { type: 'boolean', enum: [true] },
                                message: {
                                    type: 'string',
                                    example: 'Extract ingredients success',
                                },
                                data: schema('ScanResult'),
                            },
                        }),
                    },
                    400: {
                        description:
                            'Thiếu ảnh, sai trường upload hoặc request không hợp lệ.',
                        content: json({
                            oneOf: [schema('ScanError'), schema('ApiError')],
                        }),
                    },
                    413: {
                        description: 'UPLOAD_TOO_LARGE: ảnh vượt quá 10 MiB.',
                        content: json(schema('ApiError')),
                    },
                    429: response('RateLimited'),
                    500: {
                        description: 'Lỗi xử lý ảnh hoặc dịch vụ Gemini.',
                        content: json({
                            oneOf: [schema('ScanError'), schema('ApiError')],
                        }),
                    },
                },
            },
        },
    },
    components: {
        schemas: {
            RegisterRequest: {
                type: 'object',
                additionalProperties: false,
                required: [
                    'fullName',
                    'email',
                    'password',
                    'confirmPassword',
                    'acceptedTerms',
                ],
                properties: {
                    fullName: {
                        type: 'string',
                        minLength: 2,
                        maxLength: 100,
                        description: 'Họ và tên, bỏ khoảng trắng đầu/cuối.',
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        maxLength: 254,
                        description:
                            'Email được bỏ khoảng trắng đầu/cuối và chuyển thành chữ thường.',
                    },
                    password: {
                        type: 'string',
                        format: 'password',
                        writeOnly: true,
                        minLength: 8,
                        maxLength: 128,
                        description:
                            'Cần ít nhất một chữ in hoa A–Z và một ký tự đặc biệt (không tính chữ, số hoặc khoảng trắng). Giữ nguyên khoảng trắng và ký tự tiếng Việt.',
                    },
                    confirmPassword: {
                        type: 'string',
                        format: 'password',
                        writeOnly: true,
                        minLength: 8,
                        maxLength: 128,
                        description: 'Phải giống hoàn toàn mật khẩu.',
                    },
                    acceptedTerms: {
                        type: 'boolean',
                        enum: [true],
                        description:
                            'Đồng ý Điều khoản dịch vụ và Chính sách bảo mật; phải là boolean true.',
                    },
                },
            },
            LoginRequest: {
                type: 'object',
                additionalProperties: false,
                required: ['email', 'password'],
                properties: {
                    email: {
                        type: 'string',
                        format: 'email',
                        maxLength: 254,
                        description:
                            'Email được bỏ khoảng trắng đầu/cuối và chuyển thành chữ thường.',
                    },
                    password: {
                        type: 'string',
                        format: 'password',
                        writeOnly: true,
                        minLength: 1,
                        maxLength: 128,
                        description:
                            'Mật khẩu hiện tại. Giữ nguyên khoảng trắng và ký tự tiếng Việt.',
                    },
                },
            },
            PublicUser: {
                type: 'object',
                additionalProperties: false,
                required: ['id', 'fullName', 'email'],
                properties: {
                    id: { type: 'string', pattern: '^[a-f0-9]{24}$' },
                    fullName: { type: 'string', example: 'Nguyễn Lan Anh' },
                    email: {
                        type: 'string',
                        format: 'email',
                        example: 'lananh@example.com',
                    },
                },
            },
            RegisterResponse: {
                type: 'object',
                required: ['success', 'message', 'data'],
                properties: {
                    success: { type: 'boolean', enum: [true] },
                    message: {
                        type: 'string',
                        example: 'Đăng ký thành công.',
                    },
                    data: schema('AuthSessionData'),
                },
            },
            LoginResponse: {
                type: 'object',
                required: ['success', 'message', 'data'],
                properties: {
                    success: { type: 'boolean', enum: [true] },
                    message: {
                        type: 'string',
                        example: 'Đăng nhập thành công.',
                    },
                    data: schema('AuthSessionData'),
                },
            },
            AuthSessionData: {
                type: 'object',
                required: [
                    'user',
                    'accessToken',
                    'refreshToken',
                    'accessTokenExpiresAt',
                    'refreshTokenExpiresAt',
                ],
                properties: {
                    user: schema('PublicUser'),
                    accessToken: {
                        type: 'string',
                        description: 'JWT có hạn 15 phút.',
                    },
                    refreshToken: {
                        type: 'string',
                        description: 'JWT có hạn 30 ngày.',
                    },
                    accessTokenExpiresAt: {
                        type: 'string',
                        format: 'date-time',
                    },
                    refreshTokenExpiresAt: {
                        type: 'string',
                        format: 'date-time',
                    },
                },
            },
            ApiError: {
                type: 'object',
                required: ['success', 'message', 'error', 'requestId'],
                properties: {
                    success: { type: 'boolean', enum: [false] },
                    message: { type: 'string' },
                    error: {
                        type: 'object',
                        required: ['code', 'details'],
                        properties: {
                            code: { type: 'string' },
                            details: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        field: { type: 'string' },
                                        message: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    requestId: { type: 'string', format: 'uuid' },
                },
            },
            ScanResult: {
                type: 'object',
                description:
                    'Kết quả từ Gemini. Nếu không phân tích được JSON, backend ' +
                    'trả ingredients rỗng kèm rawText và message.',
                properties: {
                    ingredients: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['Water', 'Glycerin', 'Niacinamide'],
                    },
                    rawText: { type: 'string' },
                    message: { type: 'string' },
                },
                additionalProperties: true,
            },
            ScanError: {
                type: 'object',
                description: 'Định dạng lỗi trả trực tiếp từ scan controller.',
                required: ['success', 'message'],
                properties: {
                    success: { type: 'boolean', enum: [false] },
                    message: { type: 'string', example: 'No file uploaded' },
                    error: { type: 'string' },
                },
            },
        },
        responses: {
            BadRequest: {
                description:
                    'VALIDATION_ERROR: xem lỗi từng trường trong error.details. ' +
                    'INVALID_JSON: JSON không hợp lệ.',
                content: json(schema('ApiError')),
            },
            BodyTooLarge: {
                description: 'BODY_TOO_LARGE: JSON vượt quá giới hạn 1 MiB.',
                content: json(schema('ApiError')),
            },
            RateLimited: {
                description:
                    'RATE_LIMIT_EXCEEDED: quá số lần gọi cho phép. ' +
                    'Xem Retry-After để biết số giây cần chờ.',
                headers: {
                    'Retry-After': {
                        description: 'Số giây cần chờ trước khi thử lại.',
                        schema: { type: 'integer', minimum: 0 },
                    },
                },
                content: json(schema('ApiError')),
            },
            InternalError: {
                description: 'INTERNAL_SERVER_ERROR: lỗi hệ thống.',
                content: json(schema('ApiError')),
            },
        },
    },
};

module.exports = openApi;
