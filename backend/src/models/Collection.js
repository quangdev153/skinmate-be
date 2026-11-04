const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        productName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        productType: {
            type: String,
            required: true,
            enum: [
                'cleanser',
                'toner',
                'essences',
                'cream',
                'oil',
                'serum',
                'treatment',
                'moisturizer',
                'sunscreen',
                'mask',
                'exfoliant',
                'others',
            ],
        },

        productIcon: {
            type: String,
            enum: [
                'serum',
                'chai_to',
                'hu',
                'tuyp_xanh',
                'oil',
                'pum',
                'mask',
                'tuyp',
                'xit'
            ]
        },

        productImageUrl: {
            type: String,
            default: null,
            trim: true,
        },

        ingredients: {
            type: [String],
            default: [],
        },

        analysisResult: {
            baseScore: { type: Number, default: 70 },
            contextualScore: { type: Number, default: 70 },
            verdict: { type: String, default: null },
            conflictResolution: { type: String, default: null },
            bestPairingInCloset: { type: String, default: null },
            futurePlan: { type: String, default: null },
        },

        openedDate: {
            type: Date,
            default: null,
        },

        expirationDate: {
            type: Date,
            default: null,
        },

        paoDays: {
            type: Number,
            default: null,
            min: 1,
        },

        note: {
            type: String,
            default: null,
            trim: true,
            maxlength: 1000,
        },

        status: {
            type: String,
            enum: ['draft', 'active', 'finished', 'expired'],
            default: 'draft',
            index: true,
        },

        continueAfterExpiry: {
            type: Boolean,
            default: false,
        },

        routineUsage: {
            morning: {
                type: Boolean,
                default: false,
            },
            evening: {
                type: Boolean,
                default: false,
            },
            step: {
                type: Number,
                default: null,
                min: 1,
            },
        },
    },
    {
        timestamps: true,
    }
);


collectionSchema.index(
    { createdAt: 1 },
    {
        expireAfterSeconds: 2592000, // 30 days
        partialFilterExpression: { status: 'draft' },
    }
);


collectionSchema.index({ userId: 1, status: 1 });
collectionSchema.index({ userId: 1, expirationDate: 1 });

module.exports = mongoose.model('Collection', collectionSchema);
module.exports.productTypes = [
    'cleanser',
    'toner',
    'essences',
    'cream',
    'oil',
    'serum',
    'treatment',
    'moisturizer',
    'sunscreen',
    'mask',
    'exfoliant',
    'others',
];
module.exports.productIcons = [
    'serum',
    'chai_to',
    'hu',
    'tuyp_xanh',
    'oil',
    'pum',
    'mask',
    'tuyp',
    'xit',
];
module.exports.statuses = ['draft', 'active', 'finished', 'expired'];
