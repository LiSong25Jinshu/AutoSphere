import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MENU_BY_ROLE = {
  user: [
    { to: '/profile',      label: '👤 My Profile' },
    { to: '/settings',     label: '⚙️ Settings' },
    { to: '/appointments', label: '📅 My Appointments' },
  ],
  dealer: [
    { to: '/dealer/profile',          label: '👤 Dealer Profile' },
    { to: '/dealer/manage-listings',  label: '📋 Manage Listings' },
    { to: '/settings',                label: '⚙️ Settings' },
  ],
  service_provider: [
    { to: '/service-provider/profile',           label: '👤 My Profile' },
    { to: '/service-provider/service-settings',  label: '🔧 Service Settings' },
    { to: '/service-provider/availability',      label: '🗓️ Availability' },
  ],
  admin: [
    { to: '/admin/system-settings', label: '⚙️ System Settings' },
    { to: '/admin/logs',            label: '📋 Logs' },
  ],
};

const UserDropdown = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setOpen(false);
  };

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';

  const items = MENU_BY_ROLE[user?.role] || MENU_BY_ROLE.user;

  return (
    <div className="user-dropdown" ref={ref}>
      <button
        className="user-avatar-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="User menu"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="user-avatar">{initials}</div>
        <div className="user-avatar-info">
          <span className="user-name">{user?.firstName || user?.email}</span>
          <span className="dropdown-arrow">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="dropdown-menu" role="menu">
          {/* User info header */}
          <div className="dropdown-header">
            <div className="dropdown-avatar">{initials}</div>
            <div>
              <div className="dropdown-name">{user?.firstName} {user?.lastName}</div>
              <div className="dropdown-email">{user?.email}</div>
            </div>
          </div>

          <div className="dropdown-divider" />

          {items.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="dropdown-item"
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              {label}
            </Link>
          ))}

          <div className="dropdown-divider" />

          <button
            className="dropdown-item dropdown-logout"
            onClick={handleLogout}
            role="menuitem"
          >
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
