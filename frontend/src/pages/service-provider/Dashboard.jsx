import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { bookingAPI } from '../../services/api';
import './Dashboard.css';

const fmt = (time) => {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
};

const STATUS_CLASS = {
  confirmed: 'confirmed',
  pending: 'pending',
  in_progress: 'in-progress',
  completed: 'completed',
};

const ServiceProviderDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await bookingAPI.getProviderStats();
        if (res.data?.success) setStats(res.data.data);
      } catch (e) {
        setError('Could not load dashboard data.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = stats
    ? [
        { label: "Today's Bookings", value: stats.todaysCount, icon: '📅', note: `${stats.pendingCount} pending` },
        { label: 'Weekly Revenue', value: `GH₵ ${stats.weeklyRevenue.toLocaleString()}`, icon: '💰', note: 'This week' },
        { label: 'Customer Rating', value: stats.avgRating ?? '—', icon: '⭐', note: stats.ratingCount ? `${stats.ratingCount} reviews` : 'No reviews yet' },
        { label: 'Completed', value: stats.completedTotal, icon: '✅', note: 'All time' },
      ]
    : [];

  const quickActions = [
    { title: 'Manage Schedule', icon: '📅', path: '/service-provider/schedule' },
    { title: 'Add Service', icon: '➕', path: '/service-provider/services' },
    { title: 'Messages', icon: '💬', path: '/service-provider/messages' },
    { title: 'All Bookings', icon: '📋', path: '/service-provider/bookings' },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-avatar">🔧</div>
        <div className="dashboard-welcome">
          <h1>Welcome back, {user?.firstName || 'Provider'}!</h1>
          <p>Here's your service overview for today</p>
        </div>
        <button className="settings-btn" onClick={() => navigate('/service-provider/profile')}>
          ⚙️ Settings
        </button>
      </div>

      {error && <div className="sp-error">{error}</div>}

      {/* Stats */}
      <div className="stats-grid">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="stat-card stat-card--skeleton" />
            ))
          : statCards.map((card) => (
              <div key={card.label} className="stat-card">
                <div className="stat-card-content">
                  <div className="stat-info">
                    <h3>{card.label}</h3>
                    <div className="stat-number">{card.value}</div>
                    <div className="stat-note">{card.note}</div>
                  </div>
                  <div className="stat-icon">{card.icon}</div>
                </div>
              </div>
            ))}
      </div>

      <div className="dashboard-main">
        <div>
          {/* Quick Actions */}
          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="actions-grid">
              {quickActions.map((a) => (
                <div key={a.title} className="action-card" onClick={() => navigate(a.path)}>
                  <div className="action-header">
                    <span className="action-icon">{a.icon}</span>
                    <h3>{a.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Appointments */}
          <div className="appointments-section">
            <div className="appointments-header">
              <h2>Today's Appointments</h2>
              <button className="view-all-btn" onClick={() => navigate('/service-provider/bookings')}>
                View All
              </button>
            </div>

            {loading ? (
              <p className="sp-loading">Loading...</p>
            ) : stats?.todaysBookings?.length ? (
              <ul className="appointments-list">
                {stats.todaysBookings.map((b) => (
                  <li key={b.id} className="appointment-item">
                    <div className="appointment-icon">🔧</div>
                    <div className="appointment-details">
                      <h4>{b.customerName} — {b.serviceType.replace(/_/g, ' ')}</h4>
                      <p>{fmt(b.scheduledTime)}{b.estimatedCost ? ` • GH₵ ${b.estimatedCost}` : ''}</p>
                    </div>
                    <span className={`appointment-status ${STATUS_CLASS[b.status] || 'pending'}`}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-appointments">
                <p>No appointments scheduled for today</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="dashboard-sidebar">
          <div className="business-summary">
            <h2>Summary</h2>
            <div className="summary-item">
              <span className="summary-label">Pending Bookings</span>
              <span className="summary-value">{loading ? '—' : stats?.pendingCount ?? '—'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Completed Services</span>
              <span className="summary-value">{loading ? '—' : stats?.completedTotal ?? '—'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Average Rating</span>
              <span className="summary-value">
                {loading ? '—' : stats?.avgRating ? `⭐ ${stats.avgRating}/5.0` : 'No ratings yet'}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Weekly Revenue</span>
              <span className="summary-value">
                {loading ? '—' : `GH₵ ${stats?.weeklyRevenue?.toLocaleString() ?? 0}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderDashboard;
