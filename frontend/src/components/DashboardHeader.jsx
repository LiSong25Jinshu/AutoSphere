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
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
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
