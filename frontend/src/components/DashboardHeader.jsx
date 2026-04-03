import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserDropdown from './UserDropdown';
import NotificationBell from './NotificationBell';

const DashboardHeader = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => location.pathname === path;

  const getNavLinks = () => {
    const role = user?.role;

    if (role === 'dealer') {
      return [
        { to: '/dealer-dashboard', label: 'Dashboard' },
        { to: '/dealer/inventory', label: 'Inventory' },
        { to: '/dealer/manage-listings', label: 'Listings' },
        { to: '/dealer/sales', label: 'Sales' },
        { to: '/dealer/messages', label: 'Messages' },
      ];
    }

    if (role === 'service_provider') {
      return [
        { to: '/service-provider-dashboard', label: 'Dashboard' },
        { to: '/service-provider/appointments', label: 'Appointments' },
        { to: '/service-provider/services', label: 'Services' },
        { to: '/service-provider/availability', label: 'Availability' },
        { to: '/service-provider/messages', label: 'Messages' },
      ];
    }

    if (role === 'admin') {
      return [
        { to: '/admin-dashboard', label: 'Dashboard' },
        { to: '/admin/users', label: 'Users' },
        { to: '/admin/dealers', label: 'Dealers' },
        { to: '/admin/services', label: 'Services' },
        { to: '/admin/reports', label: 'Reports' },
        { to: '/admin/logs', label: 'Logs' },
        { to: '/admin/system-settings', label: 'Settings' },
      ];
    }

    // Default: user (buyer/car owner)
    return [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/vehicles', label: 'Vehicles' },
      { to: '/appointments', label: 'Appointments' },
      { to: '/user-messages', label: 'Messages' },
    ];
  };

  return (
    <header className="auto-nav">
      <div className="auto-nav-content">
        <div className="auto-nav-brand">
          <Link to="/" className="auto-logo">AutoSphere</Link>
        </div>

        <div className="auto-nav-links">
          {getNavLinks().map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`auto-nav-link ${isActive(to) ? 'active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="auto-nav-utils">
          <NotificationBell />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
