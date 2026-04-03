import { useState, useEffect } from 'react';
import './Services.css';

const STORAGE_KEY = 'sp_services';

const DEFAULT_SERVICES = [
  { id: 1, name: 'Basic Car Wash', description: 'Exterior wash and dry', category: 'car_wash', price: 25, duration: 30, bookingCount: 45, isActive: true },
  { id: 2, name: 'Premium Car Wash', description: 'Exterior wash, interior vacuum, tire shine', category: 'car_wash', price: 35, duration: 45, bookingCount: 32, isActive: true },
  { id: 3, name: 'Full Detail', description: 'Complete interior and exterior detailing', category: 'car_wash', price: 120, duration: 180, bookingCount: 18, isActive: true },
  { id: 4, name: 'Oil Change', description: 'Standard oil and filter change', category: 'maintenance', price: 45, duration: 30, bookingCount: 67, isActive: true },
  { id: 5, name: 'Brake Service', description: 'Brake inspection and pad replacement', category: 'maintenance', price: 120, duration: 90, bookingCount: 23, isActive: true },
  { id: 6, name: 'Tire Rotation', description: 'Rotate and balance all four tires', category: 'maintenance', price: 35, duration: 45, bookingCount: 41, isActive: true },
  { id: 7, name: 'Engine Diagnostics', description: 'Computer diagnostic scan and report', category: 'maintenance', price: 80, duration: 60, bookingCount: 15, isActive: true },
];

const EMPTY_FORM = { name: '', description: '', category: 'car_wash', price: '', duration: '', isActive: true };

const ServiceProviderServices = () => {
  const [services, setServices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      setServices(stored || DEFAULT_SERVICES);
      if (!stored) localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SERVICES));
    } catch {
      setServices(DEFAULT_SERVICES);
    }
  }, []);

  const persist = (updated) => {
    setServices(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingService) {
      persist(services.map((s) =>
        s.id === editingService.id
          ? { ...s, ...formData, price: parseFloat(formData.price), duration: parseInt(formData.duration) }
          : s
      ));
    } else {
      persist([...services, { id: Date.now(), ...formData, price: parseFloat(formData.price), duration: parseInt(formData.duration), bookingCount: 0 }]);
    }
    closeModal();
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({ name: service.name, description: service.description, category: service.category, price: String(service.price), duration: String(service.duration), isActive: service.isActive });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this service?')) persist(services.filter((s) => s.id !== id));
  };

  const closeModal = () => { setShowModal(false); setEditingService(null); setFormData(EMPTY_FORM); };

  const filtered = selectedCategory === 'all' ? services : services.filter((s) => s.category === selectedCategory);

  return (
    <div className="services-container">
      <div className="services-header">
        <div>
          <h1>Service Management</h1>
          <p>Manage your car wash and maintenance services</p>
        </div>
        <button className="add-service-btn" onClick={() => setShowModal(true)}>➕ Add New Service</button>
      </div>

      <div className="category-filter">
        <button className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => setSelectedCategory('all')}>
          All Services ({services.length})
        </button>
        <button className={`filter-btn ${selectedCategory === 'car_wash' ? 'active' : ''}`} onClick={() => setSelectedCategory('car_wash')}>
          🚿 Car Wash ({services.filter((s) => s.category === 'car_wash').length})
        </button>
        <button className={`filter-btn ${selectedCategory === 'maintenance' ? 'active' : ''}`} onClick={() => setSelectedCategory('maintenance')}>
          🔧 Maintenance ({services.filter((s) => s.category === 'maintenance').length})
        </button>
      </div>

      <div className="services-grid">
        {filtered.map((service) => (
          <div key={service.id} className="service-card">
            <div className="service-card-header">
              <span className="service-category-icon">{service.category === 'car_wash' ? '🚿' : '🔧'}</span>
              <span className={`service-status ${service.isActive ? 'active' : 'inactive'}`}>{service.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <h3>{service.name}</h3>
            <p className="service-description">{service.description}</p>
            <div className="service-details">
              <div className="service-detail-item"><span className="detail-label">Category</span><span className="detail-value">{service.category === 'car_wash' ? 'Car Wash' : 'Maintenance'}</span></div>
              <div className="service-detail-item"><span className="detail-label">Price</span><span className="detail-value price">${service.price}</span></div>
              <div className="service-detail-item"><span className="detail-label">Duration</span><span className="detail-value">{service.duration} min</span></div>
              <div className="service-detail-item"><span className="detail-label">Bookings</span><span className="detail-value">{service.bookingCount}</span></div>
            </div>
            <div className="service-actions">
              <button className="edit-btn" onClick={() => handleEdit(service)}>✏️ Edit</button>
              <button className="delete-btn" onClick={() => handleDelete(service.id)}>🗑️ Delete</button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="no-services">
          <p>No services found in this category</p>
          <button className="add-first-btn" onClick={() => setShowModal(true)}>Add Your First Service</button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingService ? 'Edit Service' : 'Add New Service'}</h2>
              <button className="close-btn" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="service-form">
              <div className="form-group">
                <label>Service Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g., Premium Car Wash" />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} required rows="3" placeholder="Describe what's included" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} required>
                    <option value="car_wash">Car Wash</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Price ($) *</label>
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" step="0.01" placeholder="0.00" />
                </div>
              </div>
              <div className="form-group">
                <label>Duration (minutes) *</label>
                <input type="number" name="duration" value={formData.duration} onChange={handleInputChange} required min="15" step="15" placeholder="30" />
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} />
                  <span>Service is active and available for booking</span>
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="submit-btn">{editingService ? 'Update Service' : 'Add Service'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceProviderServices;
