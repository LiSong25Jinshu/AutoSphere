import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import './Admin.css';

const AdminReports = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getAnalytics(30),
      ]);
      setStats(statsRes.data?.data);
      setAnalytics(analyticsRes.data?.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="admin-sub-page">
      <div className="admin-sub-header">
        <div>
          <h1>Reports &amp; Analytics</h1>
          <p>Platform-wide performance overview (last 30 days)</p>
        </div>
        <button className="admin-action-btn" onClick={fetchData} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading && <div className="admin-loading">Loading report data...</div>}
      {error && <div className="admin-error-msg">{error} <button onClick={fetchData}>Retry</button></div>}

      {!loading && !error && stats && analytics && (
        <>
          {/* Totals */}
          <div className="admin-reports-stats">
            <div className="admin-report-card">
              <div className="admin-report-value" style={{ color: '#2196f3' }}>
                {stats.totals.users?.toLocaleString()}
              </div>
              <div className="admin-report-label">Total Users</div>
              <div className="admin-report-change">+{stats.thisMonth.users} this month</div>
            </div>
            <div className="admin-report-card">
              <div className="admin-report-value" style={{ color: '#ff9800' }}>
                {stats.totals.vehicles?.toLocaleString()}
              </div>
              <div className="admin-report-label">Vehicle Listings</div>
              <div className="admin-report-change">+{stats.thisMonth.vehicles} this month</div>
            </div>
            <div className="admin-report-card">
              <div className="admin-report-value" style={{ color: '#9c27b0' }}>
                {stats.totals.bookings?.toLocaleString()}
              </div>
              <div className="admin-report-label">Total Bookings</div>
              <div className="admin-report-change">{stats.totals.activeBookings} active</div>
            </div>
            <div className="admin-report-card">
              <div className="admin-report-value" style={{ color: '#4caf50' }}>
                {analytics.completionRate}%
              </div>
              <div className="admin-report-label">Completion Rate</div>
              <div className="admin-report-change">
                {analytics.completedBookings} of {analytics.totalBookings} bookings
              </div>
            </div>
          </div>

          {/* Bookings by status */}
          <div className="admin-report-section">
            <h2>Bookings by Status</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Status</th><th>Count</th><th>Share</th></tr>
                </thead>
                <tbody>
                  {stats.breakdowns.bookingsByStatus.map((row) => (
                    <tr key={row.status}>
                      <td style={{ textTransform: 'capitalize' }}>{row.status?.replace(/_/g, ' ')}</td>
                      <td>{row.count}</td>
                      <td>
                        {stats.totals.bookings > 0
                          ? `${((row.count / stats.totals.bookings) * 100).toFixed(1)}%`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                  {stats.breakdowns.bookingsByStatus.length === 0 && (
                    <tr><td colSpan={3} className="admin-empty">No booking data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Users by role */}
          <div className="admin-report-section">
            <h2>Users by Role</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Role</th><th>Count</th></tr>
                </thead>
                <tbody>
                  {stats.breakdowns.usersByRole.map((row) => (
                    <tr key={row.role}>
                      <td style={{ textTransform: 'capitalize' }}>{row.role?.replace(/_/g, ' ')}</td>
                      <td>{row.count}</td>
                    </tr>
                  ))}
                  {stats.breakdowns.usersByRole.length === 0 && (
                    <tr><td colSpan={2} className="admin-empty">No user data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top service providers */}
          {analytics.topProviders?.length > 0 && (
            <div className="admin-report-section">
              <h2>Top Service Providers (30 days)</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Provider</th><th>Email</th><th>Bookings</th><th>Avg Rating</th></tr>
                  </thead>
                  <tbody>
                    {analytics.topProviders.map((p) => (
                      <tr key={p.id}>
                        <td className="admin-name-cell">{p.name}</td>
                        <td className="admin-email-cell">{p.email}</td>
                        <td>{p.bookings}</td>
                        <td>{p.avgRating ? `${p.avgRating}/5.0` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminReports;
