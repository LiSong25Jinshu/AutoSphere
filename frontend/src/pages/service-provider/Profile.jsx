import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { userAPI, serviceAPI } from "../../services/api";
import "./Profile.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DEFAULT_SCHEDULE = DAYS.reduce((acc, day) => {
  acc[day] = { enabled: day !== "Sunday", start: "08:00", end: "18:00" };
  return acc;
}, {});

const ServiceProviderProfile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    bio: user?.bio || "",
  });
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  // Load schedule when availability tab is opened
  useEffect(() => {
    if (activeTab !== "availability") return;
    setScheduleLoading(true);
    serviceAPI.getSchedule()
      .then((res) => {
        if (res.data?.data) setSchedule({ ...DEFAULT_SCHEDULE, ...res.data.data });
      })
      .catch(() => {})
      .finally(() => setScheduleLoading(false));
  }, [activeTab]);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      const res = await userAPI.updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        email: profile.email,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        bio: profile.bio,
      });
      updateUser(res.data?.data || {});
      setEditing(false);
      showSaved();
    } catch (e) {
      setSaveError(e.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleScheduleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await serviceAPI.saveSchedule(schedule);
      showSaved();
    } catch (e) {
      setSaveError(e.response?.data?.message || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    if (passwords.newPass !== passwords.confirm) {
      setPwError("Passwords do not match");
      return;
    }
    if (passwords.newPass.length < 6) {
      setPwError("Password must be at least 6 characters");
      return;
    }
    try {
      await userAPI.changePassword(passwords.current, passwords.newPass);
      setPasswords({ current: "", newPass: "", confirm: "" });
      setPwSuccess("Password updated successfully");
      setTimeout(() => setPwSuccess(""), 4000);
    } catch (e) {
      setPwError(e.response?.data?.message || 'Failed to update password');
    }
  };

  const switchTab = (t) => {
    setActiveTab(t);
    setEditing(false);
    setSaveError('');
  };

  const toggleDay = (day) => {
    setSchedule((s) => ({ ...s, [day]: { ...s[day], enabled: !s[day].enabled } }));
  };

  const updateTime = (day, field, value) => {
    setSchedule((s) => ({ ...s, [day]: { ...s[day], [field]: value } }));
  };

  return (
    <div className="sp-profile-page">
      <div className="sp-header">
        <div className="sp-avatar">
          {profile.firstName?.[0] || '?'}
          {profile.lastName?.[0] || ''}
        </div>
        <div className="sp-header-info">
          <h1>{profile.firstName} {profile.lastName}</h1>
          <p>{user?.email} &mdash; Service Provider</p>
          <span className="sp-badge">Verified Provider</span>
        </div>
        {activeTab === "profile" && !editing && (
          <button className="sp-edit-btn" onClick={() => setEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>

      {saved && <div className="sp-success">Saved successfully!</div>}
      {saveError && <div className="sp-error">{saveError}</div>}

      <div className="sp-tabs">
        {["profile", "availability", "security"].map((t) => (
          <button
            key={t}
            className={"sp-tab" + (activeTab === t ? " active" : "")}
            onClick={() => switchTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="sp-content">
        {activeTab === "profile" && (
          <form className="sp-form" onSubmit={handleSave}>
            <div className="sp-section-title">Personal Information</div>
            <div className="sp-form-row">
              <div className="sp-form-group">
                <label>First Name</label>
                <input
                  value={profile.firstName}
                  disabled={!editing}
                  onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                />
              </div>
              <div className="sp-form-group">
                <label>Last Name</label>
                <input
                  value={profile.lastName}
                  disabled={!editing}
                  onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="sp-form-row">
              <div className="sp-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled={!editing}
                  onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="sp-form-group">
                <label>Phone</label>
                <input
                  value={profile.phone}
                  disabled={!editing}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="sp-form-row">
              <div className="sp-form-group">
                <label>City</label>
                <input
                  value={profile.city}
                  disabled={!editing}
                  onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                />
              </div>
              <div className="sp-form-group">
                <label>State</label>
                <input
                  value={profile.state}
                  disabled={!editing}
                  onChange={(e) => setProfile((p) => ({ ...p, state: e.target.value }))}
                />
              </div>
            </div>
            <div className="sp-form-group full">
              <label>Bio</label>
              <textarea
                rows={3}
                value={profile.bio}
                disabled={!editing}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Tell customers about your services..."
              />
            </div>
            {editing && (
              <div className="sp-form-actions">
                <button type="button" className="sp-btn-cancel" onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="sp-btn-save" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </form>
        )}

        {activeTab === "availability" && (
          <div className="sp-availability">
            <div className="sp-section-title">Weekly Schedule</div>
            <p className="sp-availability-hint">Set your working hours for each day of the week.</p>
            {scheduleLoading ? (
              <p style={{ color: '#9ca3af', padding: '1rem 0' }}>Loading schedule...</p>
            ) : (
              <div className="sp-schedule">
                {DAYS.map((day) => (
                  <div key={day} className={"sp-schedule-row" + (schedule[day].enabled ? "" : " disabled")}>
                    <label className="sp-day-toggle">
                      <input
                        type="checkbox"
                        checked={schedule[day].enabled}
                        onChange={() => toggleDay(day)}
                      />
                      <span className="sp-day-name">{day}</span>
                    </label>
                    {schedule[day].enabled ? (
                      <div className="sp-time-range">
                        <input
                          type="time"
                          value={schedule[day].start}
                          onChange={(e) => updateTime(day, "start", e.target.value)}
                        />
                        <span>to</span>
                        <input
                          type="time"
                          value={schedule[day].end}
                          onChange={(e) => updateTime(day, "end", e.target.value)}
                        />
                      </div>
                    ) : (
                      <span className="sp-closed-label">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="sp-form-actions">
              <button className="sp-btn-save" onClick={handleScheduleSave} disabled={saving || scheduleLoading}>
                {saving ? "Saving..." : "Save Schedule"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <form className="sp-form" onSubmit={handlePasswordChange}>
            <div className="sp-section-title">Change Password</div>
            {pwError && <div className="sp-error">{pwError}</div>}
            {pwSuccess && <div className="sp-success">{pwSuccess}</div>}
            <div className="sp-form-group full">
              <label>Current Password</label>
              <input
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                required
              />
            </div>
            <div className="sp-form-group full">
              <label>New Password</label>
              <input
                type="password"
                value={passwords.newPass}
                onChange={(e) => setPasswords((p) => ({ ...p, newPass: e.target.value }))}
                required
              />
            </div>
            <div className="sp-form-group full">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                required
              />
            </div>
            <div className="sp-form-actions">
              <button type="submit" className="sp-btn-save">
                Update Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ServiceProviderProfile;
