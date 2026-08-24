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
    <div className={`ml-card ${vehicle.status === 'sold' ? 'ml-card--archived' : ''}`}>
      {/* Thumbnail */}
      <div className="ml-card-thumb">
        {thumb
          ? <img src={thumb} alt={`${vehicle.make} ${vehicle.model}`} />
          : <div className="ml-card-no-photo">🚗<span>No photo</span></div>
        }
        {vehicle.isFeatured && (
          <div className="ml-card-featured-badge">⭐ Featured</div>
        )}
        <div className="ml-card-status-dot" style={{ background: meta.color }} title={meta.label} />
      </div>

      {/* Info */}
      <div className="ml-card-body">
        <div className="ml-card-title">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </div>
        {vehicle.vin && (
          <div className="ml-card-vin">VIN: {vehicle.vin}</div>
        )}

        {/* Price */}
        <div className="ml-card-price-row">
          {editingPrice ? (
            <>
              <span className="ml-currency">{CURRENCY_SYMBOL}</span>
              <input
                className="ml-price-input"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && savePrice()}
                autoFocus
                min="0"
              />
              <button className="ml-btn-save-price" onClick={savePrice} disabled={saving}>
                {saving ? '…' : '✓'}
              </button>
              <button className="ml-btn-cancel-price" onClick={() => { setEditingPrice(false); setPrice(vehicle.price); }}>
                ✕
              </button>
            </>
          ) : (
            <>
              <span className="ml-card-price">{CURRENCY_SYMBOL} {Number(price).toLocaleString()}</span>
              <button className="ml-btn-edit-price" onClick={() => setEditingPrice(true)} title="Edit price">
                ✏️
              </button>
            </>
          )}
        </div>

        {/* Tags row */}
        <div className="ml-card-tags">
          <span className="ml-tag ml-tag--condition">{label(vehicle.condition || 'used')}</span>
          <span className="ml-tag ml-tag--fuel">{label(vehicle.fuelType || '')}</span>
          {vehicle.mileage > 0 && (
            <span className="ml-tag">{Number(vehicle.mileage).toLocaleString()} km</span>
          )}
        </div>

        {/* ── Quick status pills ─────────────────────────────────────── */}
        <div className="ml-status-pills">
          <span className="ml-status-pills-label">Status:</span>
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
        <div className="ml-card-controls">
          {/* Availability */}
          <div className="ml-control-group">
            <label className="ml-control-label">Listed for</label>
            <select
              className="ml-select"
              value={vehicle.availabilityType || 'sale'}
              onChange={(e) => changeAvailability(e.target.value)}
            >
              {AVAILABILITY_OPTIONS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          {/* Edit link to Inventory */}
          <div className="ml-control-group">
            <label className="ml-control-label">Edit Details</label>
            <a href="/dealer/inventory" className="ml-edit-in-inventory" title="Edit full vehicle details in Inventory">
              📦 Open Inventory
            </a>
          </div>
        </div>

        {/* Action buttons */}
        <div className="ml-card-actions">
          <button
            className={`ml-btn-featured ${vehicle.isFeatured ? 'active' : ''}`}
            onClick={toggleFeatured}
            title={vehicle.isFeatured ? 'Remove from featured' : 'Mark as featured'}
          >
            {vehicle.isFeatured ? '⭐ Featured' : '☆ Feature'}
          </button>
          <button
            className="ml-btn-delete"
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
    <div className="ml-page">
      {toast && <div className="ml-toast">{toast}</div>}

      {/* Header */}
      <div className="ml-header">
        <div>
          <h1>Manage Listings</h1>
          <p>Control how your vehicles appear to buyers and renters</p>
        </div>
        <a href="/dealer/inventory" className="ml-btn-go-inventory">
          📦 Go to Inventory
        </a>
      </div>

      {/* Info banner — distinguish from Inventory */}
      <div className="ml-info-banner">
        <span className="ml-info-icon">ℹ️</span>
        <div>
          <strong>Manage Listings</strong> controls buyer-facing visibility, status, pricing, and featured flags.
          To edit vehicle specs, photos, or VIN — use{' '}
          <a href="/dealer/inventory">Inventory</a>.
        </div>
      </div>

      {/* Summary strip */}
      <div className="ml-summary">
        {VISIBILITY_OPTIONS.map((v) => (
          <div key={v.value} className="ml-summary-card" style={{ borderTop: `3px solid ${v.color}` }}>
            <span className="ml-summary-n" style={{ color: v.color }}>{counts[v.value] || 0}</span>
            <span className="ml-summary-l">{v.label}</span>
          </div>
        ))}
        <div className="ml-summary-card" style={{ borderTop: '3px solid #1976d2' }}>
          <span className="ml-summary-n" style={{ color: '#1976d2' }}>
            {vehicles.filter((v) => v.isFeatured).length}
          </span>
          <span className="ml-summary-l">Featured</span>
        </div>
      </div>

      {/* Filters */}
      <div className="ml-filters">
        <input
          className="ml-search"
          type="text"
          placeholder="Search make, model…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="ml-filter-btns">
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
        <div className="ml-error">
          {error} <button onClick={fetchVehicles}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="ml-loading">
          <div className="ml-spinner" />
          <p>Loading listings…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="ml-empty">
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📋</div>
          <h3>No listings found</h3>
          <p>
            {search || visFilter !== 'all'
              ? 'Try a different filter or search term.'
              : 'Add vehicles in the Inventory page and they will appear here.'}
          </p>
          <a href="/dealer/inventory" className="ml-btn-go-inventory" style={{ display: 'inline-block', marginTop: '12px' }}>
            Go to Inventory
          </a>
        </div>
      ) : (
        <div className="ml-grid">
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
