import { useState, useEffect } from 'react';
import { userAPI, vehicleAPI, bookingAPI } from '../../services/api';
import './Admin.css';

const AdminReports = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const [usersRes, vehiclesRes, bookingsRes] = await Promise.all([
          userAPI.getAll({ limit: 1 }),
          vehicleAPI.getAll({ limit: 1 }),
          bookingAPI.getAll({ limit: 1 }),
        ]);
        setStats({
          totalUsers: usersRes.data?.total || usersRes.data?.data?.length || 0,
          totalVehicles: vehiclesRes.data?.total || vehiclesRes.data?.data?.length || 0,
          totalBookings: bookingsRes.data?.total || bookingsRes.data?.data?.length || 0,
        });
      } catch (e) {
        setError('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="admin-sub-page">
      <div className="admin-sub-header">
        <div>
          <h1>Reports &amp; Analytics</h1>
          <p>Platform-wide performance overview</p>
        </div>
      </div>

      {loading && <div className="admin-loading">Loading report data...</div>}
      {error && <div className="admin-error-msg">{error}</div>}

      {!loading && !error && stats && (
        <>
          <div className="admin-reports-stats">
            <div className="admin-report-card">
              <div className="admin-report-value" style={{ color: '#2196f3' }}>{stats.totalUsers.toLocaleString()}</div>
              <div className="admin-report-label">Total Users</div>
              <div className="admin-report-change" style={{ color: '#888' }}>All registered accounts</div>
            </div>
            <div className="admin-report-card">
              <div className="admin-report-value" style={{ color: '#ff9800' }}>{stats.totalVehicles.toLocaleString()}</div>
              <div className="admin-report-label">Vehicle Listings</div>
              <div className="admin-report-change" style={{ color: '#888' }}>Active on platform</div>
            </div>
            <div className="admin-report-card">
              <div className="admin-report-value" style={{ color: '#9c27b0' }}>{stats.totalBookings.toLocaleString()}</div>
              <div className="admin-report-label">Service Bookings</div>
              <div className="admin-report-change" style={{ color: '#888' }}>All time</div>
            </div>
            <div className="admin-report-card">
              <div className="admin-report-value" style={{ color: '#4caf50' }}>—</div>
              <div className="admin-report-label">Total Revenue</div>
              <div className="admin-report-change" style={{ color: '#888' }}>Revenue endpoint pending</div>
            </div>
          </div>

          <div className="admin-report-section" style={{ marginTop: 0 }}>
            <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>
              Detailed analytics (top dealers, top service providers, revenue breakdown) will be available once the analytics API endpoint is implemented on the backend.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReports;
