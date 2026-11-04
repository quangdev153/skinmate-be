const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const AuthSession = require('../models/AuthSession');
const AppError = require('../utils/AppError');

const authenticate = async (req, _res, next) => {
    const header = req.get('authorization');
    const token = header?.startsWith('Bearer ')
        ? header.slice('Bearer '.length).trim()
        : null;

    if (!token) {
        return next(
            new AppError(
                'Bạn cần đăng nhập để thực hiện thao tác này.',
                401,
                'AUTH_REQUIRED'
            )
        );
    }

    try {
        const payload = jwt.verify(token, req.app.locals.config.jwtAccessSecret, {
            algorithms: ['HS256'],
            issuer: 'skinmate-api',
            audience: 'skinmate-mobile',
        });

        if (
            typeof payload.sub !== 'string' ||
            !mongoose.Types.ObjectId.isValid(payload.sub)
        ) {
            throw new Error('Invalid access token subject.');
        }

        const [user, session] = await Promise.all([
            User.findById(payload.sub).select('isActive passwordChangedAt').lean(),
            typeof payload.sid === 'string' && mongoose.Types.ObjectId.isValid(payload.sid)
                ? AuthSession.findOne({ _id: payload.sid, userId: payload.sub, revokedAt: null, expiresAt: { $gt: new Date() } }).lean()
                : null,
        ]);
        if (!user || user.isActive === false || !session ||
            (user.passwordChangedAt && session.createdAt <= user.passwordChangedAt)) {
            throw new Error('Session no longer active.');
        }
        req.user = { id: payload.sub };
        return next();
    } catch (error) {
        if (!['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name) &&
            !['Invalid access token subject.', 'Session no longer active.'].includes(error.message)) {
            return next(error);
        }
        return next(
            new AppError(
                'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
                401,
                'INVALID_ACCESS_TOKEN'
            )
        );
    }
};

module.exports = authenticate;
