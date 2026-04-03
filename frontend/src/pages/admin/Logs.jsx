import { useState } from "react";
import "./Admin.css";

const MOCK_LOGS = [
  { id: 1, type: "auth", level: "info", message: "User alice@example.com logged in", timestamp: "2024-01-20 10:32:15", ip: "192.168.1.1" },
  { id: 2, type: "vehicle", level: "info", message: "New vehicle listing created by dealer bob@autospheremotors.com", timestamp: "2024-01-20 10:28:44", ip: "192.168.1.5" },
  { id: 3, type: "auth", level: "warn", message: "Failed login attempt for unknown@example.com", timestamp: "2024-01-20 10:15:02", ip: "10.0.0.42" },
  { id: 4, type: "booking", level: "info", message: "Service booking #1042 confirmed", timestamp: "2024-01-20 09:55:30", ip: "192.168.1.8" },
  { id: 5, type: "system", level: "error", message: "Database connection timeout — retried successfully", timestamp: "2024-01-20 09:40:11", ip: "server" },
  { id: 6, type: "auth", level: "info", message: "User david@example.com account suspended by admin", timestamp: "2024-01-20 09:22:05", ip: "admin" },
  { id: 7, type: "vehicle", level: "warn", message: "Vehicle listing #234 flagged for review", timestamp: "2024-01-20 08:58:19", ip: "192.168.1.3" },
  { id: 8, type: "system", level: "info", message: "Scheduled cleanup job completed — 12 expired sessions removed", timestamp: "2024-01-20 08:00:00", ip: "server" },
];

const LEVEL_COLORS = { info: "#2196f3", warn: "#ff9800", error: "#f44336" };

const AdminLogs = () => {
  const [levelFilter, setLevelFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = MOCK_LOGS.filter((l) => {
    const matchLevel = levelFilter === "all" || l.level === levelFilter;
    const matchType = typeFilter === "all" || l.type === typeFilter;
    const matchSearch = l.message.toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchType && matchSearch;
  });

  return (
    <div className="admin-sub-page">
      <div className="admin-sub-header">
        <div>
          <h1>System Logs</h1>
          <p>Monitor platform activity and system events</p>
        </div>
        <div className="admin-sub-stats">
          <span className="admin-stat-pill danger">{MOCK_LOGS.filter((l) => l.level === "error").length} Errors</span>
          <span className="admin-stat-pill warn">{MOCK_LOGS.filter((l) => l.level === "warn").length} Warnings</span>
          <span className="admin-stat-pill active">{MOCK_LOGS.filter((l) => l.level === "info").length} Info</span>
        </div>
      </div>

      <div className="admin-controls">
        <input
          type="text"
          placeholder="Search logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search"
        />
        <div className="admin-filters">
          {["all", "info", "warn", "error"].map((l) => (
            <button
              key={l}
              className={"admin-filter-btn" + (levelFilter === l ? " active" : "")}
              onClick={() => setLevelFilter(l)}
            >
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>
        <div className="admin-filters">
          {["all", "auth", "vehicle", "booking", "system"].map((t) => (
            <button
              key={t}
              className={"admin-filter-btn" + (typeFilter === t ? " active" : "")}
              onClick={() => setTypeFilter(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Level</th>
              <th>Type</th>
              <th>Message</th>
              <th>Timestamp</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={log.id}>
                <td>
                  <span className="admin-status-badge" style={{ background: LEVEL_COLORS[log.level] }}>
                    {log.level}
                  </span>
                </td>
                <td>
                  <span className="admin-type-tag">{log.type}</span>
                </td>
                <td className="admin-log-message">{log.message}</td>
                <td className="admin-sub-text">{log.timestamp}</td>
                <td className="admin-sub-text">{log.ip}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-empty">No logs found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminLogs;
