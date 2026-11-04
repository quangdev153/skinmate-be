const mongoose = require('mongoose');

const myCollectionSchema = new mongoose.Schema(
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
    },
    productType: {
      type: String,
      required: true, // 'cleanser', 'toner', 'serum', 'cream', 'sunscreen'
    },
    ingredientsList: {
      type: [String],
      default: [],
    },
    openedDate: {
      type: Date,
      default: null,
    },
    expirationDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'expiring', 'expired', 'finished', 'archived'],
      default: 'active',
      index: true,
    },
    note: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MyCollection', myCollectionSchema);