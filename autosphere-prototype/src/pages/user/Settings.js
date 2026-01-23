import React from "react";
import "./Settings.css";

export default function Settings() {
  return (
    <div className="settings-container">
      <div className="settings-card">
        <h1>Settings</h1>
        <p>Manage your profile, preferences, and account settings here.</p>

        <input type="text" placeholder="Full Name" />
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <select>
          <option>Customer</option>
          <option>Dealer</option>
          <option>Service Provider</option>
          <option>Admin</option>
        </select>

        <button className="settings-btn">Update Settings</button>
      </div>
    </div>
  );
}
