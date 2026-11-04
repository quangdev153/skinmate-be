const mongoose = require('mongoose');

const skinDictionarySchema = new mongoose.Schema(
  {
    skinType: {
      type: String,
      required: true,
      unique: true,
      enum: ['da_dau', 'da_kho', 'da_hon_hop', 'da_nhay_cam', 'da_thuong'],
    },
    dos: [
      {
        ingredientName: { type: String, required: true },
        purpose: { type: String }, // ví dụ: "Kiểm soát bã nhờn, kháng viêm"
      },
    ],
    donts: [
      {
        ingredientName: { type: String, required: true },
        reason: { type: String }, // ví dụ: "Dễ gây bít tắc lỗ chân lông"
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('SkinDictionary', skinDictionarySchema);