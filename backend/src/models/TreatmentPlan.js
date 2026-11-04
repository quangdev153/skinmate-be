const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  stepNumber: { type: Number, required: true },
  stepType: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', default: null },
  productName: { type: String, required: true },
  targetActiveIngredient: String,
  isExternalSuggestion: { type: Boolean, default: false },
  usageNote: String,
});

const routineDaySchema = new mongoose.Schema({
  dayIndex: { type: Number, required: true },
  morning: [stepSchema],
  evening: [stepSchema],
});

const treatmentPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, default: 'Chuỗi Routine 7 Ngày Cấp Ẩm Căng Bóng' },
  targetConcern: { type: String, default: 'Căng bóng cấp ẩm' },
  goal: { type: String, default: 'Cấp ẩm sâu & duy trì làn da căng bóng' },
  skinTypeTarget: { type: String, default: 'normal' },
  durationDays: { type: Number, default: 7 },
  planPayload: [routineDaySchema],
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'canceled', 'cancelled'],
    default: 'draft',
    index: true,
  },
  isSkipped: { type: Boolean, default: false },
  startDate: { type: Date, default: null },
  completedDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  currentDay: { type: Number, default: 1 },
  isOriginalSuggested: { type: Boolean, default: true },
  sourceRoutineId: { type: mongoose.Schema.Types.ObjectId, ref: 'TreatmentPlan', default: null },
  notes: { type: String, default: '' },
}, { timestamps: true });

treatmentPlanSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('TreatmentPlan', treatmentPlanSchema);
