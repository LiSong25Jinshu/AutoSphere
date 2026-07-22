/**
 * pushNotifications.js
 *
 * Thin wrapper kept for backward-compatibility with callers that import
 * `sendNotification` from this file (e.g. bookings.js).
 *
 * All logic now lives in notifications.js + webPush.js to avoid the
 * previous double-notification bug where both files persisted to the DB
 * and sent web push independently.
 */
import { createNotification } from './notifications.js';

/**
 * Persist a notification to the DB, emit via socket, and send web push.
 *
 * @param {number} userId
 * @param {'message'|'booking'|'system'|'alert'} type
 * @param {string} title
 * @param {string} message
 * @param {{ linkType?: string, linkId?: number, url?: string, io?: object }} [extra]
 */
export const sendNotification = (userId, type, title, message, extra = {}) =>
  createNotification({
    userId,
    type,
    title,
    message,
    linkType: extra.linkType || null,
    linkId: extra.linkId || null,
    url: extra.url || null,
    io: extra.io || null,
  });
