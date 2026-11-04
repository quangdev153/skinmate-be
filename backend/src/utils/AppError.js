class AppError extends Error {
    constructor(message, statusCode = 400, code = 'APP_ERROR', details = []) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, AppError);
    }
}

module.exports = AppError;
