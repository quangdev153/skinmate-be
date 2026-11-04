const mongoose = require('mongoose');

const routineStepSchema = new mongoose.Schema({
    stepNumber: {
        type: Number,
        required: true,
    },
    stepName: {
        type: String, // e.g., "Làm sạch • Cleanser", "Cân bằng & Phục hồi • Toner"
        required: true,
    },
    productType: {
        type: String,
        default: 'treatment',
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collection',
        default: null,
    },
    productName: {
        type: String,
        required: true,
    },
    instruction: {
        type: String,
        default: '',
    },
    isExternalSuggestion: {
        type: Boolean,
        default: false,
    },
    activeIngredient: {
        type: String,
        default: null,
    },
}, { _id: true });

const dailyRoutineSchema = new mongoose.Schema(
    {
        date: { type: String, default: undefined },
        checkIn: {
            status: { type: [String], default: [] },
            updatedAt: { type: Date, default: null },
        },
        steps: { type: [mongoose.Schema.Types.Mixed], default: [] },
        previousCheckIn: { type: mongoose.Schema.Types.Mixed, default: null },
        planTitle: { type: String, default: null },
        isOverridden: { type: Boolean, default: false },
        overrideReason: { type: String, default: null },
        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TreatmentPlan',
            default: null,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        dayNumber: {
            type: Number,
            required: true,
            min: 1,
            max: 30,
        },
        morningSteps: {
            type: [routineStepSchema],
            default: [],
        },
        eveningSteps: {
            type: [routineStepSchema],
            default: [],
        },
        isDraft: {
            type: Boolean,
            default: false,
        },
        notes: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

dailyRoutineSchema.index({ userId: 1, planId: 1, dayNumber: 1 });

module.exports = mongoose.model('DailyRoutine', dailyRoutineSchema);
