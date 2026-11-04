const mongoose = require('mongoose');
const argon2 = require('argon2');
const User = require('../models/User');
const authSessionService = require('./authSessionService');
const AppError = require('../utils/AppError');

// Public dummy hash with the same Argon2id cost as registration. Unknown emails
// still perform password verification instead of returning before the hash work.
const DUMMY_PASSWORD_HASH =
    '$argon2id$v=19$m=19456,p=1,t=2$/eeM6oeuJB3Mi9K3y+bdzw$ye6PUa0KUbW3G9z38oddTyYTAGY6zFzv4+87/MFBE18';

const toPublicUser = (user) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    avatarUrl: user.avatarUrl || null,
    phoneNumber: user.phoneNumber || '',
});

const emailAlreadyExists = () =>
    new AppError(
        'Email này đã được đăng ký. Vui lòng đăng nhập.',
        409,
        'EMAIL_ALREADY_EXISTS',
        [{ field: 'email', message: 'Email này đã được đăng ký.' }]
    );

const register = async (input, config) => {
    const email = input.email.trim().toLowerCase();

    if (await User.exists({ email })) {
        throw emailAlreadyExists();
    }

    // Hash before opening the transaction so expensive CPU work holds no locks.
    const passwordHash = await argon2.hash(input.password, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
    });

    try {
        return await mongoose.connection.transaction(async (transaction) => {
            const user = new User({
                fullName: input.fullName,
                email,
                passwordHash,
                termsAcceptedAt: new Date(),
                termsVersion: config.termsVersion,
                privacyVersion: config.privacyVersion,
            });
            await user.save({ session: transaction });

            const tokens = await authSessionService.createInitialSession(
                user,
                config,
                transaction
            );

            return {
                user: toPublicUser(user),
                ...tokens,
            };
        });
    } catch (error) {
        // The unique index is authoritative when registrations race each other.
        if (
            error.code === 11000 &&
            (error.keyPattern?.email || error.keyValue?.email)
        ) {
            throw emailAlreadyExists();
        }
        throw error;
    }
};

const login = async (input, config) => {
    const email = input.email.trim().toLowerCase();
    const user = await User.findOne({ email }).select('+passwordHash');
    const passwordMatches = await argon2.verify(
        user ? user.passwordHash : DUMMY_PASSWORD_HASH,
        input.password
    );

    if (!user || user.isActive === false || !passwordMatches) {
        throw new AppError(
            'Email hoặc mật khẩu không đúng.',
            401,
            'INVALID_CREDENTIALS'
        );
    }

    const tokens = await authSessionService.createInitialSession(user, config);

    return { user: toPublicUser(user), ...tokens };
};

module.exports = { register, login };
