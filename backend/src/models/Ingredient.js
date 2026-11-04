const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        aliases: {
            type: [String],
            default: [],
        },
        category: {
            type: String,
            enum: ['exfoliant', 'antioxidant', 'hydrator', 'soothing', 'retinoid', 'sunscreen', 'cleanser_base', 'preservative_fragrance', 'other'],
            default: 'other',
        },
        description: {
            type: String,
            default: '',
        },
        // Phù hợp (Do's) cho loại da nào
        dos: {
            type: [String], // 'oily', 'dry', 'combination', 'sensitive', 'normal'
            default: [],
        },
        // Cấm kỵ / Cần thận trọng (Don'ts) cho loại da nào
        donts: {
            type: [String], // 'oily', 'dry', 'combination', 'sensitive', 'normal'
            default: [],
        },
        // Giải quyết các vấn đề da nào
        targetConcerns: {
            type: [String], // 'acne', 'large_pores', 'dullness', 'aging', 'barrier_damage', 'dryness'
            default: [],
        },
        // Dị ứng phổ biến
        commonAllergen: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

ingredientSchema.index({ name: 'text', aliases: 'text' });

module.exports = mongoose.model('Ingredient', ingredientSchema);
