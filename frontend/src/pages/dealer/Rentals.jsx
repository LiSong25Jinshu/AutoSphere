/**
 * Dealer Rentals & Test Drives
 * Dealers can manage rental requests and test-drive bookings for their vehicles.
 *
 * Rental status flow:
 *   pending → confirmed → ready_for_pickup → in_progress (active) → completed
 *   any → cancelled
 *
 * Test drive:
 *   pending → confirmed → completed | cancelled
 */
import { useState, useEffect, useCallback } from 'react';
import { rentalAPI } from '../../services/api';
import './Rentals.css';

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-US', { weekday:'short', day:'numeric', month:'short', year:'numeric' })
  : '—';

const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
};

const RENTAL_STATUS = {
  pending:          { label:'Pending',           cls:'dr-pending',    icon:'⏳' },
  confirmed:        { label:'Confirmed',          cls:'dr-confirmed',  icon:'✅' },
  ready_for_pickup: { label:'Ready for Pickup',   cls:'dr-ready',      icon:'🔑' },
  in_progress:      { label:'Active',             cls:'dr-active',     icon:'🚗' },
  completed:        { label:'Completed',          cls:'dr-completed',  icon:'🏁' },
  cancelled:        { label:'Cancelled/Rejected', cls:'dr-cancelled',  icon:'❌' },
};

const TD_STATUS = {
  pending:   { label:'Pending',   cls:'dr-pending',   icon:'⏳' },
  confirmed: { label:'Confirmed', cls:'dr-confirmed', icon:'✅' },
  completed: { label:'Completed', cls:'dr-completed', icon:'🏁' },
  cancelled: { label:'Rejected',  cls:'dr-cancelled', icon:'❌' },
};

