/**
 * Dealer Inspections — lets dealers view and manage inspection appointment
 * requests for their vehicles. Dealers can Confirm or Reject (cancel) each request.
 * Customers see the updated status on their Appointments page.
 */
import { useState, useEffect, useCallback } from 'react';
import { bookingAPI } from '../../services/api';
import './Inspections.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_META = {
  pending:     { label: 'Pending',     cls: 'ins-pending',     icon: '⏳' },
  confirmed:   { label: 'Confirmed',   cls: 'ins-confirmed',   icon: '✅' },
  in_progress: { label: 'In Progress', cls: 'ins-inprogress',  icon: '🔍' },
  completed:   { label: 'Completed',   cls: 'ins-completed',   icon: '🏁' },
  cancelled:   { label: 'Rejected',    cls: 'ins-cancelled',   icon: '❌' },
  no_show:     { label: 'No Show',     cls: 'ins-cancelled',   icon: '🚫' },
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  : '—';

const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
};

// ─── Component ────────────────────────────────────────────────────────────────
const DealerInspections = () => {
  const [bookings, setBookings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [filter, setFilter]           = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast]             = useState('');
  const [detail, setDetail]           = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Dealers see bookings where they are the serviceProvider
      // Filter client-side for serviceType = 'inspection'
      const res = await bookingAPI.getAll({ limit: 100 });
      const all = res.data?.data || [];
      const inspections = all.filter(b => b.serviceType === 'inspection');
      setBookings(inspections);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load inspection requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInspections(); }, [fetchInspections]);

  const updateStatus = async (id, status) => {
    setActionLoading(`${id}-${status}`);
    try {
      await bookingAPI.updateStatus(id, status);
      setBookings(prev =>
        prev.map(b => b.id === id ? { ...b, status } : b)
      );
      if (detail?.id === id) setDetail(prev => ({ ...prev, status }));
      showToast(status === 'confirmed' ? 'Inspection confirmed ✅' : 'Inspection rejected');
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter);

  const count = (s) => bookings.filter(b => b.status === s).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="ins-page">
      {toast && <div className="ins-toast">{toast}</div>}

      <div className="ins-header">
        <div>
          <h1>🔍 Inspection Requests</h1>
          <p>Vehicle inspection appointments requested by customers</p>
        </div>
        <button className="ins-btn refresh" onClick={fetchInspections} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="ins-stats">
        {[
          ['pending',   'Pending',   '#ff9800'],
          ['confirmed', 'Confirmed', '#2196f3'],
          ['completed', 'Completed', '#4caf50'],
          ['cancelled', 'Rejected',  '#f44336'],
        ].map(([s, lbl, color]) => (
          <div key={s} className="ins-stat" style={{ borderTop: `4px solid ${color}` }}>
            <span className="ins-stat-n" style={{ color }}>{count(s)}</span>
            <span className="ins-stat-l">{lbl}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="ins-filters">
        {['all','pending','confirmed','in_progress','completed','cancelled'].map(s => (
          <button
            key={s}
            className={`ins-filter-btn ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'All' : STATUS_META[s]?.label || s}
            {s !== 'all' && count(s) > 0 && ` (${count(s)})`}
          </button>
        ))}
      </div>

      {error && <div className="ins-error">{error}</div>}

      {loading ? (
        <div className="ins-loading">
          <div className="ins-spinner" />
          <p>Loading inspection requests…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="ins-empty">
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔍</div>
          <h3>No {filter !== 'all' ? STATUS_META[filter]?.label?.toLowerCase() || filter : ''} inspection requests</h3>
          <p>{filter === 'all' ? 'No customers have booked inspections yet.' : 'Try a different filter.'}</p>
        </div>
      ) : (
        <div className="ins-list">
          {filtered.map(b => {
            const sm = STATUS_META[b.status] || STATUS_META.pending;
            const customer = b.user
              ? `${b.user.firstName} ${b.user.lastName}`
              : 'Customer';
            return (
              <div key={b.id} className="ins-card">
                <div className="ins-card-top">
                  <div className="ins-card-info">
                    <h3>{b.title || 'Vehicle Inspection'}</h3>
                    <div className="ins-customer">
                      👤 {customer}
                      {b.user?.phone && (
                        <a
                          href={`tel:${b.user.phone.replace(/[\s\-().]/g, '')}`}
                          className="ins-phone-link"
                          onClick={e => e.stopPropagation()}
                        >
                          📞 {b.user.phone}
                        </a>
                      )}
                    </div>
                    <div className="ins-datetime">
                      📅 {fmtDate(b.scheduledDate)}
                      {b.scheduledTime && ` at ${fmtTime(b.scheduledTime)}`}
                    </div>
                    {b.vehicle && (
                      <div className="ins-vehicle">
                        🚗 {b.vehicle.year} {b.vehicle.make} {b.vehicle.model}
                        {b.vehicle.vin && <span className="ins-vin"> · VIN: {b.vehicle.vin}</span>}
                      </div>
                    )}
                    {b.customerNotes && (
                      <div className="ins-notes">📝 {b.customerNotes}</div>
                    )}
                  </div>
                  <div className="ins-card-right">
                    <span className={`ins-status-badge ${sm.cls}`}>
                      {sm.icon} {sm.label}
                    </span>
                    <span className="ins-ref">#{String(b.id).padStart(6,'0')}</span>
                  </div>
                </div>

                <div className="ins-card-actions">
                  <button
                    className="ins-btn details"
                    onClick={() => setDetail(b)}
                  >
                    View Details
                  </button>
                  {b.status === 'pending' && (
                    <>
                      <button
                        className="ins-btn confirm"
                        disabled={!!actionLoading}
                        onClick={() => updateStatus(b.id, 'confirmed')}
                      >
                        {actionLoading === `${b.id}-confirmed` ? '…' : '✅ Confirm'}
                      </button>
                      <button
                        className="ins-btn reject"
                        disabled={!!actionLoading}
                        onClick={() => updateStatus(b.id, 'cancelled')}
                      >
                        {actionLoading === `${b.id}-cancelled` ? '…' : '❌ Reject'}
                      </button>
                    </>
                  )}
                  {b.status === 'confirmed' && (
                    <button
                      className="ins-btn inprogress"
                      disabled={!!actionLoading}
                      onClick={() => updateStatus(b.id, 'in_progress')}
                    >
                      {actionLoading === `${b.id}-in_progress` ? '…' : '🔍 Start Inspection'}
                    </button>
                  )}
                  {b.status === 'in_progress' && (
                    <button
                      className="ins-btn complete"
                      disabled={!!actionLoading}
                      onClick={() => updateStatus(b.id, 'completed')}
                    >
                      {actionLoading === `${b.id}-completed` ? '…' : '🏁 Mark Complete'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="ins-overlay" onClick={() => setDetail(null)}>
          <div className="ins-modal" onClick={e => e.stopPropagation()}>
            <div className="ins-modal-head">
              <h3>Inspection Details</h3>
              <button className="ins-modal-close" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="ins-modal-body">
              {(() => {
                const sm = STATUS_META[detail.status] || STATUS_META.pending;
                return (
                  <div className={`ins-detail-banner ${sm.cls}`}>
                    <span style={{ fontSize: '1.3rem' }}>{sm.icon}</span>
                    <strong>{sm.label}</strong>
                  </div>
                );
              })()}
              <div className="ins-detail-grid">
                {[
                  ['Reference',   `#${String(detail.id).padStart(6,'0')}`],
                  ['Service',     detail.title || 'Vehicle Inspection'],
                  ['Customer',    detail.user ? `${detail.user.firstName} ${detail.user.lastName}` : '—'],
                  ['Phone',       detail.user?.phone || '—'],
                  ['Email',       detail.user?.email || '—'],
                  ['Date',        fmtDate(detail.scheduledDate)],
                  ['Time',        detail.scheduledTime ? fmtTime(detail.scheduledTime) : '—'],
                  ['Vehicle',     detail.vehicle ? `${detail.vehicle.year} ${detail.vehicle.make} ${detail.vehicle.model}` : '—'],
                  ['VIN',         detail.vehicle?.vin || '—'],
                ].map(([label, val]) => (
                  <div key={label} className="ins-detail-row">
                    <span className="ins-detail-label">{label}</span>
                    <span className="ins-detail-value">{val}</span>
                  </div>
                ))}
                {detail.customerNotes && (
                  <div className="ins-detail-row full">
                    <span className="ins-detail-label">Customer Notes</span>
                    <span className="ins-detail-value">{detail.customerNotes}</span>
                  </div>
                )}
                {detail.providerNotes && (
                  <div className="ins-detail-row full">
                    <span className="ins-detail-label">Your Notes</span>
                    <span className="ins-detail-value">{detail.providerNotes}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="ins-modal-foot">
              {detail.status === 'pending' && (
                <>
                  <button
                    className="ins-btn confirm"
                    onClick={() => { updateStatus(detail.id, 'confirmed'); setDetail(null); }}
                  >
                    ✅ Confirm
                  </button>
                  <button
                    className="ins-btn reject"
                    onClick={() => { updateStatus(detail.id, 'cancelled'); setDetail(null); }}
                  >
                    ❌ Reject
                  </button>
                </>
              )}
              <button className="ins-btn details" onClick={() => setDetail(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealerInspections;
