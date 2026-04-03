import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import './NotificationBell.css';

const TYPE_ICON = {
  message: '💬',
  booking: '📅',
  system: '🔔',
  alert: '⚠️',
};

const fmt = (iso) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const { notifications, unreadCount, markRead, markAllRead, remove } = useNotifications();

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="nb-wrap" ref={wrapRef}>
      <button
        className="nb-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        🔔
        {unreadCount > 0 && (
          <span className="nb-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="nb-dropdown">
          <div className="nb-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button className="nb-mark-all" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="nb-list">
            {notifications.length === 0 ? (
              <div className="nb-empty">No notifications yet</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`nb-item${n.read ? '' : ' unread'}`}
                  onClick={() => markRead(n.id)}
                >
                  <span className="nb-icon">{TYPE_ICON[n.type] || '🔔'}</span>
                  <div className="nb-body">
                    <div className="nb-title">{n.title}</div>
                    <div className="nb-msg">{n.message}</div>
                    <div className="nb-time">{fmt(n.timestamp)}</div>
                  </div>
                  <button
                    className="nb-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(n.id);
                    }}
                    aria-label="Remove notification"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
