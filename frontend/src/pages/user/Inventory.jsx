/**
 * My Vehicles — customer garage.
 * Customers can add, edit and remove their own vehicles
 * (for service booking reference and maintenance tracking).
 *
 * Tabs:
 *  1. My Vehicles    — owned/personal cars (stored via /api/user-vehicles)
 *  2. Saved Listings — marketplace vehicles the customer has browsed
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { myVehiclesAPI, savedVehiclesAPI } from '../../services/api';
import StartChatButton from '../../components/StartChatButton';
import { CURRENCY_SYMBOL } from '../../utils/currency';
import './Inventory.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 50 }, (_, i) => CURRENT_YEAR - i);

const EMPTY_FORM = {
  make: '', model: '', year: CURRENT_YEAR,
  color: '', plate: '', vin: '', mileage: '', notes: '',
};

const label = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// ─── Vehicle form modal ───────────────────────────────────────────────────────
const VehicleFormModal = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const isEdit = !!initial?.id;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.make.trim() || !form.model.trim()) {
      setErr('Make and Model are required.');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      const payload = {
        make:    form.make.trim(),
        model:   form.model.trim(),
        year:    parseInt(form.year),
        color:   form.color.trim() || undefined,
        plate:   form.plate.trim() || undefined,
        vin:     form.vin.trim()   || undefined,
        mileage: form.mileage !== '' ? parseInt(form.mileage) : undefined,
        notes:   form.notes.trim() || undefined,
      };

      let res;
      if (isEdit) {
        res = await myVehiclesAPI.update(initial.id, payload);
      } else {
        res = await myVehiclesAPI.add(payload);
      }

      if (res.data?.success) {
        onSave(res.data.data);
        onClose();
      } else {
        setErr(res.data?.message || 'Failed to save vehicle.');
      }
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to save vehicle.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="inv-modal-overlay" onClick={onClose}>
      <div className="inv-modal" onClick={e => e.stopPropagation()}>
        <div className="inv-modal-header">
          <h2>{isEdit ? 'Edit Vehicle' : 'Add My Vehicle'}</h2>
          <button className="inv-modal-close" onClick={onClose}>✕</button>
        </div>
        {err && <div className="inv-form-error">{err}</div>}
        <form className="inv-form" onSubmit={handleSubmit}>
          <div className="inv-form-row">
            <div className="inv-form-group">
              <label>Make <span style={{ color: '#e53935' }}>*</span></label>
              <input
                value={form.make}
                onChange={e => set('make', e.target.value)}
                placeholder="e.g. Toyota"
                required
              />
            </div>
            <div className="inv-form-group">
              <label>Model <span style={{ color: '#e53935' }}>*</span></label>
              <input
                value={form.model}
                onChange={e => set('model', e.target.value)}
                placeholder="e.g. Camry"
                required
              />
            </div>
          </div>

          <div className="inv-form-row">
            <div className="inv-form-group">
              <label>Year <span style={{ color: '#e53935' }}>*</span></label>
              <select value={form.year} onChange={e => set('year', e.target.value)} required>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="inv-form-group">
              <label>Color</label>
              <input
                value={form.color}
                onChange={e => set('color', e.target.value)}
                placeholder="e.g. Silver"
              />
            </div>
          </div>

          <div className="inv-form-row">
            <div className="inv-form-group">
              <label>License Plate</label>
              <input
                value={form.plate}
                onChange={e => set('plate', e.target.value)}
                placeholder="e.g. GR-1234-20"
              />
            </div>
            <div className="inv-form-group">
              <label>Mileage (km)</label>
              <input
                type="number"
                value={form.mileage}
                onChange={e => set('mileage', e.target.value)}
                placeholder="e.g. 45000"
                min="0"
              />
            </div>
          </div>

          <div className="inv-form-group full">
            <label>VIN (optional)</label>
            <input
              value={form.vin}
              onChange={e => set('vin', e.target.value)}
              placeholder="17-character Vehicle Identification Number"
              maxLength={17}
            />
          </div>

          <div className="inv-form-group full">
            <label>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              placeholder="Any useful notes about this vehicle…"
            />
          </div>

          <div className="inv-form-actions">
            <button type="button" className="inv-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="inv-btn-save" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Update Vehicle' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const UserInventory = () => {
  const navigate = useNavigate();

  const [myVehicles, setMyVehicles]         = useState([]);
  const [savedVehicles, setSavedVehicles]   = useState([]);
  const [activeTab, setActiveTab]           = useState('owned');
  const [loading, setLoading]               = useState(true);
  const [toast, setToast]                   = useState('');

  // Modal state
  const [showModal, setShowModal]           = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [myRes, savedRes] = await Promise.allSettled([
        myVehiclesAPI.getAll(),
        savedVehiclesAPI.getAll(),
      ]);

      if (myRes.status === 'fulfilled' && myRes.value.data?.success) {
        setMyVehicles(myRes.value.data.data || []);
      }
      if (savedRes.status === 'fulfilled' && savedRes.value.data?.success) {
        setSavedVehicles(savedRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Inventory fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd  = ()    => { setEditingVehicle(null);    setShowModal(true); };
  const openEdit = (v)   => { setEditingVehicle(v);       setShowModal(true); };
  const closeModal = ()  => { setShowModal(false); setEditingVehicle(null); };

  const handleSave = (saved) => {
    setMyVehicles(prev => {
      const idx = prev.findIndex(v => v.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        showToast('Vehicle updated');
        return next;
      }
      showToast('Vehicle added');
      return [...prev, saved];
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this vehicle from your garage?')) return;
    try {
      await myVehiclesAPI.remove(id);
      setMyVehicles(prev => prev.filter(v => v.id !== id));
      showToast('Vehicle removed');
    } catch {
      alert('Failed to remove vehicle');
    }
  };

  if (loading) return (
    <div className="inventory-page">
      <div className="inventory-container">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading your vehicles…</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="inventory-page">
      {toast && <div className="inv-toast">{toast}</div>}

      <div className="inventory-container">
        {/* Header */}
        <div className="inventory-header">
          <div className="header-info">
            <h1>My Vehicles</h1>
            <p>Manage your vehicles and saved marketplace listings</p>
          </div>
          <div className="header-actions">
            <button className="btn secondary" onClick={() => navigate('/vehicles')}>
              Browse Vehicles
            </button>
            {activeTab === 'owned' && (
              <button className="btn primary" onClick={openAdd}>
                + Add Vehicle
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="inventory-tabs">
          <button
            className={`tab-btn ${activeTab === 'owned' ? 'active' : ''}`}
            onClick={() => setActiveTab('owned')}
          >
            My Vehicles ({myVehicles.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            Saved Listings ({savedVehicles.length})
          </button>
        </div>

        <div className="inventory-content">

          {/* ── MY VEHICLES tab ── */}
          {activeTab === 'owned' && (
            <div className="owned-vehicles">
              {myVehicles.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🚗</div>
                  <h3>No vehicles yet</h3>
                  <p>Add your car to track services and quickly reference it when booking.</p>
                  <button className="btn primary" onClick={openAdd}>
                    Add Your First Vehicle
                  </button>
                </div>
              ) : (
                <div className="vehicles-grid">
                  {myVehicles.map(v => (
                    <div key={v.id} className="vehicle-card owned">
                      {/* Card header */}
                      <div className="vcard-header">
                        <div className="vcard-icon">🚗</div>
                        <div className="vcard-title">
                          <h3>{v.year} {v.make} {v.model}</h3>
                          {v.color && <span className="vcard-color">{v.color}</span>}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="vehicle-details">
                        {v.plate && (
                          <div className="detail-item">
                            <span className="detail-label">Plate</span>
                            <span className="detail-value">{v.plate}</span>
                          </div>
                        )}
                        {v.mileage != null && (
                          <div className="detail-item">
                            <span className="detail-label">Mileage</span>
                            <span className="detail-value">{Number(v.mileage).toLocaleString()} km</span>
                          </div>
                        )}
                        {v.vin && (
                          <div className="detail-item">
                            <span className="detail-label">VIN</span>
                            <span className="detail-value" style={{ fontFamily: 'monospace', fontSize: '.8rem' }}>{v.vin}</span>
                          </div>
                        )}
                        {v.notes && (
                          <div className="detail-item">
                            <span className="detail-label">Notes</span>
                            <span className="detail-value">{v.notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="vehicle-actions">
                        <button
                          className="btn primary small"
                          onClick={() => navigate('/book-service')}
                        >
                          Book Service
                        </button>
                        <button
                          className="btn secondary small"
                          onClick={() => openEdit(v)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn danger small"
                          onClick={() => handleDelete(v.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SAVED LISTINGS tab ── */}
          {activeTab === 'saved' && (
            <div className="saved-vehicles">
              {savedVehicles.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">❤️</div>
                  <h3>No saved vehicles</h3>
                  <p>Browse the marketplace and save vehicles you're interested in.</p>
                  <button className="btn primary" onClick={() => navigate('/vehicles')}>
                    Browse Vehicles
                  </button>
                </div>
              ) : (
                <div className="vehicles-grid">
                  {savedVehicles.map(vehicle => (
                    <div key={vehicle.id} className="vehicle-card saved">
                      <div className="vehicle-image">
                        <img
                          src={vehicle.images?.[0] || '/placeholder-car.jpg'}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          onError={e => { e.target.src = '/placeholder-car.jpg'; }}
                        />
                        <div className="vcard-availability-badge">
                          {vehicle.availabilityType === 'rent' ? '🔑 Rent'
                            : vehicle.availabilityType === 'both' ? '🚗 Sale & Rent'
                            : '🚗 For Sale'}
                        </div>
                      </div>
                      <div className="vehicle-info">
                        <h3>{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                        <div className="vehicle-price">
                          {CURRENCY_SYMBOL} {Number(vehicle.price).toLocaleString()}
                        </div>
                        <div className="vehicle-details">
                          {vehicle.mileage && (
                            <div className="detail-item">
                              <span className="detail-label">Mileage</span>
                              <span className="detail-value">{Number(vehicle.mileage).toLocaleString()} km</span>
                            </div>
                          )}
                          {vehicle.condition && (
                            <div className="detail-item">
                              <span className="detail-label">Condition</span>
                              <span className="detail-value">{label(vehicle.condition)}</span>
                            </div>
                          )}
                          {vehicle.fuelType && (
                            <div className="detail-item">
                              <span className="detail-label">Fuel</span>
                              <span className="detail-value">{label(vehicle.fuelType)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="vehicle-actions">
                        <button
                          className="btn secondary small"
                          onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                        >
                          View Details
                        </button>
                        <button
                          className="btn primary small"
                          onClick={() => navigate('/book-service')}
                        >
                          Book Service
                        </button>
                        {vehicle.dealerId && (
                          <StartChatButton
                            userId={vehicle.dealerId}
                            userName={vehicle.dealer
                              ? `${vehicle.dealer.firstName} ${vehicle.dealer.lastName}`
                              : 'Dealer'}
                            userRole="dealer"
                            userPhone={vehicle.dealer?.phone || ''}
                            label="Message"
                            variant="ghost"
                            size="sm"
                            reference={{
                              type: vehicle.availabilityType === 'rent' ? 'rental' : 'vehicle',
                              id: vehicle.id,
                              title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                              subtitle: vehicle.price
                                ? `${CURRENCY_SYMBOL} ${Number(vehicle.price).toLocaleString()} · ${label(vehicle.condition || 'used')}`
                                : undefined,
                              image: vehicle.images?.[0],
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit modal */}
      {showModal && (
        <VehicleFormModal
          initial={editingVehicle}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default UserInventory;
