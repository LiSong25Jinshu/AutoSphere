import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaTachometerAlt, FaCar, FaCalendarAlt, FaEnvelope, FaUserCog, FaSignOutAlt, FaRobot, FaTools, FaUsers, FaClipboardCheck, FaChartLine, FaBars } from "react-icons/fa";
import "./Sidebar.css";

export default function Sidebar({ role }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Collapse Button */}
      <div className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
        <FaBars />
      </div>

      <h2 className="sidebar-logo">{!collapsed && "AutoSphere"}</h2>

      <ul className="sidebar-menu">
        <li className={isActive("/dashboard") ? "active" : ""}>
          <Link to="/dashboard"><FaTachometerAlt /> {!collapsed && "Dashboard"}</Link>
        </li>
        <li className={isActive("/notifications") ? "active" : ""}>
          <Link to="/notifications"><FaClipboardCheck /> {!collapsed && "Notifications"}</Link>
        </li>
        <li className={isActive("/settings") ? "active" : ""}>
          <Link to="/settings"><FaUserCog /> {!collapsed && "Settings"}</Link>
        </li>
        <li>
          <Link to="/" onClick={() => console.log("Logging out")}><FaSignOutAlt /> {!collapsed && "Log Out"}</Link>
        </li>

        <hr />

        {role === "customer" && (
          <>
            <li className={isActive("/AICarFinder") ? "active" : ""}>
              <Link to="/AICarFinder"><FaRobot /> {!collapsed && "AI Car Finder"}</Link>
            </li>
            <li className={isActive("/appointments") ? "active" : ""}>
              <Link to="/appointments"><FaCalendarAlt /> {!collapsed && "My Appointments"}</Link>
            </li>
            <li className={isActive("/messages") ? "active" : ""}>
              <Link to="/messages"><FaEnvelope /> {!collapsed && "Messages"}</Link>
            </li>
          </>
        )}

        {role === "dealer" && (
          <>
            <li className={isActive("/appointments") ? "active" : ""}>
              <Link to="/appointments"><FaCalendarAlt /> {!collapsed && "Pending Appointments"}</Link>
            </li>
            <li className={isActive("/messages") ? "active" : ""}>
              <Link to="/messages"><FaEnvelope /> {!collapsed && "Customer Messages"}</Link>
            </li>
            <li className={isActive("/inventory") ? "active" : ""}>
              <Link to="/inventory"><FaCar /> {!collapsed && "Manage Inventory"}</Link>
            </li>
          </>
        )}

        {role === "serviceProvider" && (
          <>
            <li className={isActive("/jobs") ? "active" : ""}>
              <Link to="/jobs"><FaTools /> {!collapsed && "Upcoming Jobs"}</Link>
            </li>
            <li className={isActive("/requests") ? "active" : ""}>
              <Link to="/requests"><FaClipboardCheck /> {!collapsed && "Customer Requests"}</Link>
            </li>
            <li className={isActive("/messages") ? "active" : ""}>
              <Link to="/messages"><FaEnvelope /> {!collapsed && "Messages"}</Link>
            </li>
          </>
        )}

        {role === "admin" && (
          <>
            <li className={isActive("/users") ? "active" : ""}>
              <Link to="/users"><FaUsers /> {!collapsed && "Manage Users"}</Link>
            </li>
            <li className={isActive("/approvals") ? "active" : ""}>
              <Link to="/approvals"><FaClipboardCheck /> {!collapsed && "Pending Approvals"}</Link>
            </li>
            <li className={isActive("/reports") ? "active" : ""}>
              <Link to="/reports"><FaChartLine /> {!collapsed && "Reports & Analytics"}</Link>
            </li>
          </>
        )}
      </ul>
    </div>
  );
}
