import { useState, useEffect, useCallback } from 'react';
import { serviceAPI } from '../../services/api';
import './Services.css';

const EMPTY_FORM = {
  name: '', description: '', category: 'car_wash',
  price: '', duration: '', isActive: true,
};

const CATEGORIES = [
  { value: 'car_wash', label: 'Car Wash', icon: '🚿' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { value: 'repair', label: 'Repair', icon: '🛠️' },
  { value: 'other', label: 'Other', icon: '⚙️' },
];

const catLabel = (val) => CATEGORIES.find((c) => c.value === val)?.label || val;
const catIcon = (val) => CATEGORIES.find((c) => c.value === val)?.icon || '⚙️';

const ServiceProviderServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await serviceAPI.getMyServices();
      setServices(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
      };
      if (editingService) {
        const res = await serviceAPI.update(editingService.id, payload);
        const updated = res.data?.data;
        setServices((prev) => prev.map((s) => (s.id === editingService.id ? updated : s)));
        showToast('Service updated');
      } else {
        const res = await serviceAPI.create(payload);
        const created = res.data?.data;
        setServices((prev) => [created, ...prev]);
        showToast('Service added');
      }
      closeModal();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      category: service.category,
      price: String(service.price),
      duration: String(service.duration),
      isActive: service.isActive,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service? This cannot be undone.')) return;
    try {
      await serviceAPI.delete(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
      showToast('Service deleted');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete service');
    }
  };

  const toggleActive = async (service) => {
    try {
      const res = await serviceAPI.update(service.id, { isActive: !service.isActive });
      const updated = res.data?.data;
      setServices((prev) => prev.map((s) => (s.id === service.id ? updated : s)));
      showToast(updated.isActive ? 'Service activated' : 'Service deactivated');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update service');
    }
  };

  const openAdd = () => {
    setEditingService(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingService(null);
    setFormData(EMPTY_FORM);
    setFormError('');
  };

  const filtered = selectedCategory === 'all'
    ? services
    : services.filter((s) => s.category === selectedCategory);

  return (
    <div className="services-container">
      {toast && <div className="svc-toast">{toast}</div>}

      <div className="services-header">
        <div>
          <h1>Service Management</h1>
          <p>{services.length} service{services.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button className="add-service-btn" onClick={openAdd}>➕ Add New Service</button>
      </div>

      {error && (
        <div className="svc-error">
          {error}
          <button onClick={fetchServices}>Retry</button>
        </div>
      )}

      <div className="category-filter">
        <button
          className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          All Services ({services.length})
        </button>
        {CATEGORIES.map(({ value, label, icon }) => {
          const count = services.filter((s) => s.category === value).length;
          if (count === 0) return null;
          return (
            <button
              key={value}
              className={`filter-btn ${selectedCategory === value ? 'active' : ''}`}
              onClick={() => setSelectedCategory(value)}
            >
              {icon} {label} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="svc-loading">Loading services...</div>
      ) : (
        <div className="services-grid">
          {filtered.map((service) => (
            <div key={service.id} className="service-card">
              <div className="service-card-header">
                <span className="service-category-icon">{catIcon(service.category)}</span>
                <span className={`service-status ${service.isActive ? 'active' : 'inactive'}`}>
                  {service.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3>{service.name}</h3>
              <p className="service-description">{service.description}</p>
              <div className="service-details">
                <div className="service-detail-item">
                  <span className="detail-label">Category</span>
                  <span className="detail-value">{catLabel(service.category)}</span>
                </div>
                <div className="service-detail-item">
                  <span className="detail-label">Price</span>
                  <span className="detail-value price">GH₵ {Number(service.price).toFixed(2)}</span>
                </div>
                <div className="service-detail-item">
                  <span className="detail-label">Duration</span>
                  <span className="detail-value">{service.duration} min</span>
                </div>
                <div className="service-detail-item">
                  <span className="detail-label">Bookings</span>
                  <span className="detail-value">{service.bookingCount || 0}</span>
                </div>
              </div>
              <div className="service-actions">
                <button className="edit-btn" onClick={() => handleEdit(service)}>✏️ Edit</button>
                <button
                  className={`toggle-btn ${service.isActive ? 'deactivate' : 'activate'}`}
                  onClick={() => toggleActive(service)}
                >
                  {service.isActive ? '⏸ Deactivate' : '▶ Activate'}
                </button>
                <button className="delete-btn" onClick={() => handleDelete(service.id)}>🗑️</button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="no-services">
              <p>No services found{selectedCategory !== 'all' ? ' in this category' : ''}</p>
              <button className="add-first-btn" onClick={openAdd}>Add Your First Service</button>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingService ? 'Edit Service' : 'Add New Service'}</h2>
              <button className="close-btn" onClick={closeModal}>✕</button>
            </div>
            {formError && <div className="svc-form-error">{formError}</div>}
            <form onSubmit={handleSubmit} className="service-form">
              <div className="form-group">
                <label>Service Name *</label>
                <input
                  type="text" name="name" value={formData.name}
                  onChange={handleInputChange} required placeholder="e.g., Premium Car Wash"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description" value={formData.description}
                  onChange={handleInputChange} rows="3" placeholder="Describe what's included"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} required>
                    {CATEGORIES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Price (GH₵) *</label>
                  <input
                    type="number" name="price" value={formData.price}
                    onChange={handleInputChange} required min="0" step="0.01" placeholder="0.00"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Duration (minutes) *</label>
                <input
                  type="number" name="duration" value={formData.duration}
                  onChange={handleInputChange} required min="15" step="15" placeholder="30"
                />
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox" name="isActive"
                    checked={formData.isActive} onChange={handleInputChange}
                  />
                  <span>Service is active and available for booking</span>
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="submit-btn" disabled={saving}>
                  {saving ? 'Saving...' : editingService ? 'Update Service' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceProviderServices;
