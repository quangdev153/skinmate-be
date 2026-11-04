const Collection = require('../models/Collection');
const NotificationDevice = require('../models/NotificationDevice');
const NotificationDelivery = require('../models/NotificationDelivery');

const DAY_MS = 24 * 60 * 60 * 1000;
const TIME_ZONE = process.env.NOTIFICATION_TIME_ZONE || 'Asia/Ho_Chi_Minh';
const PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const dateParts = date => Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
}).formatToParts(date).filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, value]));

const localDateKey = date => {
  const parts = dateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
};

const isoWeekKey = date => {
  const local = new Date(`${localDateKey(date)}T12:00:00Z`);
  const day = local.getUTCDay() || 7;
  local.setUTCDate(local.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(local.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((local - yearStart) / DAY_MS) + 1) / 7);
  return `${local.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

const expirationDateKey = product => {
  const date = new Date(product.expirationDate);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};

const daysUntilExpiration = (product, now) => {
  const expiration = new Date(`${expirationDateKey(product)}T00:00:00Z`);
  const today = new Date(`${localDateKey(now)}T00:00:00Z`);
  return Math.round((expiration - today) / DAY_MS);
};

const sendPushMessages = async messages => {
  if (!messages.length) return;
  for (let index = 0; index < messages.length; index += 100) {
    const response = await fetch(PUSH_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(messages.slice(index, index + 100)),
    });
    if (!response.ok) throw new Error(`Expo push request failed with status ${response.status}`);
    const result = await response.json();
    const tickets = result.data || [];
    tickets.forEach((ticket, ticketIndex) => {
      if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
        NotificationDevice.updateOne({ token: messages[index + ticketIndex].to }, { enabled: false }).catch(() => {});
      }
    });
  }
};

const claimDelivery = async (product, type, periodKey) => {
  try {
    await NotificationDelivery.create({ userId: product.userId, productId: product._id, type, periodKey });
    return true;
  } catch (error) {
    if (error.code === 11000) return false;
    throw error;
  }
};

const buildNotification = (product, type) => {
  const name = product.productName;
  if (type === 'expiring_soon') return { title: 'Sản phẩm sắp hết hạn', body: `${name} sẽ hết hạn trong 7 ngày.` };
  if (type === 'expired') return { title: 'Sản phẩm đã hết hạn', body: `${name} đã đến ngày hết hạn hôm nay.` };
  return { title: 'Kiểm tra sản phẩm đã hết hạn', body: `${name} đã hết hạn nhưng vẫn đang được sử dụng.` };
};

const runExpiryScan = async now => {
  const products = await Collection.find({ status: 'active', expirationDate: { $ne: null } }).lean();
  const userIds = [...new Set(products.map(product => product.userId.toString()))];
  const devices = await NotificationDevice.find({ enabled: true, userId: { $in: userIds } }).lean();
  const devicesByUser = new Map();
  devices.forEach(device => {
    const key = device.userId.toString();
    devicesByUser.set(key, [...(devicesByUser.get(key) || []), device.token]);
  });
  const messages = [];
  const today = localDateKey(now);
  const week = isoWeekKey(now);
  const localNow = dateParts(now);
  const isEightAm = localNow.hour === '08' && localNow.minute === '00';
  const isWeeklyScanDay = new Date(`${today}T12:00:00Z`).getUTCDay() === 1;

  for (const product of products) {
    const tokens = devicesByUser.get(product.userId.toString()) || [];
    if (!tokens.length) continue;
    const days = daysUntilExpiration(product, now);
    let type = null;
    let periodKey = null;
    if (isEightAm && days === 7) { type = 'expiring_soon'; periodKey = today; }
    else if (isEightAm && days === 0) { type = 'expired'; periodKey = today; }
    else if (isEightAm && isWeeklyScanDay && days < 0 && product.continueAfterExpiry) { type = 'expired_weekly'; periodKey = week; }
    if (!type || !(await claimDelivery(product, type, periodKey))) continue;
    const notification = buildNotification(product, type);
    tokens.forEach(to => messages.push({ to, sound: 'default', ...notification, data: { productId: product._id.toString(), type } }));
  }
  await sendPushMessages(messages);
  return { productsChecked: products.length, notificationsSent: messages.length };
};

const startExpiryScheduler = () => {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try { await runExpiryScan(new Date()); } catch (error) { console.error('Expiry notification scan failed:', error.message); }
    finally { running = false; }
  };
  const delay = 60 * 1000;
  const interval = setInterval(tick, delay);
  interval.unref?.();
  tick();
  return () => clearInterval(interval);
};

module.exports = { runExpiryScan, startExpiryScheduler, daysUntilExpiration, localDateKey, isoWeekKey };
