import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { gdprAPI } from '../../services/api';
import './Settings.css';

const UserSettings = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [gdprStatus, setGdprStatus] = useState({ exporting: false, deleting: false, deleteConfirm: '' });
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: true,
      push: false,
      marketing: false,
      dealerMessages: true,
      serviceReminders: true,
      priceAlerts: false
    },
    privacy: {
      profileVisible: true,
      showEmail: false,
      showPhone: false,
      showLocation: true,
      allowDataCollection: false
    },
    preferences: {
      language: 'en',
      timezone: 'America/New_York',
      currency: 'GHS',
      theme: 'light',
      autoSave: true,
      compactView: false,
    },
    account: {
      twoFactorEnabled: false,
      loginNotifications: true,
      sessionTimeout: 60,
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setSaveMessage('');
    try {
      // Save notification preferences to user profile
      const { data } = await import('../../services/api').then(m => m.userAPI.updateProfile({
        notificationPreferences: settings.notifications,
        privacySettings: settings.privacy,
        preferences: settings.preferences,
      }));
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Failed to save settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      setSettings({
        notifications: {
          email: true,
          sms: true,
          push: false,
          marketing: false,
          dealerMessages: true,
          serviceReminders: true,
          priceAlerts: false
        },
        privacy: {
          profileVisible: true,
          showEmail: false,
          showPhone: false,
          showLocation: true,
          allowDataCollection: false
        },
        preferences: {
          language: 'en',
          timezone: 'America/New_York',
          currency: 'GHS',
          theme: 'light',
          autoSave: true,
          compactView: false,
        },
        account: {
          twoFactorEnabled: false,
          loginNotifications: true,
          sessionTimeout: 60,
        },
      });
      setSaveMessage('Settings reset to defaults.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      if (window.confirm('This will permanently delete all your data. Type "DELETE" to confirm.')) {
        // Mock delete - replace with real API call
        alert('Account deletion initiated. You will receive a confirmation email.');
      }
    }
  };

  // ─── GDPR handlers ────────────────────────────────────────────────────────
  const handleExportData = async () => {
    setGdprStatus(s => ({ ...s, exporting: true }));
    try {
      const response = await gdprAPI.exportData();
      const url = URL.createObjectURL(new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `autosphere-data-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export data. Please try again.');
    } finally {
      setGdprStatus(s => ({ ...s, exporting: false }));
    }
  };

  const handleDeleteAccountGdpr = async () => {
    if (gdprStatus.deleteConfirm !== 'DELETE MY ACCOUNT') {
      alert('Please type DELETE MY ACCOUNT exactly to confirm.');
      return;
    }
    setGdprStatus(s => ({ ...s, deleting: true }));
    try {
      await gdprAPI.deleteAccount('DELETE MY ACCOUNT');
      alert('Your account has been deleted. You will be logged out.');
      logout();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete account.');
    } finally {
      setGdprStatus(s => ({ ...s, deleting: false }));
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
    { id: 'security', label: 'Security', icon: '🛡️' },
    { id: 'account', label: 'Account', icon: '👤' }
  ];

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your account preferences and privacy settings</p>
          {saveMessage && (
            <div className={`save-message ${saveMessage.includes('Failed') ? 'error' : 'success'}`}>
              {saveMessage}
            </div>
          )}
        </div>

        <div className="settings-content">
          <div className="settings-sidebar">
            <nav className="settings-nav">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="nav-icon">{tab.icon}</span>
                  <span className="nav-label">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="settings-main">
            {activeTab === 'general' && (
              <div className="settings-section">
                <h2>General Settings</h2>
                <div className="setting-group">
                  <label className="setting-label">Language</label>
                  <select 
                    value={settings.preferences.language}
                    onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}
                    className="setting-select"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>
                <div className="setting-group">
                  <label className="setting-label">Timezone</label>
                  <select 
                    value={settings.preferences.timezone}
                    onChange={(e) => handleSettingChange('preferences', 'timezone', e.target.value)}
                    className="setting-select"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
                <div className="setting-group">
                  <label className="setting-label">Currency</label>
                  <select 
                    value={settings.preferences.currency}
                    onChange={(e) => handleSettingChange('preferences', 'currency', e.target.value)}
                    className="setting-select"
                  >
                    <option value="GHS">GHS (GH₵)</option>
                  </select>
                </div>
                <div className="setting-group">
                  <label className="setting-label">Theme</label>
                  <select 
                    value={settings.preferences.theme}
                    onChange={(e) => handleSettingChange('preferences', 'theme', e.target.value)}
                    className="setting-select"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
                <div className="setting-group">
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={settings.preferences.autoSave}
                      onChange={(e) => handleSettingChange('preferences', 'autoSave', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Auto-save Changes</span>
                  </label>
                  <p className="setting-description">Automatically save your changes without clicking save</p>
                </div>
                <div className="setting-group">
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={settings.preferences.compactView}
                      onChange={(e) => handleSettingChange('preferences', 'compactView', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Compact View</span>
                  </label>
                  <p className="setting-description">Use a more compact layout to show more information</p>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="settings-section">
                <h2>Notification Preferences</h2>
                <div className="setting-group">
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={settings.notifications.email}
                      onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Email Notifications</span>
                  </label>
                  <p className="setting-description">Receive appointment confirmations and updates via email</p>
                </div>
                <div className="setting-group">
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={settings.notifications.sms}
                      onChange={(e) => handleSettingChange('notifications', 'sms', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">SMS Notifications</span>
                  </label>
                  <p className="setting-description">Get text message reminders for upcoming appointments</p>
                </div>
                <div className="setting-group">
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={settings.notifications.push}
                      onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Push Notifications</span>
                  </label>
                  <p className="setting-description">Receive real-time notifications in your browser</p>
                </div>
                <div className="setting-group">
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={settings.notifications.marketing}
                      onChange={(e) => handleSettingChange('notifications', 'marketing', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Marketing Communications</span>
                  </label>
                  <p className="setting-description">Receive promotional offers and service recommendations</p>
                </div>
                <div className="setting-group">
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={settings.notifications.dealerMessages}
                      onChange={(e) => handleSettingChange('notifications', 'dealerMessages', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Dealer Messages</span>
                  </label>
                  <p className="setting-description">Get notified when dealers respond to your inquiries</p>
                </div>
                <div className="setting-group">
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={settings.notifications.serviceReminders}
                      onChange={(e) => handleSettingChange('notifications', 'serviceReminders', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Service Reminders</span>
                  </label>
                  <p className="setting-description">Receive reminders for scheduled maintenance and services</p>
                </div>
                <div className="setting-group">
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={settings.notifications.priceAlerts}
                      onChange={(e) => handleSettingChange('notifications', 'priceAlerts', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Price Alerts</span>
                  </label>
                  <p className="setting-description">Get notified when vehicle prices drop or match your criteria</p>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="settings-section">
                <h2>Privacy Settings</h2>
                <div className="setting-group">
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={settings.privacy.profileVisible}
                      onChange={(e) => handleSettingChange('privacy', 'profileVisible', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Public Profile</span>
                  </label>
                  <p className="setting-description">Allow other users to view your profile information</p>
                </div>
                <div className="setting-group">
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={settings.privacy.showEmail}
                      onChange={(e) => handleSettingChange('privacy', 'showEmail', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Show Email Address</span>
                  </label>
                  <p className="setting-description">Display your email address on your public profile</p>
                </div>
                <div className="setting-group">
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={settings.privacy.showPhone}
                      onChange={(e) => handleSettingChange('privacy', 'showPhone', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Show Phone Number</span>
                  </label>
                  <p className="setting-description">Display your phone number on your public profile</p>
                </div>
                <div className="setting-group">
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={settings.privacy.showLocation}
                      onChange={(e) => handleSettingChange('privacy', 'showLocation', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Show Location</span>
                  </label>
                  <p className="setting-description">Display your general location to help dealers find you</p>
                </div>
                <div className="setting-group">
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={settings.privacy.allowDataCollection}
                      onChange={(e) => handleSettingChange('privacy', 'allowDataCollection', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Allow Data Collection</span>
                  </label>
                  <p className="setting-description">Allow us to collect usage data to improve your experience</p>
                </div>

                {/* GDPR Rights Section */}
                <div className="gdpr-section">
                  <h3>Your Data Rights (GDPR)</h3>
                  <p className="gdpr-intro">
                    Under GDPR you have the right to access, correct, and delete your personal data.
                  </p>

                  <div className="gdpr-action">
                    <div>
                      <strong>Download Your Data</strong>
                      <p>Export a copy of all personal data we hold about you.</p>
                    </div>
                    <button
                      className="btn secondary"
                      onClick={handleExportData}
                      disabled={gdprStatus.exporting}
                    >
                      {gdprStatus.exporting ? 'Exporting…' : '⬇ Export Data'}
                    </button>
                  </div>

                  <div className="gdpr-action gdpr-action--danger">
                    <div>
                      <strong>Delete Account</strong>
                      <p>Permanently delete your account and all associated personal data. This cannot be undone.</p>
                      <input
                        type="text"
                        className="form-input gdpr-confirm-input"
                        placeholder="Type: DELETE MY ACCOUNT"
                        value={gdprStatus.deleteConfirm}
                        onChange={e => setGdprStatus(s => ({ ...s, deleteConfirm: e.target.value }))}
                      />
                    </div>
                    <button
                      className="btn danger"
                      onClick={handleDeleteAccountGdpr}
                      disabled={gdprStatus.deleting || gdprStatus.deleteConfirm !== 'DELETE MY ACCOUNT'}
                    >
                      {gdprStatus.deleting ? 'Deleting…' : '🗑 Delete Account'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="settings-section">
                <h2>Security Settings</h2>
                <div className="security-actions">
                  <div className="security-item">
                    <div className="security-info">
                      <h3>Change Password</h3>
                      <p>Update your account password for better security</p>
                    </div>
                    <button className="btn secondary">Change Password</button>
                  </div>
                  <div className="security-item">
                    <div className="security-info">
                      <h3>Two-Factor Authentication</h3>
                      <p>Add an extra layer of security to your account</p>
                    </div>
                    <button className="btn primary">Enable 2FA</button>
                  </div>
                  <div className="security-item">
                    <div className="security-info">
                      <h3>Login Sessions</h3>
                      <p>Manage your active login sessions</p>
                    </div>
                    <button className="btn secondary">View Sessions</button>
                  </div>
                  <div className="security-item danger">
                    <div className="security-info">
                      <h3>Delete Account</h3>
                      <p>Permanently delete your account and all data</p>
                    </div>
                    <button className="btn danger" onClick={handleDeleteAccount}>Delete Account</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="settings-section">
                <h2>Account Settings</h2>
                <div className="account-info">
                  <div className="info-group">
                    <label>Email Address</label>
                    <p>{user?.email || 'Not provided'}</p>
                  </div>
                  <div className="info-group">
                    <label>Full Name</label>
                    <p>{user?.firstName} {user?.lastName}</p>
                  </div>
                  <div className="info-group">
                    <label>Account Type</label>
                    <p className="role-badge">{user?.role || 'User'}</p>
                  </div>
                  <div className="info-group">
                    <label>Member Since</label>
                    <p>January 2024</p>
                  </div>
                </div>
                
                <div className="setting-group">
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={settings.account.twoFactorEnabled}
                      onChange={(e) => handleSettingChange('account', 'twoFactorEnabled', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Two-Factor Authentication</span>
                  </label>
                  <p className="setting-description">Add an extra layer of security to your account</p>
                </div>
                
                <div className="setting-group">
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={settings.account.loginNotifications}
                      onChange={(e) => handleSettingChange('account', 'loginNotifications', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Login Notifications</span>
                  </label>
                  <p className="setting-description">Get notified when someone logs into your account</p>
                </div>
                
                <div className="setting-group">
                  <label className="setting-label">Session Timeout (minutes)</label>
                  <select 
                    value={settings.account.sessionTimeout}
                    onChange={(e) => handleSettingChange('account', 'sessionTimeout', parseInt(e.target.value))}
                    className="setting-select"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={0}>Never</option>
                  </select>
                </div>
              </div>
            )}

            <div className="settings-actions">
              <button 
                className={`btn primary ${isLoading ? 'loading' : ''}`} 
                onClick={handleSaveSettings}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button className="btn secondary" onClick={handleResetSettings}>
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;