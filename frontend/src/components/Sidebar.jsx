import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV_BY_ROLE = {
  user: [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/vehicles', label: 'Vehicles', icon: '🚗' },
    { path: '/ai-car-finder', label: 'AI Car Finder', icon: '🤖' },
    { path: '/appointments', label: 'Appointments', icon: '📅' },
    { path: '/inventory', label: 'My Vehicles', icon: '📦' },
    { path: '/user-messages', label: 'Messages', icon: '💬' },
    { path: '/notifications', label: 'Notifications', icon: '🔔' },
    { path: '/profile', label: 'Profile', icon: '👤' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ],
  dealer: [
    { path: '/dealer-dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/dealer/inventory', label: 'Inventory', icon: '📦' },
    { path: '/dealer/manage-listings', label: 'Manage Listings', icon: '📋' },
    { path: '/dealer/sales', label: 'Sales', icon: '💰' },
    { path: '/dealer/messages', label: 'Messages', icon: '💬' },
    { path: '/dealer/profile', label: 'Profile', icon: '👤' },
  ],
  service_provider: [
    { path: '/service-provider-dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/service-provider/appointments', label: 'Appointments', icon: '📅' },
    { path: '/service-provider/services', label: 'Services', icon: '🔧' },
    { path: '/service-provider/availability', label: 'Availability', icon: '🗓️' },
    { path: '/service-provider/messages', label: 'Messages', icon: '💬' },
    { path: '/service-provider/profile', label: 'Profile', icon: '👤' },
  ],
  admin: [
    { path: '/admin-dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/dealers', label: 'Dealers', icon: '🏢' },
    { path: '/admin/services', label: 'Services', icon: '🔧' },
    { path: '/admin/reports', label: 'Reports', icon: '📈' },
    { path: '/admin/logs', label: 'Logs', icon: '📋' },
    { path: '/admin/system-settings', label: 'System Settings', icon: '⚙️' },
    { path: '/jobs', label: 'Jobs', icon: '💼' },
  ],
};

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const items = NAV_BY_ROLE[user?.role] || NAV_BY_ROLE.user;

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo">AutoSphere</Link>
      </div>
      <div className="sidebar-content">
        <nav className="sidebar-nav">
          {items.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;