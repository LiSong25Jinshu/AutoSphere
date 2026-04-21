import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import SystemOverview from '../components/admin/SystemOverview';
import UserManagement from '../components/admin/UserManagement';
import AnalyticsReporting from '../components/admin/AnalyticsReporting';
import ContentModeration from '../components/admin/ContentModeration';
import './admin/Admin.css';

const TABS = [
  { id: 'overview',    label: '📊 Overview' },
  { id: 'users',       label: '👥 Users' },
  { id: 'analytics',   label: '📈 Analytics' },
  { id: 'moderation',  label: '🛡️ Moderation' },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [alerts, setAlerts] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await adminAPI.getStats();
      const data = res.data?.data;
      const live = [];
      if (data?.totals?.pendingBookings > 0) {
        live.push({ id: 'pending', type: 'warning', message: `${data.totals.pendingBookings} booking(s) awaiting confirmation` });
      }
      if (data?.totals?.unverifiedUsers > 0) {
        live.push({ id: 'unverified', type: 'info', message: `${data.totals.unverifiedUsers} user(s) pending email verification` });
      }
      setAlerts(live);
    } catch {
      // alerts are non-critical, fail silently
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts, refreshKey]);

  const handleRefresh = () => {
    setLastRefresh(new Date());
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="admin-dashboard">
      {/* Page header — no duplicate nav, just title + refresh */}
      <div className="admin-page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="admin-subtitle">
            Welcome, {user?.firstName} {user?.lastName} &nbsp;·&nbsp;
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button className="admin-refresh-btn" onClick={handleRefresh} title="Refresh data">
          🔄 Refresh
        </button>
      </div>

      {/* Live alerts from real data */}
      {alerts.length > 0 && (
        <div className="admin-alerts">
          {alerts.map((a) => (
            <div key={a.id} className={`admin-alert admin-alert-${a.type}`}>
              {a.type === 'warning' ? '⚠️' : 'ℹ️'} {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Tab navigation */}
      <div className="admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="admin-tab-content">
        {activeTab === 'overview'   && <SystemOverview onRefresh={refreshKey} />}
        {activeTab === 'users'      && <UserManagement />}
        {activeTab === 'analytics'  && <AnalyticsReporting />}
        {activeTab === 'moderation' && <ContentModeration />}
      </div>
    </div>
  );
};

export default AdminDashboard;
