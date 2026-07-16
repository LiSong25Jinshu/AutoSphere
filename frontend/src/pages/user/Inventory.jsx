import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleAPI } from '../../services/api';
import StartChatButton from '../../components/StartChatButton';
import './Inventory.css';

const UserInventory = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [savedVehicles, setSavedVehicles] = useState([]);
  const [activeTab, setActiveTab] = useState('owned');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      // Load saved vehicle searches from the real API
      const res = await vehicleAPI.getAll({ limit: 20 });
      // "Saved vehicles" = vehicles the user has viewed/saved (using savedSearches as proxy)
      // For now show recently available vehicles as browsing history
      // The "owned" tab stays as placeholder until a user-vehicle model is added
      setVehicles([]); // No user-owned vehicle model yet
      setSavedVehicles(res.data?.data || []);
    } catch (err) {
      console.error('Inventory fetch error:', err);
      setSavedVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'maintenance': return 'status-maintenance';
      case 'inactive': return 'status-inactive';
      default: return 'status-active';
    }
  };

  const removeSavedVehicle = (vehicleId) => {
    setSavedVehicles(prev => prev.filter(vehicle => vehicle.id !== vehicleId));
  };

  const tabs = [
    { id: 'owned', label: 'My Vehicles', count: vehicles.length },
    { id: 'saved', label: 'Saved Vehicles', count: savedVehicles.length }
  ];

  if (loading) {
    return (
      <div className="inventory-page">
        <div className="inventory-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading inventory...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-page">
      <div className="inventory-container">
        <div className="inventory-header">
          <div className="header-info">
            <h1>My Vehicles</h1>
            <p>Manage your vehicles and saved listings</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn secondary"
              onClick={() => navigate('/vehicles')}
            >
              Browse Vehicles
            </button>
            <button className="btn primary">
              Add Vehicle
            </button>
          </div>
        </div>

        <div className="inventory-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="inventory-content">
          {activeTab === 'owned' && (
            <div className="owned-vehicles">
              {vehicles.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🚗</div>
                  <h3>No vehicles added</h3>
                  <p>Add your vehicles to track maintenance and service history</p>
                  <button className="btn primary">Add Your First Vehicle</button>
                </div>
              ) : (
                <div className="vehicles-grid">
                  {vehicles.map(vehicle => (
                    <div key={vehicle.id} className="vehicle-card owned">
                      <div className="vehicle-image">
                        <img src={vehicle.image} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} />
                        <div className={`vehicle-status ${getStatusColor(vehicle.status)}`}>
                          {vehicle.status}
                        </div>
                      </div>
                      
                      <div className="vehicle-info">
                        <h3>{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                        <div className="vehicle-details">
                          <div className="detail-item">
                            <span className="detail-label">Mileage:</span>
                            <span className="detail-value">{vehicle.mileage.toLocaleString()} miles</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Color:</span>
                            <span className="detail-value">{vehicle.color}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">VIN:</span>
                            <span className="detail-value">{vehicle.vin}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Last Service:</span>
                            <span className="detail-value">{vehicle.lastService}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Next Service:</span>
                            <span className="detail-value">{vehicle.nextService}</span>
                          </div>
                        </div>
                        
                        <div className="vehicle-documents">
                          <h4>Documents:</h4>
                          <div className="documents-list">
                            {vehicle.documents.map((doc, index) => (
                              <span key={index} className="document-tag">
                                {doc}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="vehicle-actions">
                        <button className="btn secondary small">View Details</button>
                        <button className="btn primary small">Book Service</button>
                        <button className="btn secondary small">Edit</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="saved-vehicles">
              {savedVehicles.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">❤️</div>
                  <h3>No saved vehicles</h3>
                  <p>Save vehicles you're interested in to view them later</p>
                  <button 
                    className="btn primary"
                    onClick={() => navigate('/vehicles')}
                  >
                    Browse Vehicles
                  </button>
                </div>
              ) : (
                <div className="vehicles-grid">
                  {savedVehicles.map(vehicle => (
                    <div key={vehicle.id} className="vehicle-card saved">
                      <div className="vehicle-image">
                        <img
                          src={vehicle.images?.[0] || '/api/placeholder/300/200'}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        />
                      </div>
                      <div className="vehicle-info">
                        <h3>{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                        <div className="vehicle-price">GH₵ {Number(vehicle.price).toLocaleString()}</div>
                        <div className="vehicle-details">
                          <div className="detail-item">
                            <span className="detail-label">Mileage:</span>
                            <span className="detail-value">{vehicle.mileage ? `${Number(vehicle.mileage).toLocaleString()} miles` : '—'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Color:</span>
                            <span className="detail-value">{vehicle.color || '—'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Condition:</span>
                            <span className="detail-value">{vehicle.condition?.replace(/_/g, ' ') || '—'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Status:</span>
                            <span className="detail-value">{vehicle.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="vehicle-actions">
                        <button className="btn secondary small" onClick={() => navigate(`/vehicles/${vehicle.id}`)}>View Details</button>
                        <button className="btn primary small" onClick={() => navigate('/book-service')}>Book Service</button>
                        {vehicle.dealerId && (
                          <StartChatButton
                            userId={vehicle.dealerId}
                            userName={vehicle.dealer ? `${vehicle.dealer.firstName} ${vehicle.dealer.lastName}` : 'Dealer'}
                            userRole="dealer"
                            userPhone={vehicle.dealer?.phone || ''}
                            label="Message Dealer"
                            variant="ghost"
                            size="sm"
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
    </div>
  );
};

export default UserInventory;