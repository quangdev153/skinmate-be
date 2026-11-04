const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 254,
        },
        passwordHash: { type: String, required: true, select: false },
        avatarUrl: { type: String, default: null },
        phoneNumber: { type: String, default: '', trim: true, maxlength: 20 },
        googleSubject: { type: String, default: null },
        passwordResetTokenHash: { type: String, default: null, select: false },
        passwordResetExpiresAt: { type: Date, default: null },
        googleExchangeCodeHash: { type: String, default: null, select: false },
        googleExchangeCodeExpiresAt: { type: Date, default: null },
        skinProfile: {
            skinType: { type: String, default: null },
            allergies: { type: [String], default: [] },
            currentConcerns: { type: [String], default: [] },
        },
        isActive: { type: Boolean, default: true },
        lastLoginAt: { type: Date, default: null },
        passwordChangedAt: { type: Date, default: null },
        emailVerified: { type: Boolean, default: false },
        termsAcceptedAt: { type: Date, required: true },
        termsVersion: { type: String, required: true },
        privacyVersion: { type: String, required: true },
    },
    {
        timestamps: true,
        toJSON: {
            transform(_document, value) {
                delete value.passwordHash;
                delete value.passwordResetTokenHash;
                delete value.googleExchangeCodeHash;
                return value;
            },
        },
    }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index(
    { googleSubject: 1 },
    {
        unique: true,
        partialFilterExpression: { googleSubject: { $type: 'string' } },
    }
);

module.exports = mongoose.model('User', userSchema);
