import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { vehicleAPI } from '../../services/api';
import './Dashboard.css';

const DealerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await vehicleAPI.getDealerStats();
        if (res.data?.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load dealer stats:', err);
        setError('Could not load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = stats
    ? [
        { label: 'Total Inventory', value: stats.totalInventory, icon: '🚗', note: `${stats.availableVehicles} available` },
        { label: 'Sold This Month', value: stats.soldThisMonth, icon: '✅', note: `${stats.newThisMonth} added this month` },
        { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: '👁️', note: 'Across all listings' },
        { label: 'Available Now', value: stats.availableVehicles, icon: '📋', note: `of ${stats.totalInventory} total` },
      ]
    : [];

  return (
    <div className="dealer-dashboard">
      <div className="dealer-dashboard__header">
        <div>
          <h1>Dealer Dashboard</h1>
          <p>Welcome back, {user?.firstName}. Here's your dealership overview.</p>
        </div>
        <button className="dealer-dashboard__add-btn" onClick={() => navigate('/dealer/inventory')}>
          + Add Vehicle
        </button>
      </div>

      {error && <div className="dealer-dashboard__error">{error}</div>}

      {/* Stats Grid */}
      <div className="dealer-dashboard__stats">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="dealer-stat-card dealer-stat-card--skeleton" />
            ))
          : statCards.map((card) => (
              <div key={card.label} className="dealer-stat-card">
                <div className="dealer-stat-card__icon">{card.icon}</div>
                <div className="dealer-stat-card__body">
                  <span className="dealer-stat-card__value">{card.value}</span>
                  <span className="dealer-stat-card__label">{card.label}</span>
                  <span className="dealer-stat-card__note">{card.note}</span>
                </div>
              </div>
            ))}
      </div>

      <div className="dealer-dashboard__grid">
        {/* Top Vehicles */}
        <div className="dealer-dashboard__panel">
          <div className="dealer-dashboard__panel-header">
            <h2>Top Vehicles by Views</h2>
            <button onClick={() => navigate('/dealer/inventory')}>View All</button>
          </div>
          {loading ? (
            <p className="dealer-dashboard__loading">Loading...</p>
          ) : stats?.topVehicles?.length ? (
            <table className="dealer-dashboard__table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Views</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.topVehicles.map((v) => (
                  <tr key={v.id}>
                    <td>{v.model}</td>
                    <td>{v.views}</td>
                    <td>{v.price}</td>
                    <td>
                      <span className={`dealer-dashboard__badge dealer-dashboard__badge--${v.status}`}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="dealer-dashboard__empty">No vehicles yet. Add your first listing.</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="dealer-dashboard__panel">
          <div className="dealer-dashboard__panel-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="dealer-dashboard__actions">
            <button onClick={() => navigate('/dealer/inventory')}>🚗 Manage Inventory</button>
            <button onClick={() => navigate('/dealer/messages')}>💬 Messages</button>
            <button onClick={() => navigate('/dealer/sales')}>📊 Sales Report</button>
            <button onClick={() => navigate('/dealer/profile')}>👤 Edit Profile</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealerDashboard;
