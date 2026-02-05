import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserDropdown from './UserDropdown';

const DashboardHeader = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="auto-nav">
      <div className="auto-nav-content">
        {/* Auto Logo */}
        <div className="auto-nav-brand">
          <Link to="/" className="auto-logo">
            AutoSphere
          </Link>
        </div>

        {/* Dashboard Navigation Links */}
        <div className="auto-nav-links">
          <Link 
            to="/dashboard" 
            className={`auto-nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/vehicles" 
            className={`auto-nav-link ${isActive('/vehicles') ? 'active' : ''}`}
          >
            Vehicles
          </Link>
          <Link 
            to="/appointments" 
            className={`auto-nav-link ${isActive('/appointments') ? 'active' : ''}`}
          >
            Appointments
          </Link>
          <Link 
            to="/inventory" 
            className={`auto-nav-link ${isActive('/inventory') ? 'active' : ''}`}
          >
            Inventory
          </Link>
          <Link 
            to="/user-messages" 
            className={`auto-nav-link ${isActive('/user-messages') ? 'active' : ''}`}
          >
            Messages
          </Link>
        </div>

        {/* Dashboard Utility Icons */}
        <div className="auto-nav-utils">
          <Link to="/notifications" className="auto-nav-util">🔔</Link>
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;