import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentService } from '../../services/appointmentService';
import { CURRENCY_SYMBOL } from '../../utils/currency';
import PhoneLink from '../../components/PhoneLink';
import './Appointments.css';

// ─── helpers ──────────────────────────────────────────────────────────────────
const SERVICE_LABELS = {
  car_wash: 'Car Wash', oil_change: 'Oil Change', brake_service: 'Brake Service',
  tire_service: 'Tire Service', engine_diagnostic: 'Engine Diagnostic',
  transmission_service: 'Transmission Service', air_conditioning: 'Air Conditioning',
  battery_service: 'Battery Service', general_maintenance: 'General Maintenance',
  inspection: 'Vehicle Inspection', repair: 'General Repair', other: 'Other Service',
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }) : '—';

const STATUS_META = {
  pending:     { label: 'Pending',     cls: 'status-pending',     icon: '⏳' },
  confirmed:   { label: 'Confirmed',   cls: 'status-confirmed',   icon: '✅' },
  in_progress: { label: 'In Progress', cls: 'status-in-progress', icon: '🔧' },
  completed:   { label: 'Completed',   cls: 'status-completed',   icon: '🏁' },
  cancelled:   { label: 'Cancelled',   cls: 'status-cancelled',   icon: '❌' },
  no_show:     { label: 'No Show',     cls: 'status-cancelled',   icon: '🚫' },
};

const Stars = ({ value }) => (
  <span className="apt-stars" aria-label={`${value} out of 5 stars`}>
    {[1,2,3,4,5].map(i => (
      <span key={i} style={{ color: i <= value ? '#f59e0b' : '#d1d5db' }}>★</span>
    ))}
  </span>
);

