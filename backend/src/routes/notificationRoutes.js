const express = require('express');
const NotificationDevice = require('../models/NotificationDevice');
const { sendDailyCheckinReminder } = require('../services/checkinNotificationService');
const router = express.Router();
router.use(require('../middlewares/authMiddleware'));

const expoTokenPattern = /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/;

router.post('/devices', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { token, platform = 'unknown' } = req.body || {};
    if (!token || !expoTokenPattern.test(token)) return res.status(400).json({ error: { message: 'A valid Expo push token is required', code: 'INVALID_PUSH_TOKEN' } });
    const device = await NotificationDevice.findOneAndUpdate(
      { token },
      { userId, token, platform, enabled: true, lastSeenAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    ).lean();
    res.status(200).json({ device: { token: device.token, platform: device.platform, enabled: device.enabled } });
  } catch (error) { next(error); }
});

router.delete('/devices', async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (req.body?.token) await NotificationDevice.updateOne({ userId, token: req.body.token }, { enabled: false });
    res.status(204).send();
  } catch (error) { next(error); }
});

router.post('/daily-checkin', async (req, res, next) => {
  try {
    const userId = req.user?.id || req.userId;
    const result = await sendDailyCheckinReminder(userId);
    res.status(200).json(result);
  } catch (error) { next(error); }
});

module.exports = router;
