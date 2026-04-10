import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';

// Configure VAPID once on module load
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:support@autosphere.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('⚠️  VAPID keys not configured — web push notifications disabled');
}

/**
 * Send a push notification to all subscriptions for a user.
 * Silently removes expired/invalid subscriptions (410 Gone).
 *
 * @param {number} userId
 * @param {{ title: string, body: string, icon?: string, url?: string }} payload
 */
export const sendPushToUser = async (userId, payload) => {
  if (!process.env.VAPID_PUBLIC_KEY) return;

  const subscriptions = await PushSubscription.findAll({ where: { userId } });
  if (!subscriptions.length) return;

  const notification = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/vite.svg',
    badge: '/vite.svg',
    url: payload.url || '/',
    timestamp: Date.now(),
  });

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          notification
        );
      } catch (err) {
        // 410 = subscription expired/unsubscribed — clean it up
        if (err.statusCode === 410 || err.statusCode === 404) {
          await sub.destroy();
        } else {
          console.error(`Push failed for sub ${sub.id}:`, err.message);
        }
      }
    })
  );
};