// ─── Component ────────────────────────────────────────────────────────────────
const UserAppointments = () => {
  const navigate = useNavigate();

  const [appointments, setAppointments]   = useState([]);
  const [filter, setFilter]               = useState('all');
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');

  // Detail modal
  const [detailApt, setDetailApt]         = useState(null);

  // Reschedule modal
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [rescheduleData, setRescheduleData]   = useState({ date: '', time: '' });
  const [rescheduleErr, setRescheduleErr]     = useState('');
  const [rescheduling, setRescheduling]       = useState(false);

  // Review modal
  const [reviewModal, setReviewModal]     = useState(null);
  const [reviewData, setReviewData]       = useState({ rating: 0, review: '' });
  const [reviewErr, setReviewErr]         = useState('');
  const [reviewing, setReviewing]         = useState(false);

  // Cancel
  const [cancelling, setCancelling]       = useState(null);

  useEffect(() => { fetchAppointments(); }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await appointmentService.getUserAppointments();
      if (response.success) {
        const transformed = (response.data || []).map(b => ({
          id: b.id,
          serviceType: SERVICE_LABELS[b.serviceType] || b.serviceType || 'Service',
          serviceTypeRaw: b.serviceType,
          provider: b.serviceProvider
            ? `${b.serviceProvider.firstName} ${b.serviceProvider.lastName}`
            : 'AutoSphere Service',
          providerPhone: b.serviceProvider?.phone || '',
          providerEmail: b.serviceProvider?.email || '',
          date: b.scheduledDate
            ? new Date(b.scheduledDate).toISOString().split('T')[0]
            : '',
          time: b.scheduledTime || '',
          status: b.status || 'pending',
          price: b.actualCost || b.estimatedCost || 0,
          address: b.location?.address || '',
          notes: b.customerNotes || b.description || '',
          providerNotes: b.providerNotes || '',
          priority: b.priority || 'normal',
          confirmationNumber: `AS-${String(b.id).padStart(6, '0')}`,
          rating: b.rating || 0,
          review: b.review || '',
          createdAt: b.createdAt,
          completedAt: b.completedAt,
        }));
        setAppointments(transformed);
      } else {
        setError(response.message || 'Failed to load appointments.');
      }
    } catch {
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── filter ─────────────────────────────────────────────────────────────────
  const filtered = appointments.filter(a =>
    filter === 'all' ? true : a.status === filter
  );

  const count = (s) => appointments.filter(a => a.status === s).length;

  // ── cancel ─────────────────────────────────────────────────────────────────
  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancelling(id);
    try {
      const res = await appointmentService.cancelAppointment(id);
      if (res.success) {
        setAppointments(prev =>
          prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a)
        );
        if (detailApt?.id === id)
          setDetailApt(prev => ({ ...prev, status: 'cancelled' }));
      } else {
        setError(res.message || 'Failed to cancel appointment.');
      }
    } catch {
      setError('Failed to cancel. Please try again.');
    } finally {
      setCancelling(null);
    }
  };

  // ── reschedule ─────────────────────────────────────────────────────────────
  const openReschedule = (apt) => {
    setRescheduleModal(apt.id);
    setRescheduleData({ date: apt.date, time: apt.time });
    setRescheduleErr('');
  };

  const submitReschedule = async () => {
    if (!rescheduleData.date || !rescheduleData.time) {
      setRescheduleErr('Please select both a date and a time.');
      return;
    }
    if (new Date(`${rescheduleData.date}T${rescheduleData.time}`) <= new Date()) {
      setRescheduleErr('Please select a future date and time.');
      return;
    }
    setRescheduling(true);
    try {
      const res = await appointmentService.rescheduleAppointment(
        rescheduleModal, rescheduleData.date, rescheduleData.time
      );
      if (res.success) {
        setAppointments(prev =>
          prev.map(a =>
            a.id === rescheduleModal
              ? { ...a, date: rescheduleData.date, time: rescheduleData.time }
              : a
          )
        );
        if (detailApt?.id === rescheduleModal)
          setDetailApt(prev => ({
            ...prev, date: rescheduleData.date, time: rescheduleData.time,
          }));
        setRescheduleModal(null);
      } else {
        setRescheduleErr(res.message || 'Failed to reschedule.');
      }
    } catch {
      setRescheduleErr('Failed to reschedule. Please try again.');
    } finally {
      setRescheduling(false);
    }
  };

  // ── review ─────────────────────────────────────────────────────────────────
  const openReview = (apt) => {
    setReviewModal(apt.id);
    setReviewData({ rating: apt.rating || 0, review: apt.review || '' });
    setReviewErr('');
  };

  const submitReview = async () => {
    if (!reviewData.rating) { setReviewErr('Please select a star rating.'); return; }
    setReviewing(true);
    try {
      const res = await appointmentService.addReview(
        reviewModal, reviewData.rating, reviewData.review
      );
      if (res.success) {
        setAppointments(prev =>
          prev.map(a =>
            a.id === reviewModal
              ? { ...a, rating: reviewData.rating, review: reviewData.review }
              : a
          )
        );
        if (detailApt?.id === reviewModal)
          setDetailApt(prev => ({
            ...prev, rating: reviewData.rating, review: reviewData.review,
          }));
        setReviewModal(null);
      } else {
        setReviewErr(res.message || 'Failed to submit review.');
      }
    } catch {
      setReviewErr('Failed to submit review. Please try again.');
    } finally {
      setReviewing(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  // ── loading / error states ─────────────────────────────────────────────────
  if (loading) return (
    <div className="apt-page">
      <div className="apt-container">
        <div className="apt-state-box">
          <div className="apt-spinner" />
          <p>Loading your appointments…</p>
        </div>
      </div>
    </div>
  );

  if (error && appointments.length === 0) return (
    <div className="apt-page">
      <div className="apt-container">
        <div className="apt-state-box">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <p style={{ color: '#d32f2f', marginBottom: '1rem' }}>{error}</p>
          <button className="apt-btn primary" onClick={fetchAppointments}>Retry</button>
        </div>
      </div>
    </div>
  );

  // ── main render ────────────────────────────────────────────────────────────
  return (
    <div className="apt-page">
      <div className="apt-container">

        {/* Header */}
        <div className="apt-header">
          <div>
            <h1>My Appointments</h1>
            <p>Manage your service bookings and history</p>
          </div>
          <button className="apt-btn primary" onClick={() => navigate('/book-service')}>
            + Book a Service
          </button>
        </div>

        {error && <div className="apt-alert error">{error}</div>}

        {/* Filters */}
        <div className="apt-filters">
          {[
            { key: 'all',         label: 'All',         n: appointments.length },
            { key: 'pending',     label: 'Pending',     n: count('pending') },
            { key: 'confirmed',   label: 'Confirmed',   n: count('confirmed') },
            { key: 'in_progress', label: 'In Progress', n: count('in_progress') },
            { key: 'completed',   label: 'Completed',   n: count('completed') },
            { key: 'cancelled',   label: 'Cancelled',   n: count('cancelled') },
          ].map(({ key, label, n }) => (
            <button
              key={key}
              className={`apt-filter-btn ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label} <span className="apt-filter-count">{n}</span>
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="apt-state-box">
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📅</div>
            <h3>No {filter !== 'all' ? filter : ''} appointments found</h3>
            <p>
              {filter === 'all'
                ? "You haven't booked any services yet."
                : `No ${filter} appointments to show.`}
            </p>
            <button className="apt-btn primary" onClick={() => navigate('/book-service')}>
              Book Your First Service
            </button>
          </div>
        ) : (
          <div className="apt-list">
            {filtered.map(apt => {
              const sm = STATUS_META[apt.status] || STATUS_META.pending;
              return (
                <div key={apt.id} className="apt-card">
                  {/* Card top */}
                  <div className="apt-card-top">
                    <div className="apt-card-main">
                      <div className="apt-service-icon">
                        {sm.icon}
                      </div>
                      <div>
                        <h3 className="apt-service-name">{apt.serviceType}</h3>
                        <p className="apt-provider">👤 {apt.provider}</p>
                        <p className="apt-confirmation">#{apt.confirmationNumber}</p>
                      </div>
                    </div>
                    <div className="apt-card-right">
                      <span className={`apt-status ${sm.cls}`}>{sm.label}</span>
                      {apt.priority !== 'normal' && (
                        <span className={`apt-priority apt-priority-${apt.priority}`}>
                          {apt.priority}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card info row */}
                  <div className="apt-card-info">
                    <div className="apt-info-item">
                      <span>📅</span>
                      <span>{fmtDate(apt.date)}{apt.time ? ` · ${apt.time}` : ''}</span>
                    </div>
                    {apt.price > 0 && (
                      <div className="apt-info-item">
                        <span>💰</span>
                        <span>{CURRENCY_SYMBOL}{Number(apt.price).toFixed(2)}</span>
                      </div>
                    )}
                    {apt.notes && (
                      <div className="apt-info-item">
                        <span>📝</span>
                        <span className="apt-notes-preview">{apt.notes}</span>
                      </div>
                    )}
                    {apt.rating > 0 && (
                      <div className="apt-info-item">
                        <span>⭐</span>
                        <Stars value={apt.rating} />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="apt-card-actions">
                    <button
                      className="apt-btn outline"
                      onClick={() => setDetailApt(apt)}
                    >
                      View Details
                    </button>
                    {['pending','confirmed'].includes(apt.status) && (
                      <>
                        <button
                          className="apt-btn outline"
                          onClick={() => openReschedule(apt)}
                        >
                          Reschedule
                        </button>
                        <button
                          className="apt-btn danger"
                          onClick={() => handleCancel(apt.id)}
                          disabled={cancelling === apt.id}
                        >
                          {cancelling === apt.id ? 'Cancelling…' : 'Cancel'}
                        </button>
                      </>
                    )}
                    {apt.status === 'completed' && apt.rating === 0 && (
                      <button
                        className="apt-btn primary"
                        onClick={() => openReview(apt)}
                      >
                        ⭐ Leave Review
                      </button>
                    )}
                    {apt.status === 'completed' && apt.rating > 0 && (
                      <button
                        className="apt-btn outline"
                        onClick={() => openReview(apt)}
                      >
                        Edit Review
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary strip */}
        {appointments.length > 0 && (
          <div className="apt-summary">
            <div className="apt-summary-stat">
              <span className="apt-summary-n">{count('completed')}</span>
              <span className="apt-summary-l">Completed</span>
            </div>
            <div className="apt-summary-stat">
              <span className="apt-summary-n">
                {appointments.filter(a => ['pending','confirmed','in_progress'].includes(a.status)).length}
              </span>
              <span className="apt-summary-l">Upcoming</span>
            </div>
            <div className="apt-summary-stat">
              <span className="apt-summary-n">
                {CURRENCY_SYMBOL}{appointments
                  .filter(a => a.status === 'completed' && a.price > 0)
                  .reduce((s, a) => s + Number(a.price), 0)
                  .toFixed(0)}
              </span>
              <span className="apt-summary-l">Total Spent</span>
            </div>
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL ─────────────────────────────────────────────────── */}
      {detailApt && (
        <div className="apt-overlay" onClick={() => setDetailApt(null)}>
          <div className="apt-modal" onClick={e => e.stopPropagation()}>
            <div className="apt-modal-head">
              <h3>Appointment Details</h3>
              <button className="apt-modal-close" onClick={() => setDetailApt(null)}>✕</button>
            </div>
            <div className="apt-modal-body">

              {/* Status banner */}
              {(() => {
                const sm = STATUS_META[detailApt.status] || STATUS_META.pending;
                return (
                  <div className={`apt-detail-banner ${sm.cls}`}>
                    <span style={{ fontSize: '1.3rem' }}>{sm.icon}</span>
                    <span>{sm.label}</span>
                  </div>
                );
              })()}

              <div className="apt-detail-section">
                <div className="apt-detail-label">Confirmation</div>
                <div className="apt-detail-value mono">#{detailApt.confirmationNumber}</div>
              </div>

              <div className="apt-detail-grid">
                <div className="apt-detail-section">
                  <div className="apt-detail-label">Service</div>
                  <div className="apt-detail-value">{detailApt.serviceType}</div>
                </div>
                <div className="apt-detail-section">
                  <div className="apt-detail-label">Provider</div>
                  <div className="apt-detail-value">{detailApt.provider}</div>
                </div>
                <div className="apt-detail-section">
                  <div className="apt-detail-label">Date</div>
                  <div className="apt-detail-value">{fmtDate(detailApt.date)}</div>
                </div>
                <div className="apt-detail-section">
                  <div className="apt-detail-label">Time</div>
                  <div className="apt-detail-value">{detailApt.time || '—'}</div>
                </div>
                {detailApt.price > 0 && (
                  <div className="apt-detail-section">
                    <div className="apt-detail-label">Cost</div>
                    <div className="apt-detail-value">
                      {CURRENCY_SYMBOL}{Number(detailApt.price).toFixed(2)}
                    </div>
                  </div>
                )}
                {detailApt.priority !== 'normal' && (
                  <div className="apt-detail-section">
                    <div className="apt-detail-label">Priority</div>
                    <div className="apt-detail-value" style={{ textTransform: 'capitalize' }}>
                      {detailApt.priority}
                    </div>
                  </div>
                )}
                {detailApt.providerPhone && (
                  <div className="apt-detail-section">
                    <div className="apt-detail-label">Provider Phone</div>
                    <div className="apt-detail-value">
                      <PhoneLink phone={detailApt.providerPhone} size="md" />
                    </div>
                  </div>
                )}
                {detailApt.providerEmail && (
                  <div className="apt-detail-section">
                    <div className="apt-detail-label">Provider Email</div>
                    <div className="apt-detail-value">
                      <a href={`mailto:${detailApt.providerEmail}`} className="apt-link">
                        {detailApt.providerEmail}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {detailApt.notes && (
                <div className="apt-detail-section full">
                  <div className="apt-detail-label">Your Notes</div>
                  <div className="apt-detail-value apt-notes-box">{detailApt.notes}</div>
                </div>
              )}
              {detailApt.providerNotes && (
                <div className="apt-detail-section full">
                  <div className="apt-detail-label">Provider Notes</div>
                  <div className="apt-detail-value apt-notes-box">{detailApt.providerNotes}</div>
                </div>
              )}
              {detailApt.rating > 0 && (
                <div className="apt-detail-section full">
                  <div className="apt-detail-label">Your Review</div>
                  <div className="apt-detail-value">
                    <Stars value={detailApt.rating} />
                    {detailApt.review && (
                      <p style={{ margin: '6px 0 0', color: '#555' }}>{detailApt.review}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="apt-modal-foot">
              {['pending','confirmed'].includes(detailApt.status) && (
                <>
                  <button
                    className="apt-btn outline"
                    onClick={() => { setDetailApt(null); openReschedule(detailApt); }}
                  >
                    Reschedule
                  </button>
                  <button
                    className="apt-btn danger"
                    onClick={() => { handleCancel(detailApt.id); setDetailApt(null); }}
                  >
                    Cancel
                  </button>
                </>
              )}
              {detailApt.status === 'completed' && (
                <button
                  className="apt-btn primary"
                  onClick={() => { setDetailApt(null); openReview(detailApt); }}
                >
                  {detailApt.rating ? 'Edit Review' : '⭐ Leave Review'}
                </button>
              )}
              <button className="apt-btn secondary" onClick={() => setDetailApt(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESCHEDULE MODAL ─────────────────────────────────────────────── */}
      {rescheduleModal && (
        <div className="apt-overlay" onClick={() => setRescheduleModal(null)}>
          <div className="apt-modal apt-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="apt-modal-head">
              <h3>Reschedule Appointment</h3>
              <button className="apt-modal-close" onClick={() => setRescheduleModal(null)}>✕</button>
            </div>
            <div className="apt-modal-body">
              {rescheduleErr && <div className="apt-alert error">{rescheduleErr}</div>}
              <div className="apt-form-group">
                <label>New Date <span style={{ color: '#e53935' }}>*</span></label>
                <input
                  type="date" className="apt-input" min={minDate}
                  value={rescheduleData.date}
                  onChange={e => setRescheduleData(p => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div className="apt-form-group">
                <label>New Time <span style={{ color: '#e53935' }}>*</span></label>
                <select
                  className="apt-input"
                  value={rescheduleData.time}
                  onChange={e => setRescheduleData(p => ({ ...p, time: e.target.value }))}
                >
                  <option value="">Select a time…</option>
                  {['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="apt-modal-foot">
              <button className="apt-btn secondary" onClick={() => setRescheduleModal(null)}>
                Cancel
              </button>
              <button
                className="apt-btn primary"
                onClick={submitReschedule}
                disabled={rescheduling}
              >
                {rescheduling ? 'Saving…' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REVIEW MODAL ─────────────────────────────────────────────────── */}
      {reviewModal && (
        <div className="apt-overlay" onClick={() => setReviewModal(null)}>
          <div className="apt-modal apt-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="apt-modal-head">
              <h3>Leave a Review</h3>
              <button className="apt-modal-close" onClick={() => setReviewModal(null)}>✕</button>
            </div>
            <div className="apt-modal-body">
              {reviewErr && <div className="apt-alert error">{reviewErr}</div>}
              <div className="apt-form-group">
                <label>Rating <span style={{ color: '#e53935' }}>*</span></label>
                <div className="apt-star-picker">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      type="button"
                      className={`apt-star-btn ${reviewData.rating >= n ? 'active' : ''}`}
                      onClick={() => setReviewData(p => ({ ...p, rating: n }))}
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    >★</button>
                  ))}
                </div>
                {reviewData.rating > 0 && (
                  <p className="apt-rating-label">
                    {['','Poor','Fair','Good','Very Good','Excellent'][reviewData.rating]}
                  </p>
                )}
              </div>
              <div className="apt-form-group">
                <label>Comments (optional)</label>
                <textarea
                  className="apt-input"
                  rows={4}
                  placeholder="Tell us about your experience…"
                  value={reviewData.review}
                  onChange={e => setReviewData(p => ({ ...p, review: e.target.value }))}
                />
              </div>
            </div>
            <div className="apt-modal-foot">
              <button className="apt-btn secondary" onClick={() => setReviewModal(null)}>
                Cancel
              </button>
              <button
                className="apt-btn primary"
                onClick={submitReview}
                disabled={reviewing}
              >
                {reviewing ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAppointments;
