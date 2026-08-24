/**
 * ManageListings — Buyer-facing listing management for dealers.
 *
 * Unlike Inventory (internal stock table), this page shows how each vehicle
 * looks to potential buyers and lets the dealer control:
 *  - Status (Available / Pending / Sold / Reserved) — shown to buyers
 *  - Featured / Promoted flag
 *  - Quick price edit
 *  - Availability type (sale | rent | both)
 */
import { useState, useEffect, useCallback } from 'react';
import { vehicleAPI } from '../../services/api';
import { CURRENCY_SYMBOL } from '../../utils/currency';
import './ManageListings.css';

const AVAILABILITY_OPTIONS = [
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' },
  { value: 'both', label: 'Sale & Rent' },
];

// Use real dealer-facing status labels (same as Inventory)
const VISIBILITY_OPTIONS = [
  { value: 'available', label: 'Available', color: '#22c55e', dot: '🟢' },
  { value: 'pending',   label: 'Pending',   color: '#f59e0b', dot: '🟡' },
  { value: 'reserved',  label: 'Reserved',  color: '#3b82f6', dot: '🔵' },
  { value: 'sold',      label: 'Sold',      color: '#9ca3af', dot: '⚪' },
];

const label = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const visibilityMeta = (status) =>
  VISIBILITY_OPTIONS.find((v) => v.value === status) ||
  { label: label(status), color: '#9ca3af', dot: '⚪' };

