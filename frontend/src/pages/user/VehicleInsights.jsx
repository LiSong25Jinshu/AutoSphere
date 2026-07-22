import { useState, useEffect } from 'react';
import { bookingAPI } from '../../services/api';
import './VehicleInsights.css';

const VehicleInsights = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await bookingAPI.getAll({ limit: 50 });
        if (res.data.success) setBookings(res.data.data || []);
      } catch (err) {
        setError('Failed to load service history');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const completed = bookings.filter((b) => b.status === 'completed');
  const upcoming = bookings.filter((b) => ['pending', 'confirmed'].includes(b.status));
  const lastService = completed.length > 0
    ? new Date(completed[0].scheduledDate).toLocaleDateString()
    : 'No services yet';
  const nextService = upcoming.length > 0
    ? new Date(upcoming[0].scheduledDate).toLocaleDateString()
    : 'None scheduled';
  const totalSpent = completed.reduce((sum, b) => sum + (parseFloat(b.actualCost) || 0), 0);
  const avgRating = completed.filter((b) => b.rating).length > 0
    ? (completed.filter((b) => b.rating).reduce((s, b) => s + b.rating, 0) / completed.filter((b) => b.rating).length).toFixed(1)
    : null;

  if (loading) {
    return (
      <div className="vehicle-insights-page">
        <div className="insights-container">
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading insights...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicle-insights-page">
      <div className="insights-container">
        <div className="insights-header">
          <h1>Vehicle Insights</h1>
          <p className="subtitle">Your service history and vehicle overview</p>
        </div>

        {error && (
          <div style={{ background: '#ffebee', color: '#d32f2f', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div className="insights-grid">
          <div className="insight-card">
            <div className="card-icon">📅</div>
            <h3>Total Bookings</h3>
            <p className="card-value">{bookings.length}</p>
          </div>
          <div className="insight-card">
            <div className="card-icon">✅</div>
            <h3>Completed Services</h3>
            <p className="card-value">{completed.length}</p>
          </div>
          <div className="insight-card">
            <div className="card-icon">🔧</div>
            <h3>Last Service</h3>
            <p className="card-value">{lastService}</p>
          </div>
          <div className="insight-card">
            <div className="card-icon">📆</div>
            <h3>Next Service</h3>
            <p className="card-value">{nextService}</p>
          </div>
          <div className="insight-card">
            <div className="card-icon">💰</div>
            <h3>Total Spent</h3>
            <p className="card-value">${totalSpent.toFixed(2)}</p>
          </div>
          {avgRating && (
            <div className="insight-card">
              <div className="card-icon">⭐</div>
              <h3>Avg Rating Given</h3>
              <p className="card-value">{avgRating}/5.0</p>
            </div>
          )}
        </div>

        {completed.length > 0 && (
          <div className="alerts-section">
            <h2>Recent Service History</h2>
            <div className="alerts-list">
              {completed.slice(0, 5).map((b) => (
                <div key={b.id} className="alert-item">
                  <span className="alert-icon">🔧</span>
                  <span className="alert-text">
                    {b.serviceType?.replace(/_/g, ' ')} — {new Date(b.scheduledDate).toLocaleDateString()}
                    {b.actualCost ? ` · GH₵ ${b.actualCost}` : ''}
                    {b.rating ? ` · ⭐ ${b.rating}/5` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="alerts-section">
            <h2>🚨 Upcoming Services</h2>
            <div className="alerts-list">
              {upcoming.map((b) => (
                <div key={b.id} className="alert-item">
                  <span className="alert-icon">⏰</span>
                  <span className="alert-text">
                    {b.serviceType?.replace(/_/g, ' ')} — {new Date(b.scheduledDate).toLocaleDateString()} at {b.scheduledTime}
                    {' · '}<span style={{ textTransform: 'capitalize' }}>{b.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {bookings.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚗</div>
            <h3>No service history yet</h3>
            <p>Book your first service to start tracking your vehicle insights</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleInsights;
