import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import './Admin.css';

const AdminLogs = () => {
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getStats();
      const { recent } = res.data.data;
      setRecentUsers(recent.users || []);
      setRecentBookings(recent.bookings || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load activity log');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Build a unified activity feed from real data
  const allEvents = [
    ...recentUsers.map((u) => ({
      id: `user-${u.id}`,
      type: 'auth',
      level: 'info',
      message: `New user registered: ${u.firstName} ${u.lastName} (${u.email}) — role: ${u.role}`,
      timestamp: u.createdAt,
    })),
    ...recentBookings.map((b) => ({
      id: `booking-${b.id}`,
      type: 'booking',
      level: b.status === 'cancelled' ? 'warn' : 'info',
      message: `Booking #${b.id} — ${b.serviceType?.replace(/_/g, ' ')} — status: ${b.status}${b.user ? ` — ${b.user.firstName} ${b.user.lastName}` : ''}`,
      timestamp: b.createdAt,
    })),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const LEVEL_COLORS = { info: '#2196f3', warn: '#ff9800', error: '#f44336' };

  const filtered = allEvents.filter((e) =>
    typeFilter === 'all' || e.type === typeFilter
  );

  return (
    <div className="admin-sub-page">
      <div className="admin-sub-header">
        <div>
          <h1>Activity Log</h1>
          <p>Recent platform activity — registrations and bookings</p>
        </div>
        <div className="admin-sub-stats">
          <span className="admin-stat-pill active">{recentUsers.length} New Users</span>
          <span className="admin-stat-pill">{recentBookings.length} Recent Bookings</span>
        </div>
      </div>

      <div className="admin-controls">
        <div className="admin-filters">
          {['all', 'auth', 'booking'].map((t) => (
            <button
              key={t}
              className={'admin-filter-btn' + (typeFilter === t ? ' active' : '')}
              onClick={() => setTypeFilter(t)}
            >
              {t === 'all' ? 'All' : t === 'auth' ? 'Registrations' : 'Bookings'}
            </button>
          ))}
        </div>
        <button className="admin-action-btn" onClick={fetchData} disabled={loading}>
          {loading ? '...' : 'Refresh'}
        </button>
      </div>

      {loading && <div className="admin-loading">Loading activity...</div>}
      {error && <div className="admin-error-msg">{error} <button onClick={fetchData}>Retry</button></div>}

      {!loading && !error && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Type</th>
                <th>Event</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td>
                    <span className="admin-status-badge" style={{ background: LEVEL_COLORS[log.level] }}>
                      {log.level}
                    </span>
                  </td>
                  <td><span className="admin-type-tag">{log.type}</span></td>
                  <td className="admin-log-message">{log.message}</td>
                  <td className="admin-sub-text">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="admin-empty">No activity found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
