const User = require('../models/User');

const singleUserMiddleware = async (req, res, next) => {
  try {
    const email = (process.env.APP_USER_EMAIL || 'tranquang@example.com').trim().toLowerCase();
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(503).json({
        success: false,
        message: `Không tìm thấy user cấu hình (${email}). Hãy chạy seeder hoặc đặt APP_USER_EMAIL.`,
      });
    }

    req.user = { id: user._id.toString(), email: user.email };
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = singleUserMiddleware;
