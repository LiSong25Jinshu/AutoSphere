import { useNotifications } from '../../contexts/NotificationContext';
import './Notifications.css';
import { useState } from 'react';

const TYPE_ICON = { message: '💬', booking: '📅', system: '🔔', alert: '⚠️' };

const fmt = (iso) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
};

const UserNotifications = () => {
  const { notifications, unreadCount, loading, markRead, markAllRead, remove, reload } = useNotifications();
  const [filter, setFilter] = useState('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        <div className="notifications-header">
          <div className="header-info">
            <h1>Notifications</h1>
            <p>Stay updated with your automotive services</p>
          </div>
          <div className="header-actions">
            {unreadCount > 0 && (
              <button className="btn secondary" onClick={markAllRead}>
                Mark All Read ({unreadCount})
              </button>
            )}
            <button className="btn secondary" onClick={reload} style={{ marginLeft: '0.5rem' }}>
              Refresh
            </button>
          </div>
        </div>

        <div className="notifications-filters">
          {[
            ['all', `All (${notifications.length})`],
            ['unread', `Unread (${unreadCount})`],
            ['booking', 'Bookings'],
            ['message', 'Messages'],
            ['system', 'System'],
          ].map(([val, label]) => (
            <button
              key={val}
              className={`filter-btn ${filter === val ? 'active' : ''}`}
              onClick={() => setFilter(val)}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading notifications...</p>
          </div>
        ) : (
          <div className="notifications-list">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔔</div>
                <h3>No notifications found</h3>
                <p>
                  {filter === 'all'
                    ? "You're all caught up!"
                    : `No ${filter} notifications found.`}
                </p>
              </div>
            ) : (
              filtered.map((n) => (
                <div
                  key={n.id}
                  className={`notification-item ${!n.read ? 'unread' : ''}`}
                  onClick={() => !n.read && markRead(n.id)}
                  style={{ cursor: !n.read ? 'pointer' : 'default' }}
                >
                  <div className="notification-content">
                    <div className="notification-header">
                      <div className="notification-icon">
                        {TYPE_ICON[n.type] || '🔔'}
                      </div>
                      <div className="notification-info">
                        <h4>{n.title}</h4>
                        <span className={`notification-type type-${n.type}`}>{n.type}</span>
                      </div>
                      <div className="notification-meta">
                        <span className="notification-time">{fmt(n.timestamp || n.createdAt)}</span>
                        {!n.read && <div className="unread-dot" />}
                      </div>
                    </div>
                    <p className="notification-message">{n.message}</p>
                  </div>

                  <div className="notification-actions">
                    {!n.read && (
                      <button
                        className="action-btn"
                        onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      className="action-btn delete"
                      onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="notifications-summary">
            <div className="summary-stats">
              <div className="summary-stat">
                <span className="stat-number">{notifications.length}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="summary-stat">
                <span className="stat-number">{unreadCount}</span>
                <span className="stat-label">Unread</span>
              </div>
              <div className="summary-stat">
                <span className="stat-number">{notifications.length - unreadCount}</span>
                <span className="stat-label">Read</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserNotifications;
