/**
 * Device push via Expo Push API (works when the mobile app is backgrounded / killed).
 * Tokens are stored on User.expoPushToken after POST /auth/push-token.
 */
const User = require('../models/User');
const { NOTIFICATIONS_ENABLED } = require('../config/notifications');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function channelForType(type = '') {
  const t = String(type).toLowerCase();
  if (t.includes('lead')) return 'leads';
  if (t.includes('follow')) return 'followups';
  if (t.includes('quot') || t.includes('quote')) return 'quotations';
  return 'default';
}

async function sendExpoPush(tokens, { title, body, data, type }) {
  const list = [...new Set((tokens || []).filter((t) => typeof t === 'string' && t.startsWith('ExponentPushToken[')))];
  if (!list.length) return;

  const messages = list.map((to) => ({
    to,
    title: title || 'Explore My Bharat',
    body: body || '',
    sound: 'default',
    priority: 'high',
    channelId: channelForType(type),
    data: data || {},
  }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn('[push] Expo HTTP', res.status, text.slice(0, 200));
    }
  } catch (err) {
    console.warn('[push] Expo send failed:', err.message);
  }
}

/** Fire-and-forget push to a user's registered device token(s). */
async function pushToUser(userId, payload = {}) {
  if (!NOTIFICATIONS_ENABLED || !userId) return;
  try {
    const id = userId._id || userId;
    const user = await User.findById(id).select('expoPushToken').lean();
    const token = user?.expoPushToken;
    if (!token) return;
    await sendExpoPush([token], {
      title: payload.title,
      body: payload.message || payload.body,
      type: payload.type,
      data: {
        type: payload.type || '',
        notificationId: payload.id || payload._id || '',
        ...(payload.meta || {}),
      },
    });
  } catch (err) {
    console.warn('[push] pushToUser failed:', err.message);
  }
}

module.exports = { pushToUser, sendExpoPush };
