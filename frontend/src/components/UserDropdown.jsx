import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const UserDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const close = () => setIsOpen(false);

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || '👤';
  };

  const getDropdownItems = () => {
    const role = user?.role;

    if (role === 'dealer') {
      return [
        { to: '/dealer/profile', label: 'Profile' },
        { to: '/dealer/manage-listings', label: 'Manage Listings' },
        { to: '/settings', label: 'Settings' },
      ];
    }

    if (role === 'service_provider') {
      return [
        { to: '/service-provider/profile', label: 'Profile' },
        { to: '/service-provider/service-settings', label: 'Service Settings' },
        { to: '/service-provider/availability', label: 'Availability' },
      ];
    }

    if (role === 'admin') {
      return [
        { to: '/admin/profile', label: 'Admin Profile' },
        { to: '/admin/system-settings', label: 'System Settings' },
        { to: '/admin/logs', label: 'Logs' },
      ];
    }

    // Default: user
    return [
      { to: '/profile', label: 'Profile' },
      { to: '/settings', label: 'Settings' },
    ];
  };

  return (
    <div className="user-dropdown" ref={dropdownRef}>
      <button
        className="user-avatar-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="user-avatar">{getInitials()}</div>
        <span className="dropdown-arrow">▼</span>
      </button>

      {isOpen && (
        <div className="dropdown-menu" role="menu">
          {getDropdownItems().map(({ to, label }) => (
            <Link key={to} to={to} className="dropdown-item" onClick={close} role="menuitem">
              {label}
            </Link>
          ))}
          <button className="dropdown-item logout-btn" onClick={handleLogout} role="menuitem">
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
