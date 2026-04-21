import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';
import Notification from '../models/Notification.js';

// Configure VAPID only if keys are present
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:support@autosphere.com';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

/**
 * Persist a notification to the DB and push it to all of the user's
 * browser subscriptions via Web Push.
 *
 * @param {number} userId
 * @param {'message'|'booking'|'system'|'alert'} type
 * @param {string} title
 * @param {string} message
 * @param {{ linkType?: string, linkId?: number, url?: string }} [extra]
 */
export const sendNotification = async (userId, type, title, message, extra = {}) => {
  try {
    // 1. Persist to DB so the bell loads it on next page visit
    const notif = await Notification.create({
      userId,
      type,
      title,
      message,
      linkType: extra.linkType || null,
      linkId: extra.linkId || null,
    });

    // 2. Push to all browser subscriptions (best-effort)
    if (VAPID_PUBLIC && VAPID_PRIVATE) {
      const subs = await PushSubscription.findAll({ where: { userId } });

      const payload = JSON.stringify({
        title,
        body: message,
        url: extra.url || '/',
        timestamp: Date.now(),
      });

      await Promise.allSettled(
        subs.map(async (sub) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: sub.keys },
              payload
            );
          } catch (err) {
            // 410 Gone = subscription expired, clean it up
            if (err.statusCode === 410) {
              await sub.destroy();
            }
          }
        })
      );
    }

    return notif;
  } catch (err) {
    console.error('sendNotification error:', err);
  }
};