// ─── Listing card ─────────────────────────────────────────────────────────────
const ListingCard = ({ vehicle, onUpdate, onDelete }) => {
  const [editingPrice, setEditingPrice] = useState(false);
  const [price, setPrice]               = useState(vehicle.price);
  const [saving, setSaving]             = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const meta = visibilityMeta(vehicle.status);
  const thumb = vehicle.images?.[0] || null;

  const savePrice = async () => {
    if (!price || isNaN(price)) return;
    setSaving(true);
    try {
      await vehicleAPI.update(vehicle.id, { price: parseFloat(price) });
      onUpdate({ ...vehicle, price: parseFloat(price) });
      setEditingPrice(false);
    } catch {
      alert('Failed to update price');
    } finally {
      setSaving(false);
    }
  };

  const toggleFeatured = async () => {
    const newFeatured = !vehicle.isFeatured;
    try {
      await vehicleAPI.update(vehicle.id, { featured: newFeatured });
      onUpdate({ ...vehicle, isFeatured: newFeatured });
    } catch {
      alert('Failed to update featured status');
    }
  };

  const changeVisibility = async (newStatus) => {
    if (vehicle.status === newStatus || statusSaving) return;
    setStatusSaving(true);
    try {
      await vehicleAPI.update(vehicle.id, { status: newStatus });
      onUpdate({ ...vehicle, status: newStatus });
    } catch {
      alert('Failed to update status');
    } finally {
      setStatusSaving(false);
    }
  };

  const changeAvailability = async (newType) => {
    try {
      await vehicleAPI.update(vehicle.id, { availabilityType: newType });
      onUpdate({ ...vehicle, availabilityType: newType });
    } catch {
      alert('Failed to update availability');
    }
  };

  return (
    <div className={`ml-card ${vehicle.status === 'sold' ? 'mgl-card--archived' : ''}`}>
      {/* Thumbnail */}
      <div className="mgl-card-thumb">
        {thumb
          ? <img src={thumb} alt={`${vehicle.make} ${vehicle.model}`} />
          : <div className="mgl-card-no-photo">🚗<span>No photo</span></div>
        }
        {vehicle.isFeatured && (
          <div className="mgl-card-featured-badge">⭐ Featured</div>
        )}
        <div className="mgl-card-status-dot" style={{ background: meta.color }} title={meta.label} />
      </div>

      {/* Info */}
      <div className="mgl-card-body">
        <div className="mgl-card-title">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </div>
        {vehicle.vin && (
          <div className="mgl-card-vin">VIN: {vehicle.vin}</div>
        )}

        {/* Price */}
        <div className="mgl-card-price-row">
          {editingPrice ? (
            <>
              <span className="mgl-currency">{CURRENCY_SYMBOL}</span>
              <input
                className="mgl-price-input"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && savePrice()}
                autoFocus
                min="0"
              />
              <button className="mgl-btn-save-price" onClick={savePrice} disabled={saving}>
                {saving ? '…' : '✓'}
              </button>
              <button className="mgl-btn-cancel-price" onClick={() => { setEditingPrice(false); setPrice(vehicle.price); }}>
                ✕
              </button>
            </>
          ) : (
            <>
              <span className="mgl-card-price">{CURRENCY_SYMBOL} {Number(price).toLocaleString()}</span>
              <button className="mgl-btn-edit-price" onClick={() => setEditingPrice(true)} title="Edit price">
                ✏️
              </button>
            </>
          )}
        </div>

        {/* Tags row */}
        <div className="mgl-card-tags">
          <span className="mgl-tag ml-tag--condition">{label(vehicle.condition || 'used')}</span>
          <span className="mgl-tag ml-tag--fuel">{label(vehicle.fuelType || '')}</span>
          {vehicle.mileage > 0 && (
            <span className="mgl-tag">{Number(vehicle.mileage).toLocaleString()} km</span>
          )}
        </div>

        {/* ── Quick status pills ─────────────────────────────────────── */}
        <div className="mgl-status-pills">
          <span className="mgl-status-pills-label">Status:</span>
          {VISIBILITY_OPTIONS.map((v) => (
            <button
              key={v.value}
              className={`ml-status-pill ${vehicle.status === v.value ? 'active' : ''}`}
              style={vehicle.status === v.value ? { background: v.color, borderColor: v.color } : {}}
              onClick={() => changeVisibility(v.value)}
              disabled={statusSaving}
              title={`Mark as ${v.label}`}
            >
              {v.dot} {v.label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="mgl-card-controls">
          {/* Availability */}
          <div className="mgl-control-group">
            <label className="mgl-control-label">Listed for</label>
            <select
              className="mgl-select"
              value={vehicle.availabilityType || 'sale'}
              onChange={(e) => changeAvailability(e.target.value)}
            >
              {AVAILABILITY_OPTIONS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          {/* Edit link to Inventory */}
          <div className="mgl-control-group">
            <label className="mgl-control-label">Edit Details</label>
            <a href="/dealer/inventory" className="mgl-edit-in-inventory" title="Edit full vehicle details in Inventory">
              📦 Open Inventory
            </a>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mgl-card-actions">
          <button
            className={`ml-btn-featured ${vehicle.isFeatured ? 'active' : ''}`}
            onClick={toggleFeatured}
            title={vehicle.isFeatured ? 'Remove from featured' : 'Mark as featured'}
          >
            {vehicle.isFeatured ? '⭐ Featured' : '☆ Feature'}
          </button>
          <button
            className="mgl-btn-delete"
            onClick={() => {
              if (window.confirm('Remove this listing? This cannot be undone.')) onDelete(vehicle.id);
            }}
          >
            🗑 Remove
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const ManageListings = () => {
  const [vehicles, setVehicles]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [visFilter, setVisFilter] = useState('all');
  const [toast, setToast]         = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await vehicleAPI.getMyVehicles();
      const list = res.data?.data;
      setVehicles(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const handleUpdate = useCallback((updated) => {
    setVehicles((prev) => prev.map((v) => v.id === updated.id ? updated : v));
    showToast('Listing updated');
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await vehicleAPI.delete(id);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      showToast('Listing removed');
    } catch {
      alert('Failed to remove listing');
    }
  }, []);

  const filtered = vehicles.filter((v) => {
    const matchVis = visFilter === 'all' || v.status === visFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || `${v.make} ${v.model} ${v.year}`.toLowerCase().includes(q);
    return matchVis && matchSearch;
  });

  // Summary counts
  const counts = VISIBILITY_OPTIONS.reduce((acc, v) => {
    acc[v.value] = vehicles.filter((veh) => veh.status === v.value).length;
    return acc;
  }, {});

  return (
    <div className="mgl-page">
      {toast && <div className="mgl-toast">{toast}</div>}

      {/* Header */}
      <div className="mgl-header">
        <div>
          <h1>Manage Listings</h1>
          <p>Control how your vehicles appear to buyers and renters</p>
        </div>
        <a href="/dealer/inventory" className="mgl-btn-go-inventory">
          📦 Go to Inventory
        </a>
      </div>

      {/* Info banner — distinguish from Inventory */}
      <div className="mgl-info-banner">
        <span className="mgl-info-icon">ℹ️</span>
        <div>
          <strong>Manage Listings</strong> controls buyer-facing visibility, status, pricing, and featured flags.
          To edit vehicle specs, photos, or VIN — use{' '}
          <a href="/dealer/inventory">Inventory</a>.
        </div>
      </div>

      {/* Summary strip */}
      <div className="mgl-summary">
        {VISIBILITY_OPTIONS.map((v) => (
          <div key={v.value} className="mgl-summary-card" style={{ borderTop: `3px solid ${v.color}` }}>
            <span className="mgl-summary-n" style={{ color: v.color }}>{counts[v.value] || 0}</span>
            <span className="mgl-summary-l">{v.label}</span>
          </div>
        ))}
        <div className="mgl-summary-card" style={{ borderTop: '3px solid #1976d2' }}>
          <span className="mgl-summary-n" style={{ color: '#1976d2' }}>
            {vehicles.filter((v) => v.isFeatured).length}
          </span>
          <span className="mgl-summary-l">Featured</span>
        </div>
      </div>

      {/* Filters */}
      <div className="mgl-filters">
        <input
          className="mgl-search"
          type="text"
          placeholder="Search make, model…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="mgl-filter-btns">
          <button
            className={`ml-filter-btn ${visFilter === 'all' ? 'active' : ''}`}
            onClick={() => setVisFilter('all')}
          >
            All ({vehicles.length})
          </button>
          {VISIBILITY_OPTIONS.map((v) => (
            <button
              key={v.value}
              className={`ml-filter-btn ${visFilter === v.value ? 'active' : ''}`}
              onClick={() => setVisFilter(v.value)}
              style={visFilter === v.value ? { background: v.color, borderColor: v.color, color: '#fff' } : {}}
            >
              {v.dot} {v.label} ({counts[v.value] || 0})
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mgl-error">
          {error} <button onClick={fetchVehicles}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="mgl-loading">
          <div className="mgl-spinner" />
          <p>Loading listings…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mgl-empty">
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📋</div>
          <h3>No listings found</h3>
          <p>
            {search || visFilter !== 'all'
              ? 'Try a different filter or search term.'
              : 'Add vehicles in the Inventory page and they will appear here.'}
          </p>
          <a href="/dealer/inventory" className="mgl-btn-go-inventory" style={{ display: 'inline-block', marginTop: '12px' }}>
            Go to Inventory
          </a>
        </div>
      ) : (
        <div className="mgl-grid">
          {filtered.map((v) => (
            <ListingCard
              key={v.id}
              vehicle={v}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageListings;
