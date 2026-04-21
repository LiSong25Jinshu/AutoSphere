import { useState, useEffect, useCallback } from 'react';
import { bookingAPI } from '../../services/api';
import './Bookings.css';

const STATUS_COLORS = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  in_progress: 'status-inprogress',
  completed: 'status-completed',
  cancelled: 'status-cancelled',
  no_show: 'status-cancelled',
};

const label = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
};

const ServiceProviderBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await bookingAPI.getAll({ limit: 100 });
      setBookings(res.data?.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const updateStatus = async (id, status, extra = {}) => {
    const key = `${id}-${status}`;
    setActionLoading(key);
    try {
      await bookingAPI.updateStatus(id, status, extra);
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
      showToast(`Booking ${label(status).toLowerCase()}`);
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to update booking');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);
  const counts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="sp-bookings-page">
      {toast && <div className="spb-toast">{toast}</div>}

      <div className="spb-header">
        <div>
          <h1>Appointments</h1>
          <p>Manage your service bookings</p>
        </div>
        <button className="spb-refresh-btn" onClick={fetchBookings} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Status summary cards */}
      <div className="spb-stats">
        {[
          ['pending', 'Pending', '#ff9800'],
          ['confirmed', 'Confirmed', '#2196f3'],
          ['in_progress', 'In Progress', '#9c27b0'],
          ['completed', 'Completed', '#4caf50'],
        ].map(([s, lbl, color]) => (
          <div key={s} className="spb-stat-card" style={{ borderTop: `4px solid ${color}` }}>
            <div className="spb-stat-num" style={{ color }}>{counts[s] || 0}</div>
            <div className="spb-stat-label">{lbl}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="spb-filters">
        {['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((s) => (
          <button
            key={s}
            className={`spb-filter-btn${filter === s ? ' active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'All' : label(s)}
            {s !== 'all' && counts[s] ? ` (${counts[s]})` : ''}
          </button>
        ))}
      </div>

      {error && (
        <div className="spb-error">
          {error} <button onClick={fetchBookings}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="spb-loading">
          <div className="spb-spinner" />
          <p>Loading appointments...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="spb-empty">
          <div>📅</div>
          <h3>No appointments found</h3>
          <p>{filter !== 'all' ? `No ${label(filter).toLowerCase()} bookings` : 'No bookings yet'}</p>
        </div>
      ) : (
        <div className="spb-list">
          {filtered.map((b) => {
            const customer = b.user
              ? `${b.user.firstName} ${b.user.lastName}`
              : 'Customer';
            return (
              <div key={b.id} className="spb-card">
                <div className="spb-card-top">
                  <div className="spb-card-info">
                    <h3>{b.title || label(b.serviceType)}</h3>
                    <p className="spb-customer">
                      👤 {customer}
                      {b.user?.phone ? ` • ${b.user.phone}` : ''}
                      {b.user?.email ? ` • ${b.user.email}` : ''}
                    </p>
                    <p className="spb-datetime">
                      📅 {fmtDate(b.scheduledDate)} at {fmtTime(b.scheduledTime)}
                    </p>
                    {b.customerNotes && (
                      <p className="spb-notes">📝 {b.customerNotes}</p>
                    )}
                    {b.estimatedCost && (
                      <p className="spb-cost">💰 Est. ${b.estimatedCost}</p>
                    )}
                  </div>
                  <span className={`spb-status ${STATUS_COLORS[b.status] || ''}`}>
                    {label(b.status)}
                  </span>
                </div>

                <div className="spb-card-actions">
                  {b.status === 'pending' && (
                    <>
                      <button
                        className="spb-btn confirm"
                        disabled={actionLoading === `${b.id}-confirmed`}
                        onClick={() => updateStatus(b.id, 'confirmed')}
                      >
                        {actionLoading === `${b.id}-confirmed` ? '...' : 'Confirm'}
                      </button>
                      <button
                        className="spb-btn cancel"
                        disabled={actionLoading === `${b.id}-cancelled`}
                        onClick={() => updateStatus(b.id, 'cancelled')}
                      >
                        {actionLoading === `${b.id}-cancelled` ? '...' : 'Decline'}
                      </button>
                    </>
                  )}
                  {b.status === 'confirmed' && (
                    <button
                      className="spb-btn inprogress"
                      disabled={actionLoading === `${b.id}-in_progress`}
                      onClick={() => updateStatus(b.id, 'in_progress')}
                    >
                      {actionLoading === `${b.id}-in_progress` ? '...' : 'Start Service'}
                    </button>
                  )}
                  {b.status === 'in_progress' && (
                    <button
                      className="spb-btn complete"
                      disabled={actionLoading === `${b.id}-completed`}
                      onClick={() => updateStatus(b.id, 'completed')}
                    >
                      {actionLoading === `${b.id}-completed` ? '...' : 'Mark Complete'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ServiceProviderBookings;
