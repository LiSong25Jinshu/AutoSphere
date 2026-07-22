import { useState, useEffect, useCallback } from 'react';
import { userAPI } from '../../services/api';
import './Admin.css';

const AdminDealers = () => {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDealers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userAPI.getAll({ role: 'dealer', limit: 100, search: search || undefined });
      setDealers(res.data?.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load dealers');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchDealers(); }, [fetchDealers]);

  const toggleStatus = async (dealer) => {
    setActionLoading(dealer.id);
    try {
      await userAPI.updateStatus(dealer.id, !dealer.isActive);
      setDealers((prev) => prev.map((d) => d.id === dealer.id ? { ...d, isActive: !d.isActive } : d));
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="admin-sub-page">
      <div className="admin-sub-header">
        <div>
          <h1>Dealer Management</h1>
          <p>Manage dealerships on the platform</p>
        </div>
        <div className="admin-sub-stats">
          <span className="admin-stat-pill">{dealers.length} Total</span>
          <span className="admin-stat-pill active">{dealers.filter((d) => d.isActive).length} Active</span>
          <span className="admin-stat-pill warn">{dealers.filter((d) => !d.isActive).length} Inactive</span>
        </div>
      </div>

      <div className="admin-controls">
        <input className="admin-search" type="text" placeholder="Search dealers..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading && <div className="admin-loading">Loading dealers...</div>}
      {error && <div className="admin-error-msg">{error} <button onClick={fetchDealers}>Retry</button></div>}

      {!loading && !error && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dealers.map((d) => (
                <tr key={d.id}>
                  <td className="admin-name-cell">{d.firstName} {d.lastName}</td>
                  <td className="admin-email-cell">{d.email}</td>
                  <td className="admin-sub-text">{d.phone || '—'}</td>
                  <td>
                    <span className="admin-status-badge" style={{ background: d.isActive ? '#4caf50' : '#f44336' }}>
                      {d.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="admin-sub-text">
                    {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="admin-actions-cell">
                    <button className={'admin-action-btn' + (d.isActive ? '' : ' success')}
                      disabled={actionLoading === d.id}
                      onClick={() => toggleStatus(d)}>
                      {d.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {dealers.length === 0 && (
                <tr><td colSpan={6} className="admin-empty">No dealers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDealers;
