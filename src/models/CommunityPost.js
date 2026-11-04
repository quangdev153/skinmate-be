const mongoose = require('mongoose');
const { productTypes, productIcons } = require('./Collection');

const skinTypes = ['Da dầu mụn', 'Da khô', 'Da hỗn hợp', 'Da nhạy cảm', 'Phục hồi'];

const routineStepSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, trim: true, maxlength: 150 },
    productType: { type: String, enum: productTypes, required: true },
    productIcon: { type: String, enum: productIcons, default: null },
    brand: { type: String, default: null, trim: true, maxlength: 100 },
    note: { type: String, default: null, trim: true, maxlength: 300 },
  },
  { _id: false }
);

const communityPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    authorName: {
      type: String,
      default: 'Thành viên SkinMate',
      trim: true,
      maxlength: 80,
    },

    content: {
      type: String,
      required: function () { return (this.getUpdate?.()?.$set?.status || this.status) !== 'draft'; },
      default: '',
      trim: true,
      maxlength: 2000,
    },

    images: {
      type: [String],
      default: [],
    },

    tags: {
      type: [String],
      default: [],
    },

    skinType: {
      type: String,
      enum: skinTypes,
      default: null,
    },

    skinTypes: {
      type: [{ type: String, enum: skinTypes }],
      default: undefined,
    },

    sharedRoutine: {
      morning: { type: [routineStepSchema], default: [] },
      evening: { type: [routineStepSchema], default: [] },
      days: {
        type: [new mongoose.Schema({
          morning: { type: [routineStepSchema], default: [] },
          evening: { type: [routineStepSchema], default: [] },
        }, { _id: false })],
        default: undefined,
      },
    },

    likedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },

    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    copiesCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ['draft', 'published', 'hidden', 'deleted'],
      default: 'published',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

communityPostSchema.index({ status: 1, skinType: 1, createdAt: -1 });
communityPostSchema.index({ status: 1, skinTypes: 1, createdAt: -1 });

module.exports = mongoose.model('CommunityPost', communityPostSchema);
module.exports.skinTypes = skinTypes;
