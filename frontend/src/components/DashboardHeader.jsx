import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import UserDropdown from './UserDropdown';

const DARK_KEY = 'autosphere-dark-mode';

const DashboardHeader = ({ onSidebarToggle, sidebarCollapsed }) => {
  const { user } = useAuth();

  // Dark mode state — persisted in localStorage
  const [dark, setDark] = useState(() => localStorage.getItem(DARK_KEY) === 'true');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem(DARK_KEY, String(dark));
  }, [dark]);

  const roleLabel = {
    user: 'Customer',
    dealer: 'Dealer',
    service_provider: 'Service Provider',
    admin: 'Administrator',
  }[user?.role] || 'User';

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-content">
        {/* Left: sidebar toggle + brand */}
        <div className="dashboard-header-left">
          <button
            className="sidebar-toggle-btn"
            onClick={onSidebarToggle}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '▶' : '◀'}
          </button>
          <Link to="/" className="auto-logo" style={{ marginLeft: '0.75rem' }}>
            AutoSphere
          </Link>
        </div>

        {/* Right: dark mode + notifications + profile */}
        <div className="dashboard-header-actions">
          {/* Dark mode toggle */}
          <button
            className="header-icon-btn"
            onClick={() => setDark((d) => !d)}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle dark mode"
          >
            {dark ? '☀️' : '🌙'}
          </button>

          {/* Notification bell */}
          <NotificationBell />

          {/* Role badge */}
          <span className="header-role-badge">{roleLabel}</span>

          {/* Profile dropdown */}
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
