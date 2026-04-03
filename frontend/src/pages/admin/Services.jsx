import { useState, useEffect, useCallback } from 'react';
import { userAPI } from '../../services/api';
import './Admin.css';

const STATUS_COLORS = { active: '#4caf50', inactive: '#f44336', pending: '#ff9800' };

const AdminServices = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userAPI.getAll({ role: 'service_provider', limit: 100, search: search || undefined });
      setProviders(res.data?.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load service providers');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const toggleStatus = async (provider) => {
    setActionLoading(provider.id);
    try {
      await userAPI.updateStatus(provider.id, !provider.isActive);
      setProviders((prev) =>
        prev.map((p) => p.id === provider.id ? { ...p, isActive: !p.isActive } : p)
      );
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = providers.filter((p) => {
    const status = p.isActive ? 'active' : 'inactive';
    const matchStatus = statusFilter === 'all' || status === statusFilter;
    const matchSearch =
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      (p.email || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="admin-sub-page">
      <div className="admin-sub-header">
        <div>
          <h1>Service Providers</h1>
          <p>Manage car wash and maintenance service providers</p>
        </div>
        <div className="admin-sub-stats">
          <span className="admin-stat-pill">{providers.length} Total</span>
          <span className="admin-stat-pill active">{providers.filter((p) => p.isActive).length} Active</span>
          <span className="admin-stat-pill warn">{providers.filter((p) => !p.isActive).length} Inactive</span>
        </div>
      </div>

      <div className="admin-controls">
        <input className="admin-search" type="text" placeholder="Search providers..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="admin-filters">
          {['all', 'active', 'inactive'].map((s) => (
            <button key={s} className={'admin-filter-btn' + (statusFilter === s ? ' active' : '')}
              onClick={() => setStatusFilter(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="admin-loading">Loading service providers...</div>}
      {error && <div className="admin-error-msg">{error} <button onClick={fetchProviders}>Retry</button></div>}

      {!loading && !error && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="admin-name-cell">{p.firstName} {p.lastName}</td>
                  <td className="admin-email-cell">{p.email}</td>
                  <td className="admin-sub-text">{p.phone || '—'}</td>
                  <td>
                    <span className="admin-status-badge"
                      style={{ background: p.isActive ? STATUS_COLORS.active : STATUS_COLORS.inactive }}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="admin-sub-text">
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="admin-actions-cell">
                    <button
                      className={'admin-action-btn' + (p.isActive ? '' : ' success')}
                      disabled={actionLoading === p.id}
                      onClick={() => toggleStatus(p)}>
                      {actionLoading === p.id ? '...' : p.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="admin-empty">No service providers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminServices;
