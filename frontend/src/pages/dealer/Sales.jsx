import { useState, useEffect, useCallback } from 'react';
import { vehicleAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Sales.css';

const STATUS_COLORS = { sold: '#4caf50', available: '#2196f3', pending: '#ff9800', reserved: '#9c27b0' };

const DealerSales = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('sold');
  const [search, setSearch] = useState('');

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await vehicleAPI.getMyVehicles();
      setVehicles(res.data?.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const filtered = vehicles.filter((v) => {
    const matchStatus = filter === 'all' || (v.status || '').toLowerCase() === filter;
    const matchSearch =
      `${v.year} ${v.make} ${v.model}`.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const soldVehicles = vehicles.filter((v) => (v.status || '').toLowerCase() === 'sold');
  const totalRevenue = soldVehicles.reduce((sum, v) => sum + (parseFloat(v.price) || 0), 0);

  return (
    <div className="dealer-sales-page">
      <div className="ds-page-header">
        <div>
          <h1>Sales</h1>
          <p>Track your vehicle sales and inventory status</p>
        </div>
        <button className="ds-refresh-btn" onClick={fetchVehicles} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="ds-stats-grid">
        <div className="ds-stat-card">
          <div className="ds-stat-value" style={{ color: '#4caf50' }}>${totalRevenue.toLocaleString()}</div>
          <div className="ds-stat-label">Total Sales Revenue</div>
          <div className="ds-stat-sub">From sold vehicles</div>
        </div>
        <div className="ds-stat-card">
          <div className="ds-stat-value" style={{ color: '#2196f3' }}>{soldVehicles.length}</div>
          <div className="ds-stat-label">Units Sold</div>
          <div className="ds-stat-sub">All time</div>
        </div>
        <div className="ds-stat-card">
          <div className="ds-stat-value" style={{ color: '#ff9800' }}>
            {vehicles.filter((v) => (v.status || '').toLowerCase() === 'available').length}
          </div>
          <div className="ds-stat-label">Available</div>
          <div className="ds-stat-sub">In inventory</div>
        </div>
        <div className="ds-stat-card">
          <div className="ds-stat-value" style={{ color: '#9c27b0' }}>
            {soldVehicles.length > 0
              ? `$${Math.round(totalRevenue / soldVehicles.length).toLocaleString()}`
              : '—'}
          </div>
          <div className="ds-stat-label">Avg. Sale Price</div>
          <div className="ds-stat-sub">Per vehicle</div>
        </div>
      </div>

      <div className="ds-controls">
        <input type="text" placeholder="Search by make, model, year..."
          value={search} onChange={(e) => setSearch(e.target.value)} className="ds-search" />
        <div className="ds-filters">
          {['all', 'sold', 'available', 'pending', 'reserved'].map((f) => (
            <button key={f} className={'ds-filter-btn' + (filter === f ? ' active' : '')}
              onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="ds-error">{error} <button onClick={fetchVehicles}>Retry</button></div>}

      <div className="ds-table-wrap">
        <table className="ds-table">
          <thead>
            <tr>
              <th>Vehicle</th><th>Price</th><th>Mileage</th><th>Status</th><th>Listed</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="ds-empty">Loading...</td></tr>
            ) : filtered.map((v) => (
              <tr key={v.id}>
                <td className="ds-vehicle-cell">{v.year} {v.make} {v.model}</td>
                <td className="ds-price-cell">${parseFloat(v.price || 0).toLocaleString()}</td>
                <td>{v.mileage ? `${parseInt(v.mileage).toLocaleString()} mi` : '—'}</td>
                <td>
                  <span className="ds-status-badge"
                    style={{ background: STATUS_COLORS[(v.status || '').toLowerCase()] || '#888' }}>
                    {v.status || 'unknown'}
                  </span>
                </td>
                <td>{v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={5} className="ds-empty">No vehicles found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DealerSales;
