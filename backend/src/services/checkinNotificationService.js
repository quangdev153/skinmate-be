const NotificationDevice = require('../models/NotificationDevice');

const PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const sendDailyCheckinReminder = async (userId = null) => {
  const query = { enabled: true };
  if (userId) query.userId = userId;

  const devices = await NotificationDevice.find(query).lean();
  if (!devices.length) {
    return { sentCount: 0, message: 'No registered devices found' };
  }

  const messages = devices.map(d => ({
    to: d.token,
    sound: 'default',
    title: 'Nhật ký làn da hôm nay 🌸',
    body: 'Da bạn hôm nay thế nào? Hãy vào check-in để SkinMate cập nhật chu trình skincare tối ưu cho bạn nhé!',
    data: { screen: 'Home', action: 'daily_checkin' },
  }));

  try {
    for (let index = 0; index < messages.length; index += 100) {
      await fetch(PUSH_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(messages.slice(index, index + 100)),
      });
    }
    return { sentCount: messages.length, success: true };
  } catch (error) {
    return { sentCount: 0, error: error.message };
  }
};

module.exports = {
  sendDailyCheckinReminder,
};

