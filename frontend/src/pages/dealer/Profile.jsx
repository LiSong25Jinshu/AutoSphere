import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./Profile.css";

const DealerProfile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    firstName: user?.firstName || "John",
    lastName: user?.lastName || "Dealer",
    email: user?.email || "dealer@autosphere.com",
    phone: user?.phone || "+1 (555) 000-0000",
    dealershipName: "AutoSphere Motors",
    licenseNumber: "DL-2024-001",
    address: "123 Auto Drive",
    city: "Detroit",
    state: "MI",
    website: "www.autospheremotors.com",
    description: "Premium vehicle dealership specializing in quality vehicles.",
    specialties: "Sedans, SUVs, Hybrid Vehicles",
  });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [pwError, setPwError] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) { setPwError("Passwords do not match"); return; }
    if (passwords.newPass.length < 6) { setPwError("Password must be at least 6 characters"); return; }
    setPwError("");
    setPasswords({ current: "", newPass: "", confirm: "" });
    alert("Password updated successfully");
  };

  return (
    <div className="dealer-profile-page">
      <div className="dp-header">
        <div className="dp-avatar">{profile.firstName[0]}{profile.lastName[0]}</div>
        <div className="dp-header-info">
          <h1>{profile.firstName} {profile.lastName}</h1>
          <p>{profile.dealershipName} - Dealer</p>
          <span className="dp-badge">Verified Dealer</span>
        </div>
        {activeTab === "profile" && !editing && (
          <button className="dp-edit-btn" onClick={() => setEditing(true)}>Edit Profile</button>
        )}
      </div>
      {saved && <div className="dp-success">Profile saved successfully!</div>}
      <div className="dp-tabs">
        {["profile", "dealership", "security"].map((t) => (
          <button key={t} className={"dp-tab" + (activeTab === t ? " active" : "")} onClick={() => { setActiveTab(t); setEditing(false); }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="dp-content">
        {activeTab === "profile" && (
          <form className="dp-form" onSubmit={handleSave}>
            <div className="dp-section-title">Personal Information</div>
            <div className="dp-form-row">
              <div className="dp-form-group"><label>First Name</label><input value={profile.firstName} disabled={!editing} onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))} /></div>
              <div className="dp-form-group"><label>Last Name</label><input value={profile.lastName} disabled={!editing} onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))} /></div>
            </div>
            <div className="dp-form-row">
              <div className="dp-form-group"><label>Email</label><input type="email" value={profile.email} disabled={!editing} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} /></div>
              <div className="dp-form-group"><label>Phone</label><input value={profile.phone} disabled={!editing} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} /></div>
            </div>
            {editing && (
              <div className="dp-form-actions">
                <button type="button" className="dp-btn-cancel" onClick={() => setEditing(false)}>Cancel</button>
                <button type="submit" className="dp-btn-save" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
              </div>
            )}
          </form>
        )}
        {activeTab === "dealership" && (
          <form className="dp-form" onSubmit={handleSave}>
            <div className="dp-section-title">Dealership Information</div>
            <div className="dp-form-row">
              <div className="dp-form-group"><label>Dealership Name</label><input value={profile.dealershipName} onChange={(e) => setProfile((p) => ({ ...p, dealershipName: e.target.value }))} /></div>
              <div className="dp-form-group"><label>License Number</label><input value={profile.licenseNumber} onChange={(e) => setProfile((p) => ({ ...p, licenseNumber: e.target.value }))} /></div>
            </div>
            <div className="dp-form-row">
              <div className="dp-form-group"><label>Address</label><input value={profile.address} onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))} /></div>
              <div className="dp-form-group"><label>City</label><input value={profile.city} onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))} /></div>
            </div>
            <div className="dp-form-row">
              <div className="dp-form-group"><label>State</label><input value={profile.state} onChange={(e) => setProfile((p) => ({ ...p, state: e.target.value }))} /></div>
              <div className="dp-form-group"><label>Website</label><input value={profile.website} onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))} /></div>
            </div>
            <div className="dp-form-group full"><label>Specialties</label><input value={profile.specialties} onChange={(e) => setProfile((p) => ({ ...p, specialties: e.target.value }))} /></div>
            <div className="dp-form-group full"><label>Description</label><textarea rows={4} value={profile.description} onChange={(e) => setProfile((p) => ({ ...p, description: e.target.value }))} /></div>
            <div className="dp-form-actions">
              <button type="submit" className="dp-btn-save" disabled={saving}>{saving ? "Saving..." : "Save Dealership Info"}</button>
            </div>
          </form>
        )}
        {activeTab === "security" && (
          <form className="dp-form" onSubmit={handlePasswordChange}>
            <div className="dp-section-title">Change Password</div>
            {pwError && <div className="dp-error">{pwError}</div>}
            <div className="dp-form-group full"><label>Current Password</label><input type="password" value={passwords.current} onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} required /></div>
            <div className="dp-form-group full"><label>New Password</label><input type="password" value={passwords.newPass} onChange={(e) => setPasswords((p) => ({ ...p, newPass: e.target.value }))} required /></div>
            <div className="dp-form-group full"><label>Confirm New Password</label><input type="password" value={passwords.confirm} onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} required /></div>
            <div className="dp-form-actions"><button type="submit" className="dp-btn-save">Update Password</button></div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DealerProfile;
