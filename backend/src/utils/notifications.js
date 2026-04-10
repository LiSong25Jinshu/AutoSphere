import Notification from '../models/Notification.js';
import { sendPushToUser } from './webPush.js';

/**
 * Persist a notification to the DB and optionally push via socket.
 * @param {object} opts
 * @param {number}  opts.userId
 * @param {'message'|'booking'|'system'|'alert'} opts.type
 * @param {string}  opts.title
 * @param {string}  opts.message
 * @param {string}  [opts.linkType]  - e.g. 'booking' | 'conversation'
 * @param {number}  [opts.linkId]
 * @param {object}  [opts.io]        - Socket.io server instance (optional)
 */
export const createNotification = async ({ userId, type, title, message, linkType, linkId, io }) => {
  try {
    const notif = await Notification.create({ userId, type, title, message, linkType, linkId });

    // Push real-time if socket server provided
    if (io) {
      io.to(`user:${userId}`).emit('notification:new', {
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        read: notif.read,
        linkType: notif.linkType,
        linkId: notif.linkId,
        timestamp: notif.createdAt,
      });
    }

    // Web push (works even when browser tab is closed)
    await sendPushToUser(userId, {
      title: notif.title,
      body: notif.message,
      url: notif.linkType && notif.linkId ? `/${notif.linkType}s/${notif.linkId}` : '/',
    });

    return notif;
  } catch (err) {
    // Never crash the caller over a notification failure
    console.error('createNotification error:', err.message);
    return null;
  }
};
