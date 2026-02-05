import React from 'react';
import DashboardHeader from './DashboardHeader';

const DashboardLayout = ({ children }) => {
  return (
    <div className="dashboard-layout-header-only">
      <DashboardHeader />
      <main className="dashboard-main-full-width">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;