// ─── RentalCard ───────────────────────────────────────────────────────────────
const RentalCard = ({ item, onAction, actionLoading, type }) => {
  const isRental = type === 'rental';
  const SM = isRental ? RENTAL_STATUS : TD_STATUS;
  const sm = SM[item.status] || SM.pending;

  const name  = isRental
    ? `${item.dealer?.firstName || ''} ${item.dealer?.lastName || ''}`.trim() || 'Dealer'
    : `${item.customer?.firstName || ''} ${item.customer?.lastName || ''}`.trim() || 'Customer';
  const phone = isRental ? item.dealer?.phone : item.customer?.phone;
  const email = isRental ? item.dealer?.email : item.customer?.email;

  // Determine which action buttons to show
  const actions = [];
  if (isRental) {
    if (item.status === 'pending') {
      actions.push({ label:'✅ Confirm',         status:'confirmed' });
      actions.push({ label:'❌ Reject',           status:'cancelled', danger:true });
    } else if (item.status === 'confirmed') {
      actions.push({ label:'🔑 Ready for Pickup', status:'ready_for_pickup' });
      actions.push({ label:'❌ Cancel',           status:'cancelled', danger:true });
    } else if (item.status === 'ready_for_pickup') {
      actions.push({ label:'🚗 Start Rental',     status:'in_progress' });
    } else if (item.status === 'in_progress') {
      actions.push({ label:'🏁 Complete',         status:'completed' });
    }
  } else {
    // test drive
    if (item.status === 'pending') {
      actions.push({ label:'✅ Confirm',    status:'confirmed' });
      actions.push({ label:'❌ Reject',     status:'cancelled', danger:true });
    } else if (item.status === 'confirmed') {
      actions.push({ label:'🏁 Mark Done', status:'completed' });
      actions.push({ label:'❌ Cancel',    status:'cancelled', danger:true });
    }
  }

  return (
    <div className="dr-card">
      <div className="dr-card-top">
        <div className="dr-card-info">
          <h3>{item.vehicleName}</h3>
          <div className="dr-customer">
            👤 {name}
            {phone && (
              <a href={`tel:${phone.replace(/[\s\-().]/g,'')}`} className="dr-phone">
                📞 {phone}
              </a>
            )}
          </div>
          {isRental ? (
            <div className="dr-dates">
              📅 {fmtDate(item.startDate)} → {fmtDate(item.endDate)}
              {item.pickupTime && ` · Pickup: ${fmtTime(item.pickupTime)}`}
              {item.days && ` · ${item.days} day${item.days !== 1 ? 's' : ''}`}
            </div>
          ) : (
            <div className="dr-dates">
              📅 {fmtDate(item.scheduledDate)} {item.scheduledTime && `at ${fmtTime(item.scheduledTime)}`}
            </div>
          )}
          {isRental && item.estimatedTotal > 0 && (
            <div className="dr-cost">
              💰 GH₵ {Number(item.estimatedTotal).toLocaleString()}
              {item.dailyRate ? ` (GH₵${Number(item.dailyRate).toLocaleString()}/day)` : ''}
            </div>
          )}
          {item.notes && <div className="dr-notes">📝 {item.notes}</div>}
        </div>
        <div className="dr-card-right">
          <span className={`dr-status ${sm.cls}`}>{sm.icon} {sm.label}</span>
          <span className="dr-ref">#{String(item.id).padStart(6,'0')}</span>
        </div>
      </div>

      <div className="dr-card-actions">
        {actions.map(a => (
          <button
            key={a.status}
            className={`dr-btn ${a.danger ? 'danger' : 'confirm'}`}
            disabled={!!actionLoading}
            onClick={() => onAction(item.id, a.status)}
          >
            {actionLoading === `${item.id}-${a.status}` ? '…' : a.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const DealerRentals = () => {
  const [tab, setTab]               = useState('rentals');
  const [rentals, setRentals]       = useState([]);
  const [testDrives, setTestDrives] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [filter, setFilter]         = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast]           = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [r, td] = await Promise.all([
        rentalAPI.getDealerRentals(),
        rentalAPI.getDealerTestDrives(),
      ]);
      setRentals(r.data?.data || []);
      setTestDrives(td.data?.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAction = async (bookingId, status) => {
    setActionLoading(`${bookingId}-${status}`);
    try {
      await rentalAPI.updateStatus(bookingId, status);
      // Refresh the relevant list
      if (tab === 'rentals') {
        setRentals(prev => prev.map(r => r.id === bookingId ? { ...r, status } : r));
      } else {
        setTestDrives(prev => prev.map(t => t.id === bookingId ? { ...t, status } : t));
      }
      const labels = {
        confirmed:'Confirmed ✅', cancelled:'Cancelled/Rejected ❌',
        ready_for_pickup:'Marked Ready for Pickup 🔑', in_progress:'Rental Started 🚗', completed:'Completed 🏁',
      };
      showToast(labels[status] || 'Status updated');
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const items = tab === 'rentals' ? rentals : testDrives;
  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);
  const count = (s) => items.filter(i => i.status === s).length;

  return (
    <div className="dr-page">
      {toast && <div className="dr-toast">{toast}</div>}

      <div className="dr-header">
        <div>
          <h1>{tab === 'rentals' ? '🚗 Rental Requests' : '🔑 Test Drive Requests'}</h1>
          <p>Manage requests for your vehicles</p>
        </div>
        <button className="dr-btn-refresh" onClick={fetchAll} disabled={loading}>
          {loading ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>

      {/* Tabs */}
      <div className="dr-tabs">
        <button
          className={`dr-tab ${tab === 'rentals' ? 'active' : ''}`}
          onClick={() => { setTab('rentals'); setFilter('all'); }}
        >
          Rentals {rentals.length > 0 && <span className="dr-tab-badge">{rentals.length}</span>}
        </button>
        <button
          className={`dr-tab ${tab === 'testdrives' ? 'active' : ''}`}
          onClick={() => { setTab('testdrives'); setFilter('all'); }}
        >
          Test Drives {testDrives.length > 0 && <span className="dr-tab-badge">{testDrives.length}</span>}
        </button>
      </div>

      {/* Summary stats */}
      <div className="dr-stats">
        {['pending','confirmed','completed','cancelled'].map(s => (
          <div key={s} className="dr-stat">
            <span className="dr-stat-n">{count(s)}</span>
            <span className="dr-stat-l">{s.charAt(0).toUpperCase()+s.slice(1)}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="dr-filters">
        {['all','pending','confirmed','in_progress','completed','cancelled'].map(s => (
          <button
            key={s}
            className={`dr-filter-btn ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'All' : s.replace('_',' ')} {s !== 'all' && count(s) > 0 && `(${count(s)})`}
          </button>
        ))}
      </div>

      {error && <div className="dr-error">{error}</div>}

      {loading ? (
        <div className="dr-loading"><div className="dr-spinner" /><p>Loading…</p></div>
      ) : filtered.length === 0 ? (
        <div className="dr-empty">
          <div style={{ fontSize:'2.5rem', marginBottom:10 }}>{tab === 'rentals' ? '🚗' : '🔑'}</div>
          <h3>No {filter !== 'all' ? filter : ''} {tab === 'rentals' ? 'rental' : 'test drive'} requests</h3>
          <p>{filter === 'all' ? 'No requests yet.' : 'Try a different filter.'}</p>
        </div>
      ) : (
        <div className="dr-list">
          {filtered.map(item => (
            <RentalCard
              key={item.id}
              item={item}
              type={tab === 'rentals' ? 'rental' : 'testdrive'}
              onAction={handleAction}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DealerRentals;
