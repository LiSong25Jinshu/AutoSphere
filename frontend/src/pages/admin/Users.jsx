import { useState, useEffect, useCallback } from 'react';
import { userAPI } from '../../services/api';
import './Admin.css';

const ROLE_COLORS = { user: '#2196f3', dealer: '#ff9800', service_provider: '#9c27b0', admin: '#f44336' };
const label = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 20 };
      if (roleFilter !== 'all') params.role = roleFilter;
      if (search) params.search = search;
      const res = await userAPI.getAll(params);
      setUsers(res.data?.data || []);
      setPagination(res.data?.pagination || { page: 1, total: 0, pages: 1 });
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(1); }, [fetchUsers]);

  const toggleStatus = async (user) => {
    setActionLoading(user.id + 'status');
    try {
      await userAPI.updateStatus(user.id, !user.isActive);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const changeRole = async (user, role) => {
    if (!window.confirm(`Change ${user.firstName}'s role to ${label(role)}?`)) return;
    setActionLoading(user.id + 'role');
    try {
      await userAPI.updateRole(user.id, role);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role } : u));
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="admin-sub-page">
      <div className="admin-sub-header">
        <div>
          <h1>User Management</h1>
          <p>Manage all registered users — {pagination.total} total</p>
        </div>
        <div className="admin-sub-stats">
          <span className="admin-stat-pill">{pagination.total} Total</span>
          <span className="admin-stat-pill active">{users.filter((u) => u.isActive).length} Active</span>
          <span className="admin-stat-pill warn">{users.filter((u) => !u.isActive).length} Inactive</span>
        </div>
      </div>

      <div className="admin-controls">
        <input className="admin-search" type="text" placeholder="Search users..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="admin-filters">
          {['all', 'user', 'dealer', 'service_provider', 'admin'].map((r) => (
            <button key={r}
              className={'admin-filter-btn' + (roleFilter === r ? ' active' : '')}
              onClick={() => setRoleFilter(r)}>
              {r === 'all' ? 'All' : label(r) + 's'}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="admin-loading">Loading users...</div>}
      {error && <div className="admin-error-msg">{error} <button onClick={() => fetchUsers(1)}>Retry</button></div>}

      {!loading && !error && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="admin-name-cell">{u.firstName} {u.lastName}</td>
                  <td className="admin-email-cell">{u.email}</td>
                  <td>
                    <span className="admin-role-badge" style={{ background: ROLE_COLORS[u.role] || '#999' }}>
                      {label(u.role)}
                    </span>
                  </td>
                  <td>
                    <span className="admin-status-badge" style={{ background: u.isActive ? '#4caf50' : '#f44336' }}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="admin-sub-text">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="admin-actions-cell">
                    <button className={'admin-action-btn' + (u.isActive ? '' : ' success')}
                      disabled={actionLoading === u.id + 'status'}
                      onClick={() => toggleStatus(u)}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <select className="admin-role-select"
                      value={u.role}
                      disabled={actionLoading === u.id + 'role'}
                      onChange={(e) => changeRole(u, e.target.value)}>
                      {['user', 'dealer', 'service_provider', 'admin'].map((r) => (
                        <option key={r} value={r}>{label(r)}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="admin-empty">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="admin-pagination">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button key={p}
              className={'admin-page-btn' + (pagination.page === p ? ' active' : '')}
              onClick={() => fetchUsers(p)}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
