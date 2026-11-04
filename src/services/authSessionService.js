const { createHash, randomUUID } = require('node:crypto');
const jwt = require('jsonwebtoken');
const AuthSession = require('../models/AuthSession');

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
const JWT_ISSUER = 'skinmate-api';

const createInitialSession = async (user, config, transaction) => {
    const issuedAt = Math.floor(Date.now() / 1000);
    const accessExpiresAt = issuedAt + ACCESS_TOKEN_TTL_SECONDS;
    const refreshExpiresAt = issuedAt + REFRESH_TOKEN_TTL_SECONDS;
    const authSession = new AuthSession({
        userId: user._id,
        expiresAt: new Date(refreshExpiresAt * 1000),
    });
    const claims = {
        sub: user.id,
        sid: authSession.id,
        iat: issuedAt,
    };

    const accessToken = jwt.sign(
        { ...claims, jti: randomUUID(), exp: accessExpiresAt },
        config.jwtAccessSecret,
        {
            algorithm: 'HS256',
            issuer: JWT_ISSUER,
            audience: 'skinmate-mobile',
        }
    );
    const refreshToken = jwt.sign(
        { ...claims, jti: randomUUID(), exp: refreshExpiresAt },
        config.jwtRefreshSecret,
        {
            algorithm: 'HS256',
            issuer: JWT_ISSUER,
            audience: 'skinmate-refresh',
        }
    );

    authSession.refreshTokenHash = createHash('sha256')
        .update(refreshToken)
        .digest('hex');
    await authSession.save({ session: transaction });

    return {
        accessToken,
        refreshToken,
        accessTokenExpiresAt: new Date(accessExpiresAt * 1000).toISOString(),
        refreshTokenExpiresAt: authSession.expiresAt.toISOString(),
    };
};

module.exports = { createInitialSession };
