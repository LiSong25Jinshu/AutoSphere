import { useState, useEffect, useCallback } from 'react';
import { vehicleAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Inventory.css';

const EMPTY_FORM = {
  make: '', model: '', year: new Date().getFullYear(), price: '',
  mileage: '', condition: 'used', fuelType: 'gasoline',
  transmission: 'automatic', bodyType: 'sedan', color: '',
  vin: '', description: '', status: 'available',
};
const CONDITIONS = ['new', 'used', 'certified_pre_owned'];
const FUEL_TYPES = ['gasoline', 'diesel', 'hybrid', 'electric', 'plug_in_hybrid'];
const TRANSMISSIONS = ['automatic', 'manual', 'cvt'];
const BODY_TYPES = ['sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'truck', 'van', 'wagon'];
const STATUSES = ['available', 'sold', 'pending', 'reserved'];

const STATUS_COLORS = {
  available: '#4caf50', sold: '#9e9e9e', pending: '#ff9800', reserved: '#2196f3',
};

const label = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const DealerInventory = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [photoFiles, setPhotoFiles] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await vehicleAPI.getMyVehicles();
      // Response shape: { success, data: [...], pagination: {...} }
      const list = res.data?.data;
      setVehicles(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const filtered = vehicles.filter((v) => {
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      `${v.make} ${v.model} ${v.year}`.toLowerCase().includes(q) ||
      (v.vin || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (v) => {
    setEditing(v);
    setForm({
      make: v.make || '', model: v.model || '', year: v.year || new Date().getFullYear(),
      price: v.price || '', mileage: v.mileage || '', condition: v.condition || 'used',
      fuelType: v.fuelType || 'gasoline', transmission: v.transmission || 'automatic',
      bodyType: v.bodyType || 'sedan', color: v.color || '', vin: v.vin || '',
      description: v.description || '', status: v.status || 'available',
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); setPhotoFiles([]); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...form,
        year: parseInt(form.year),
        price: parseFloat(form.price),
        mileage: form.mileage ? parseInt(form.mileage) : undefined,
      };
      let savedVehicle;
      if (editing) {
        const res = await vehicleAPI.update(editing.id, payload);
        savedVehicle = res.data?.data;
        setVehicles((prev) => prev.map((v) => (v.id === editing.id ? savedVehicle : v)));
        showToast('Vehicle updated successfully');
      } else {
        const res = await vehicleAPI.create(payload);
        savedVehicle = res.data?.data;
        setVehicles((prev) => [savedVehicle, ...prev]);
        showToast('Vehicle added successfully');
      }

      // Upload photos if any were selected
      if (photoFiles.length > 0 && savedVehicle?.id) {
        setUploadingPhotos(true);
        try {
          const photoRes = await vehicleAPI.uploadPhotos(savedVehicle.id, photoFiles);
          const updatedImages = photoRes.data?.data?.images;
          if (updatedImages) {
            setVehicles((prev) =>
              prev.map((v) => (v.id === savedVehicle.id ? { ...v, images: updatedImages } : v))
            );
          }
        } catch (photoErr) {
          console.error('Photo upload failed:', photoErr);
        } finally {
          setUploadingPhotos(false);
        }
      }

      closeModal();
    } catch (e) {
      setFormError(e.response?.data?.message || 'Failed to save vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePhoto = async (vehicleId, url) => {
    try {
      await vehicleAPI.deletePhoto(vehicleId, url);
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === vehicleId ? { ...v, images: (v.images || []).filter((img) => img !== url) } : v
        )
      );
    } catch (e) {
      alert('Failed to delete photo');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle? This cannot be undone.')) return;
    try {
      await vehicleAPI.delete(id);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      showToast('Vehicle deleted');
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete vehicle');
    }
  };

  return (
    <div className="inv-page">
      {toast && <div className="inv-toast">{toast}</div>}
      <div className="inv-header">
        <div>
          <h1>Inventory</h1>
          <p>{vehicles.length} vehicles total</p>
        </div>
        <button className="inv-add-btn" onClick={openAdd}>+ Add Vehicle</button>
      </div>

      <div className="inv-controls">
        <input
          className="inv-search" type="text" placeholder="Search make, model, VIN..."
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
        <div className="inv-filters">
          {['all', ...STATUSES].map((s) => (
            <button
              key={s}
              className={'inv-filter' + (statusFilter === s ? ' active' : '')}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : label(s)}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="inv-loading">Loading inventory...</div>}
      {error && <div className="inv-error">{error} <button onClick={fetchVehicles}>Retry</button></div>}

      {!loading && !error && (
        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th>Vehicle</th><th>Year</th><th>Price</th><th>Mileage</th>
                <th>Condition</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id}>
                  <td className="inv-vehicle-cell">
                    <div className="inv-vehicle-name">{v.make} {v.model}</div>
                    {v.vin && <div className="inv-vin">VIN: {v.vin}</div>}
                  </td>
                  <td>{v.year}</td>
                  <td className="inv-price">GH₵ {Number(v.price).toLocaleString()}</td>
                  <td>{v.mileage ? `${Number(v.mileage).toLocaleString()} mi` : '—'}</td>
                  <td>{label(v.condition || '')}</td>
                  <td>
                    <span className="inv-status" style={{ background: STATUS_COLORS[v.status] || '#999' }}>
                      {label(v.status || '')}
                    </span>
                  </td>
                  <td className="inv-actions">
                    <button className="inv-btn-edit" onClick={() => openEdit(v)}>Edit</button>
                    <button className="inv-btn-del" onClick={() => handleDelete(v.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="inv-empty">No vehicles found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="inv-modal-overlay" onClick={closeModal}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h2>{editing ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
              <button className="inv-modal-close" onClick={closeModal}>✕</button>
            </div>
            {formError && <div className="inv-form-error">{formError}</div>}
            <form className="inv-form" onSubmit={handleSubmit}>
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Make *</label>
                  <input name="make" value={form.make} onChange={handleChange} required placeholder="e.g. Toyota" />
                </div>
                <div className="inv-form-group">
                  <label>Model *</label>
                  <input name="model" value={form.model} onChange={handleChange} required placeholder="e.g. Camry" />
                </div>
              </div>
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Year *</label>
                  <input name="year" type="number" value={form.year} onChange={handleChange} required min="1900" max={new Date().getFullYear() + 2} />
                </div>
                <div className="inv-form-group">
                  <label>Price (GH₵) *</label>
                  <input name="price" type="number" value={form.price} onChange={handleChange} required min="0" step="0.01" />
                </div>
              </div>
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Mileage</label>
                  <input name="mileage" type="number" value={form.mileage} onChange={handleChange} min="0" />
                </div>
                <div className="inv-form-group">
                  <label>Color</label>
                  <input name="color" value={form.color} onChange={handleChange} placeholder="e.g. Silver" />
                </div>
              </div>
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Condition *</label>
                  <select name="condition" value={form.condition} onChange={handleChange} required>
                    {CONDITIONS.map((c) => <option key={c} value={c}>{label(c)}</option>)}
                  </select>
                </div>
                <div className="inv-form-group">
                  <label>Fuel Type *</label>
                  <select name="fuelType" value={form.fuelType} onChange={handleChange} required>
                    {FUEL_TYPES.map((f) => <option key={f} value={f}>{label(f)}</option>)}
                  </select>
                </div>
              </div>
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Transmission *</label>
                  <select name="transmission" value={form.transmission} onChange={handleChange} required>
                    {TRANSMISSIONS.map((t) => <option key={t} value={t}>{label(t)}</option>)}
                  </select>
                </div>
                <div className="inv-form-group">
                  <label>Body Type *</label>
                  <select name="bodyType" value={form.bodyType} onChange={handleChange} required>
                    {BODY_TYPES.map((b) => <option key={b} value={b}>{label(b)}</option>)}
                  </select>
                </div>
              </div>
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>VIN (17 chars)</label>
                  <input name="vin" value={form.vin} onChange={handleChange} maxLength={17} placeholder="Vehicle Identification Number" />
                </div>
                <div className="inv-form-group">
                  <label>Status</label>
                  <select name="status" value={form.status} onChange={handleChange}>
                    {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                  </select>
                </div>
              </div>
              <div className="inv-form-group full">
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Vehicle description..." />
              </div>
              <div className="inv-form-group full">
                <label>Photos {editing && editing.images?.length > 0 ? `(${editing.images.length} existing)` : ''}</label>
                {editing && editing.images?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    {editing.images.map((url) => (
                      <div key={url} style={{ position: 'relative' }}>
                        <img src={url} alt="vehicle" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4 }} />
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(editing.id, url)}
                          style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: 10, lineHeight: '18px', padding: 0 }}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  type="file" accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) => setPhotoFiles(Array.from(e.target.files))}
                />
                {photoFiles.length > 0 && (
                  <small style={{ color: '#666' }}>{photoFiles.length} photo(s) selected — will upload on save</small>
                )}
                {uploadingPhotos && <small style={{ color: '#1976d2' }}>Uploading photos...</small>}
              </div>
              <div className="inv-form-actions">
                <button type="button" className="inv-btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="inv-btn-save" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update Vehicle' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealerInventory;
