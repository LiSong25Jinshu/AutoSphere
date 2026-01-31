import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const sidebarItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/vehicles', label: 'Vehicles', icon: '🚗' },
    { path: '/ai-car-finder', label: 'AI Car Finder', icon: '🤖' },
    { path: '/appointments', label: 'Appointments', icon: '📅' },
    { path: '/inventory', label: 'Inventory', icon: '📦' },
    { path: '/user-messages', label: 'Messages', icon: '💬' },
    { path: '/notifications', label: 'Notifications', icon: '🔔' },
    { path: '/profile', label: 'Profile', icon: '👤' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  // Add admin-specific items
  if (user?.role === 'admin') {
    sidebarItems.splice(1, 0, { path: '/admin-dashboard', label: 'Admin Dashboard', icon: '🛠️' });
    sidebarItems.splice(2, 0, { path: '/jobs', label: 'Jobs', icon: '💼' });
  }

  return (
    <aside className="dashboard-sidebar">
      {/* Logo in Sidebar */}
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo">
          AutoSphere
        </Link>
      </div>
      
      <div className="sidebar-content">
        <nav className="sidebar-nav">
          {sidebarItems.map((item) => (
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