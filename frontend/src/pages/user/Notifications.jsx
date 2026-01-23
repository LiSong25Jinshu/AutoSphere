import { useState, useEffect } from 'react';
import './Notifications.css';

const UserNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    // Mock data - replace with real API call
    setTimeout(() => {
      setNotifications([
        {
          id: 1,
          type: 'appointment',
          title: 'Appointment Confirmed',
          message: 'Your oil change appointment with QuickFix Motors is confirmed for tomorrow at 10:00 AM.',
          timestamp: '2024-01-20T14:30:00Z',
          read: false,
          icon: '📅'
        },
        {
          id: 2,
          type: 'message',
          title: 'New Message',
          message: 'AutoCare Plus sent you a message about your brake service.',
          timestamp: '2024-01-20T12:15:00Z',
          read: false,
          icon: '💬'
        },
        {
          id: 3,
          type: 'reminder',
          title: 'Service Reminder',
          message: 'Your vehicle is due for maintenance. Book your next service appointment.',
          timestamp: '2024-01-19T09:00:00Z',
          read: true,
          icon: '🔔'
        },
        {
          id: 4,
          type: 'promotion',
          title: 'Special Offer',
          message: '20% off on tire services this week! Book now and save.',
          timestamp: '2024-01-18T16:45:00Z',
          read: true,
          icon: '🎉'
        },
        {
          id: 5,
          type: 'system',
          title: 'Profile Updated',
          message: 'Your profile information has been successfully updated.',
          timestamp: '2024-01-17T11:20:00Z',
          read: true,
          icon: '✅'
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'appointment': return 'type-appointment';
      case 'message': return 'type-message';
      case 'reminder': return 'type-reminder';
      case 'promotion': return 'type-promotion';
      case 'system': return 'type-system';
      default: return 'type-default';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="notifications-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

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
              <button className="btn secondary" onClick={markAllAsRead}>
                Mark All Read ({unreadCount})
              </button>
            )}
          </div>
        </div>

        <div className="notifications-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
          <button 
            className={`filter-btn ${filter === 'appointment' ? 'active' : ''}`}
            onClick={() => setFilter('appointment')}
          >
            Appointments
          </button>
          <button 
            className={`filter-btn ${filter === 'message' ? 'active' : ''}`}
            onClick={() => setFilter('message')}
          >
            Messages
          </button>
          <button 
            className={`filter-btn ${filter === 'reminder' ? 'active' : ''}`}
            onClick={() => setFilter('reminder')}
          >
            Reminders
          </button>
        </div>

        <div className="notifications-list">
          {filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔔</div>
              <h3>No notifications found</h3>
              <p>
                {filter === 'all' 
                  ? "You're all caught up! No notifications to show."
                  : `No ${filter} notifications found.`
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
              >
                <div className="notification-content">
                  <div className="notification-header">
                    <div className="notification-icon">
                      {notification.icon}
                    </div>
                    <div className="notification-info">
                      <h4>{notification.title}</h4>
                      <span className={`notification-type ${getTypeColor(notification.type)}`}>
                        {notification.type}
                      </span>
                    </div>
                    <div className="notification-meta">
                      <span className="notification-time">
                        {formatTime(notification.timestamp)}
                      </span>
                      {!notification.read && (
                        <div className="unread-dot"></div>
                      )}
                    </div>
                  </div>
                  <p className="notification-message">
                    {notification.message}
                  </p>
                </div>
                
                <div className="notification-actions">
                  {!notification.read && (
                    <button 
                      className="action-btn"
                      onClick={() => markAsRead(notification.id)}
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                  <button 
                    className="action-btn delete"
                    onClick={() => deleteNotification(notification.id)}
                    title="Delete notification"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {filteredNotifications.length > 0 && (
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
                <span className="stat-number">{notifications.filter(n => n.read).length}</span>
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