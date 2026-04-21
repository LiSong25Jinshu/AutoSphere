import { useState, useEffect } from 'react';
import DashboardHeader from './DashboardHeader';
import Sidebar from './Sidebar';

const STORAGE_KEY = 'sidebar-collapsed';

const DashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  };

  return (
    <div className={`dashboard-layout${collapsed ? ' sidebar-is-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />
      <div className="dashboard-body">
        <DashboardHeader onSidebarToggle={handleToggle} sidebarCollapsed={collapsed} />
        <main className="dashboard-main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
