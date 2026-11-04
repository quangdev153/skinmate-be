const express = require('express');
const authenticate = require('../middlewares/authMiddleware');
const User = require('../models/User');
const { createMemoryImageUpload } = require('../middlewares/productImageUploadMiddleware');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { sendSuccess } = require('../utils/response');

const router = express.Router();
const upload = createMemoryImageUpload();
const serialize = user => ({
  id: String(user._id), fullName: user.fullName, email: user.email,
  phoneNumber: user.phoneNumber || '', avatarUrl: user.avatarUrl || null,
});
router.use(authenticate);
router.get('/', async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('fullName email phoneNumber avatarUrl');
    if (!user) return res.status(404).json({ error: { message: 'Account not found.', code: 'NOT_FOUND' } });
    return sendSuccess(res, { data: { user: serialize(user) } });
  } catch (error) { next(error); }
});
router.patch('/', (req, res, next) => {
  upload.single('avatar')(req, res, error => {
    if (error) return res.status(400).json({ error: { message: error.message, code: 'INVALID_IMAGE' } });
    next();
  });
}, async (req, res, next) => {
  try {
    const { fullName, phoneNumber } = req.body || {};
    if (typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.trim().length > 100
      || typeof phoneNumber !== 'string' || (phoneNumber.trim() && !/^\+?[0-9]{7,15}$/.test(phoneNumber.trim()))) {
      return res.status(400).json({ error: { message: 'Enter a name (2–100 characters) and a valid phone number (7–15 digits).', code: 'INVALID_PROFILE' } });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: { message: 'Account not found.', code: 'NOT_FOUND' } });
    if (req.file) {
      const image = await uploadToCloudinary(req.file, 'skinmate/avatars');
      user.avatarUrl = image.secureUrl;
    }
    user.fullName = fullName.trim();
    user.phoneNumber = phoneNumber.trim();
    await user.save();
    return sendSuccess(res, { data: { user: serialize(user) } });
  } catch (error) {
    if (error.code === 'CLOUDINARY_NOT_CONFIGURED' || error.code === 'CLOUDINARY_UPLOAD_FAILED') {
      return res.status(503).json({ error: { message: 'Avatar upload is unavailable. Please try again.', code: 'AVATAR_UPLOAD_FAILED' } });
    }
    next(error);
  }
});
module.exports = router;
