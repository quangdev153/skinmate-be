const mongoose = require('mongoose');

const notificationDeliverySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', required: true, index: true },
    type: { type: String, enum: ['expiring_soon', 'expired', 'expired_weekly'], required: true },
    periodKey: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

notificationDeliverySchema.index({ productId: 1, type: 1, periodKey: 1 }, { unique: true });

module.exports = mongoose.model('NotificationDelivery', notificationDeliverySchema);
