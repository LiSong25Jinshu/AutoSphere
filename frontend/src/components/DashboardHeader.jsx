import React from 'react';
import { Link } from 'react-router-dom';
import UserDropdown from './UserDropdown';

const DashboardHeader = () => {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header-content">
        {/* Left side - could contain breadcrumbs or page title */}
        <div className="dashboard-header-left">
          {/* This space can be used for breadcrumbs or page titles */}
        </div>
        
        {/* Right side - Actions */}
        <div className="dashboard-header-actions">
          <Link to="/notifications" className="dashboard-header-action" title="Notifications">
            🔔
          </Link>
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;