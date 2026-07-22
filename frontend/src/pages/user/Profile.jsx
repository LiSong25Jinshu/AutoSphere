import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import './Profile.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const UserProfile = () => {
  const { user, token, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    dateOfBirth: '',
    bio: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
        dateOfBirth: user.dateOfBirth || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await axios.put(`${API_URL}/api/users/profile`, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        email: profileData.email,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        zipCode: profileData.zipCode,
        bio: profileData.bio,
        dateOfBirth: profileData.dateOfBirth || undefined,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        updateUser(res.data.data);
        setSuccessMsg('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
        dateOfBirth: user.dateOfBirth || '',
        bio: user.bio || '',
      });
    }
    setIsEditing(false);
    setErrorMsg('');
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar-large">
            {profileData.firstName && profileData.lastName 
              ? `${profileData.firstName[0]}${profileData.lastName[0]}` 
              : '👤'}
          </div>
          <div className="profile-header-info">
            <h1>{profileData.firstName} {profileData.lastName}</h1>
            <p className="profile-email">
              {profileData.email}
              {user?.emailVerified ? (
                <span className="verification-badge verified" title="Email verified">
                  ✓ Verified
                </span>
              ) : (
                <span className="verification-badge unverified" title="Email not verified">
                  ⚠ Not Verified
                </span>
              )}
            </p>
            <span className="profile-role">{user?.role || 'User'}</span>
          </div>
          <div className="profile-actions">
            {!isEditing ? (
              <button 
                className="btn primary"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            ) : (
              <div className="edit-actions">
                <button 
                  className="btn secondary"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  className="btn primary"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-main">
            <div className="profile-section">
              <h2>Personal Information</h2>
              {successMsg && <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>{successMsg}</div>}
              {errorMsg && <div style={{ background: '#ffebee', color: '#d32f2f', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>{errorMsg}</div>}
              <form className="profile-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="form-input"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={profileData.dateOfBirth}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="form-textarea"
                    rows="4"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </form>
            </div>

            <div className="profile-section">
              <h2>Address Information</h2>
              <div className="profile-form">
                <div className="form-group">
                  <label>Street Address</label>
                  <input
                    type="text"
                    name="address"
                    value={profileData.address}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="form-input"
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={profileData.city}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      name="state"
                      value={profileData.state}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>ZIP Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={profileData.zipCode}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-sidebar">
            <div className="profile-stats">
              <h3>Account Stats</h3>
              <div className="stat-item">
                <span className="stat-label">Member Since</span>
                <span className="stat-value">January 2024</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Appointments</span>
                <span className="stat-value">12</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Completed Services</span>
                <span className="stat-value">8</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Average Rating</span>
                <span className="stat-value">⭐ 4.8/5.0</span>
              </div>
            </div>

            <div className="profile-preferences">
              <h3>Preferences</h3>
              <div className="preference-item">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  Email notifications
                </label>
              </div>
              <div className="preference-item">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  SMS reminders
                </label>
              </div>
              <div className="preference-item">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  Marketing emails
                </label>
              </div>
            </div>

            <div className="profile-actions-sidebar">
              <button className="btn secondary full-width">
                Change Password
              </button>
              <button className="btn danger full-width">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;