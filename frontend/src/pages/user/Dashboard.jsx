import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { bookingAPI, messageAPI, userAPI } from '../../services/api';
import './Dashboard.css';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedServices: 0,
    savedVehicles: 0,
    unreadMessages: 0,
    avgRating: null,
    ratingCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [bookingsRes, conversationsRes, userStatsRes] = await Promise.allSettled([
        bookingAPI.getAll({ limit: 20 }),
        messageAPI.getConversations({ limit: 1 }),
        userAPI.getStats(),
      ]);

      if (bookingsRes.status === 'fulfilled' && bookingsRes.value.data.success) {
        const allBookings = bookingsRes.value.data.data || [];
        const upcoming = allBookings
          .filter(b => ['pending', 'confirmed'].includes(b.status))
          .slice(0, 3);

        setAppointments(upcoming.map(b => ({
          id: b.id,
          serviceType: b.serviceType || b.title || 'Service',
          date: b.scheduledDate ? new Date(b.scheduledDate).toLocaleDateString() : 'TBD',
          time: b.scheduledTime || 'TBD',
          status: b.status,
          provider: b.serviceProvider
            ? `${b.serviceProvider.firstName} ${b.serviceProvider.lastName}`
            : 'Provider',
        })));
      }

      // Unread messages count from conversations
      if (conversationsRes.status === 'fulfilled' && conversationsRes.value.data.success) {
        const conversations = conversationsRes.value.data.data || [];
        const unread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setStats(prev => ({ ...prev, unreadMessages: unread }));
      }

      // Real user stats from dedicated endpoint
      if (userStatsRes.status === 'fulfilled' && userStatsRes.value.data.success) {
        const s = userStatsRes.value.data.data;
        setStats(prev => ({
          ...prev,
          totalAppointments: s.totalBookings,
          completedServices: s.completedBookings,
          avgRating: s.avgRating,
          ratingCount: s.ratingCount,
        }));
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { title: 'Book Service', description: 'Schedule maintenance or repairs', icon: '🔧', className: 'primary', action: () => navigate('/book-service') },
    { title: 'Browse Vehicles', description: 'Find your next car', icon: '🚗', className: 'secondary', action: () => navigate('/vehicles') },
    { title: 'Messages', description: 'Chat with dealers & providers', icon: '💬', className: 'success', action: () => navigate('/user-messages') },
    { title: 'Vehicle Insights', description: 'Track your vehicle data', icon: '📊', className: 'info', action: () => navigate('/vehicle-insights') },
  ];

  const completionRate = stats.totalAppointments > 0
    ? Math.round((stats.completedServices / stats.totalAppointments) * 100)
    : 0;

  return (
    <div className="dashboard-container">
      {/* Welcome Header */}
      <div className="dashboard-header">
        <div className="dashboard-avatar">
          👤
        </div>
        <div className="dashboard-welcome">
          <h1>Welcome back, {user?.firstName || 'User'}!</h1>
          <p>Here's what's happening with your automotive services</p>
        </div>
        <button 
          className="settings-btn"
          onClick={() => navigate('/settings')}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Total Appointments</h3>
              <div className="stat-number">{stats.totalAppointments}</div>
            </div>
            <div className="stat-icon primary">📅</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Completed Services</h3>
              <div className="stat-number">{stats.completedServices}</div>
            </div>
            <div className="stat-icon success">🔧</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Saved Vehicles</h3>
              <div className="stat-number">{stats.savedVehicles}</div>
            </div>
            <div className="stat-icon secondary">🚗</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Unread Messages</h3>
              <div className="stat-number">{stats.unreadMessages}</div>
            </div>
            <div className="stat-icon info">💬</div>
          </div>
        </div>
      </div>

      <div className="dashboard-main">
        {/* Main Content */}
        <div>
          {/* Quick Actions */}
          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="actions-grid">
              {quickActions.map((action, index) => (
                <div 
                  key={index}
                  className="action-card"
                  onClick={action.action}
                >
                  <div className="action-header">
                    <span className={`action-icon ${action.className}`}>
                      {action.icon}
                    </span>
                    <h3>{action.title}</h3>
                  </div>
                  <p>{action.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Appointments */}
          <div className="appointments-section">
            <div className="appointments-header">
              <h2>Upcoming Appointments</h2>
              <button 
                className="view-all-btn"
                onClick={() => navigate('/appointments')}
              >
                View All
              </button>
            </div>
            
            {appointments.length > 0 ? (
              <ul className="appointments-list">
                {appointments.map((appointment) => (
                  <li key={appointment.id} className="appointment-item">
                    <div className="appointment-icon">⏰</div>
                    <div className="appointment-details">
                      <h4>{appointment.serviceType}</h4>
                      <p>{appointment.date} at {appointment.time} - {appointment.provider}</p>
                    </div>
                    <span className={`appointment-status ${appointment.status}`}>
                      {appointment.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-appointments">
                <p>No upcoming appointments</p>
                <button
                  className="book-first-btn"
                  onClick={() => navigate('/book-service')}
                >
                  Book Your First Service
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="dashboard-sidebar">
          {/* Profile Summary */}
          <div className="profile-summary">
            <h2>Profile Summary</h2>
            <div className="profile-avatar">👤</div>
            <h3>{user?.firstName} {user?.lastName}</h3>
            <p className="email">{user?.email}</p>
            <span className="role-chip">{user?.role || 'User'}</span>
            <button
              className="edit-profile-btn"
              onClick={() => navigate('/profile')}
            >
              Edit Profile
            </button>
          </div>

          {/* Service History */}
          <div className="service-history">
            <h2>Service History</h2>
            <div className="completion-rate">
              <div className="completion-rate-header">
                <span>Completion Rate</span>
                <span>{completionRate}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>
            
            <div className="rating-info">
              <span className="rating-star">⭐</span>
              <span>
                {stats.avgRating
                  ? `Average Rating: ${stats.avgRating}/5.0 (${stats.ratingCount} review${stats.ratingCount !== 1 ? 's' : ''})`
                  : 'No ratings yet'}
              </span>
            </div>
            
            <button
              className="view-history-btn"
              onClick={() => navigate('/appointments')}
            >
              View Full History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
