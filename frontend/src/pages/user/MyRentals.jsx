/**
 * MyRentals — shows the customer's vehicle rental requests and their statuses.
 * Separate from service appointments — rentals have different fields
 * (start/end dates, daily rate, vehicle info) and different status labels.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { rentalAPI } from '../../services/api';
import { CURRENCY_SYMBOL } from '../../utils/currency';
import './MyRentals.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_META = {
  pending:    { label: 'Pending',    cls: 'rent-status-pending',    icon: '⏳', desc: 'Awaiting dealer confirmation' },
  confirmed:  { label: 'Confirmed',  cls: 'rent-status-confirmed',  icon: '✅', desc: 'Dealer confirmed your rental' },
  in_progress:{ label: 'Active',     cls: 'rent-status-active',     icon: '🚗', desc: 'Rental is currently active' },
  completed:  { label: 'Completed',  cls: 'rent-status-completed',  icon: '🏁', desc: 'Rental has ended' },
  cancelled:  { label: 'Cancelled',  cls: 'rent-status-cancelled',  icon: '❌', desc: 'Rental was cancelled' },
  no_show:    { label: 'No Show',    cls: 'rent-status-cancelled',  icon: '🚫', desc: 'Vehicle not collected' },
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
};

const MyRentals = () => {
  const navigate = useNavigate();
  const [rentals, setRentals]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filter, setFilter]     = useState('all');
  const [detail, setDetail]     = useState(null);

  const fetchRentals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await rentalAPI.getMyRentals();
      if (res.data?.success) {
        setRentals(res.data.data || []);
      } else {
        setError('Failed to load rentals.');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load rentals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRentals(); }, [fetchRentals]);

  const filtered = filter === 'all'
    ? rentals
    : rentals.filter(r => r.status === filter);

  const count = (s) => rentals.filter(r => r.status === s).length;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="myr-page">
      <div className="myr-container">
        <div className="myr-state-box">
          <div className="myr-spinner" />
          <p>Loading your rentals…</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="myr-page">
      <div className="myr-container">

        {/* Header */}
        <div className="myr-header">
          <div>
            <h1>My Rentals</h1>
            <p>Track all your vehicle rental requests and their current status</p>
          </div>
          <button className="myr-btn primary" onClick={() => navigate('/rent-vehicle')}>
            + Rent a Vehicle
          </button>
        </div>

        {error && <div className="myr-alert error">{error}</div>}

        {/* Filters */}
        <div className="myr-filters">
          {[
            { key: 'all',        label: 'All',       n: rentals.length },
            { key: 'pending',    label: 'Pending',   n: count('pending') },
            { key: 'confirmed',  label: 'Confirmed', n: count('confirmed') },
            { key: 'in_progress',label: 'Active',    n: count('in_progress') },
            { key: 'completed',  label: 'Completed', n: count('completed') },
            { key: 'cancelled',  label: 'Cancelled', n: count('cancelled') },
          ].map(({ key, label, n }) => (
            <button
              key={key}
              className={`myr-filter-btn ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label} <span className="myr-filter-count">{n}</span>
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="myr-state-box">
            <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🚗</div>
            <h3>No {filter !== 'all' ? filter : ''} rentals found</h3>
            <p>
              {filter === 'all'
                ? "You haven't submitted any rental requests yet."
                : `No ${filter} rentals to show.`}
            </p>
            <button className="myr-btn primary" onClick={() => navigate('/rent-vehicle')}>
              Browse Vehicles to Rent
            </button>
          </div>
        ) : (
          <div className="myr-list">
            {filtered.map(rental => {
              const sm = STATUS_META[rental.status] || STATUS_META.pending;
              return (
                <div key={rental.id} className="myr-card">
                  {/* Card header */}
                  <div className="myr-card-top">
                    <div className="myr-card-main">
                      <div className="myr-vehicle-img">
                        {rental.vehicle?.images?.[0]
                          ? <img src={rental.vehicle.images[0]} alt={rental.vehicleName} />
                          : <div className="myr-img-placeholder">🚗</div>
                        }
                      </div>
                      <div>
                        <h3 className="myr-vehicle-name">{rental.vehicleName}</h3>
                        <p className="myr-dealer">
                          🏢 {rental.dealer
                            ? `${rental.dealer.firstName} ${rental.dealer.lastName}`
                            : 'Dealer'}
                        </p>
                        <p className="myr-ref">Ref: AS-{String(rental.id).padStart(6, '0')}</p>
                      </div>
                    </div>
                    <div className="myr-card-right">
                      <span className={`myr-status ${sm.cls}`}>
                        {sm.icon} {sm.label}
                      </span>
                      <span className="myr-status-desc">{sm.desc}</span>
                    </div>
                  </div>

                  {/* Dates row */}
                  <div className="myr-card-dates">
                    <div className="myr-date-item">
                      <span className="myr-date-label">📅 Pick-up</span>
                      <span className="myr-date-value">{fmtDate(rental.startDate)}</span>
                      {rental.pickupTime && (
                        <span className="myr-date-time">at {rental.pickupTime}</span>
                      )}
                    </div>
                    <div className="myr-date-arrow">→</div>
                    <div className="myr-date-item">
                      <span className="myr-date-label">📅 Return</span>
                      <span className="myr-date-value">{fmtDate(rental.endDate)}</span>
                    </div>
                    {rental.days && (
                      <div className="myr-date-item myr-duration">
                        <span className="myr-date-label">⏱ Duration</span>
                        <span className="myr-date-value">{rental.days} day{rental.days !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  {/* Cost row */}
                  {rental.estimatedTotal > 0 && (
                    <div className="myr-card-cost">
                      <span className="myr-cost-label">Estimated Total</span>
                      <span className="myr-cost-value">
                        {CURRENCY_SYMBOL} {Number(rental.estimatedTotal).toLocaleString()}
                      </span>
                      {rental.dailyRate && (
                        <span className="myr-daily-rate">
                          ({CURRENCY_SYMBOL}{Number(rental.dailyRate).toLocaleString()} / day)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="myr-card-actions">
                    <button
                      className="myr-btn outline"
                      onClick={() => setDetail(rental)}
                    >
                      View Details
                    </button>
                    {rental.dealer?.phone && (
                      <a
                        href={`tel:${rental.dealer.phone.replace(/[\s\-().]/g, '')}`}
                        className="myr-btn call"
                      >
                        📞 Call Dealer
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="myr-overlay" onClick={() => setDetail(null)}>
          <div className="myr-modal" onClick={e => e.stopPropagation()}>
            <div className="myr-modal-head">
              <h3>Rental Details</h3>
              <button className="myr-modal-close" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="myr-modal-body">
              {(() => {
                const sm = STATUS_META[detail.status] || STATUS_META.pending;
                return (
                  <div className={`myr-detail-banner ${sm.cls}`}>
                    <span style={{ fontSize: '1.3rem' }}>{sm.icon}</span>
                    <div>
                      <strong>{sm.label}</strong>
                      <span style={{ marginLeft: 8, fontSize: '.85rem', opacity: .8 }}>{sm.desc}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="myr-detail-grid">
                {[
                  ['Reference',      `AS-${String(detail.id).padStart(6, '0')}`],
                  ['Vehicle',        detail.vehicleName],
                  ['Dealer',         detail.dealer ? `${detail.dealer.firstName} ${detail.dealer.lastName}` : '—'],
                  ['Dealer Phone',   detail.dealer?.phone || '—'],
                  ['Dealer Email',   detail.dealer?.email || '—'],
                  ['Pick-up Date',   fmtDate(detail.startDate)],
                  ['Return Date',    fmtDate(detail.endDate)],
                  ['Pick-up Time',   detail.pickupTime || '—'],
                  ['Duration',       detail.days ? `${detail.days} day${detail.days !== 1 ? 's' : ''}` : '—'],
                  ['Daily Rate',     detail.dailyRate ? `${CURRENCY_SYMBOL} ${Number(detail.dailyRate).toLocaleString()}` : '—'],
                  ['Est. Total',     detail.estimatedTotal ? `${CURRENCY_SYMBOL} ${Number(detail.estimatedTotal).toLocaleString()}` : '—'],
                  ['Driver License', detail.driverLicense || 'Not provided'],
                  ['Submitted',      detail.createdAt ? fmtDate(detail.createdAt) : '—'],
                ].map(([label, val]) => (
                  <div key={label} className="myr-detail-row">
                    <span className="myr-detail-label">{label}</span>
                    <span className="myr-detail-value">{val}</span>
                  </div>
                ))}
                {detail.notes && (
                  <div className="myr-detail-row full">
                    <span className="myr-detail-label">Notes</span>
                    <span className="myr-detail-value">{detail.notes}</span>
                  </div>
                )}
              </div>

              <div className="myr-modal-note">
                ℹ️ Prices shown are estimates. The dealer will confirm the final cost.
              </div>
            </div>
            <div className="myr-modal-foot">
              {detail.dealer?.phone && (
                <a
                  href={`tel:${detail.dealer.phone.replace(/[\s\-().]/g, '')}`}
                  className="myr-btn call"
                >
                  📞 Call Dealer
                </a>
              )}
              <button className="myr-btn secondary" onClick={() => setDetail(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRentals;
