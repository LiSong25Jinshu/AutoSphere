import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { userAPI } from "../../services/api";
import "./Profile.css";

const DealerProfile = () => {
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState("profile");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
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

  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });

  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // ✅ SAVE PROFILE (REAL BACKEND)
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError("");

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
    } catch (err) {
      setSaveError(
        err.response?.data?.message || "Failed to save profile"
      );
    } finally {
      setSaving(false);
    }
  };

  // ✅ PASSWORD CHANGE (REAL BACKEND)
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
      await userAPI.changePassword(
        passwords.current,
        passwords.newPass
      );

      setPasswords({ current: "", newPass: "", confirm: "" });
      setPwSuccess("Password updated successfully");

      setTimeout(() => setPwSuccess(""), 4000);
    } catch (err) {
      setPwError(
        err.response?.data?.message || "Failed to update password"
      );
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setEditing(false);
    setSaveError("");
  };

  return (
    <div className="dealer-profile-page">
      {/* HEADER */}
      <div className="dp-header">
        <div className="dp-avatar">
          {profile.firstName?.[0] || "?"}
          {profile.lastName?.[0] || ""}
        </div>

        <div className="dp-header-info">
          <h1>
            {profile.firstName} {profile.lastName}
          </h1>
          <p>{user?.email} — Dealer</p>
          <span className="dp-badge">Verified Dealer</span>
        </div>

        {activeTab === "profile" && !editing && (
          <button
            className="dp-edit-btn"
            onClick={() => setEditing(true)}
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* STATUS MESSAGES */}
      {saved && (
        <div className="dp-success">Profile saved successfully!</div>
      )}
      {saveError && <div className="dp-error">{saveError}</div>}

      {/* TABS */}
      <div className="dp-tabs">
        {["profile", "security"].map((tab) => (
          <button
            key={tab}
            className={
              "dp-tab" + (activeTab === tab ? " active" : "")
            }
            onClick={() => switchTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="dp-content">
        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <form className="dp-form" onSubmit={handleSave}>
            <div className="dp-section-title">
              Personal Information
            </div>

            <div className="dp-form-row">
              <div className="dp-form-group">
                <label>First Name</label>
                <input
                  value={profile.firstName}
                  disabled={!editing}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      firstName: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="dp-form-group">
                <label>Last Name</label>
                <input
                  value={profile.lastName}
                  disabled={!editing}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      lastName: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="dp-form-row">
              <div className="dp-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled={!editing}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      email: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="dp-form-group">
                <label>Phone</label>
                <input
                  value={profile.phone}
                  disabled={!editing}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      phone: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="dp-form-row">
              <div className="dp-form-group">
                <label>City</label>
                <input
                  value={profile.city}
                  disabled={!editing}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      city: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="dp-form-group">
                <label>State</label>
                <input
                  value={profile.state}
                  disabled={!editing}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      state: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="dp-form-group full">
              <label>Bio</label>
              <textarea
                rows={3}
                value={profile.bio}
                disabled={!editing}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    bio: e.target.value,
                  }))
                }
                placeholder="Tell customers about yourself..."
              />
            </div>

            {editing && (
              <div className="dp-form-actions">
                <button
                  type="button"
                  className="dp-btn-cancel"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="dp-btn-save"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </form>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && (
          <form
            className="dp-form"
            onSubmit={handlePasswordChange}
          >
            <div className="dp-section-title">
              Change Password
            </div>

            {pwError && (
              <div className="dp-error">{pwError}</div>
            )}

            {pwSuccess && (
              <div className="dp-success">{pwSuccess}</div>
            )}

            <div className="dp-form-group full">
              <label>Current Password</label>
              <input
                type="password"
                value={passwords.current}
                onChange={(e) =>
                  setPasswords((p) => ({
                    ...p,
                    current: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="dp-form-group full">
              <label>New Password</label>
              <input
                type="password"
                value={passwords.newPass}
                onChange={(e) =>
                  setPasswords((p) => ({
                    ...p,
                    newPass: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="dp-form-group full">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords((p) => ({
                    ...p,
                    confirm: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="dp-form-actions">
              <button type="submit" className="dp-btn-save">
                Update Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DealerProfile;