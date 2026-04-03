import { useState } from 'react';
import './Admin.css';
import './SystemSettings.css';

const SECTIONS = ['General', 'Email', 'Security', 'Notifications', 'Maintenance'];

const AdminSystemSettings = () => {
  const [activeSection, setActiveSection] = useState('General');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [general, setGeneral] = useState({
    siteName: 'AutoSphere',
    siteUrl: 'https://autosphere.com',
    supportEmail: 'support@autosphere.com',
    maxUploadSizeMB: 10,
    defaultCurrency: 'USD',
    timezone: 'America/New_York',
  });

  const [email, setEmail] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    fromName: 'AutoSphere',
    fromEmail: 'noreply@autosphere.com',
    enableEmailVerification: true,
    enableBookingEmails: true,
    enableMarketingEmails: false,
  });

  const [security, setSecurity] = useState({
    requireEmailVerification: true,
    sessionTimeoutHours: 24,
    maxLoginAttempts: 5,
    enableGoogleOAuth: true,
    enableRateLimit: true,
    rateLimitWindowMinutes: 15,
    rateLimitMaxRequests: 100,
  });

  const [notifications, setNotifications] = useState({
    enablePushNotifications: false,
    enableEmailNotifications: true,
    enableBookingAlerts: true,
    enableMessageAlerts: true,
    enableSystemAlerts: true,
  });

  const [maintenance, setMaintenance] = useState({
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.',
    enableDebugLogs: false,
    logRetentionDays: 30,
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const Field = ({ label, children }) => (
    <div className="ss-field">
      <label className="ss-label">{label}</label>
      {children}
    </div>
  );

  const Toggle = ({ label, checked, onChange, hint }) => (
    <div className="ss-toggle-row">
      <div>
        <div className="ss-toggle-label">{label}</div>
        {hint && <div className="ss-toggle-hint">{hint}</div>}
      </div>
      <label className="ss-toggle">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="ss-toggle-slider" />
      </label>
    </div>
  );

  return (
    <div className="admin-sub-page ss-page">
      <div className="admin-sub-header">
        <div>
          <h1>System Settings</h1>
          <p>Configure platform-wide settings and preferences</p>
        </div>
        <button className="ss-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {saved && <div className="ss-saved">Settings saved successfully!</div>}

      <div className="ss-layout">
        <nav className="ss-nav">
          {SECTIONS.map((s) => (
            <button key={s} className={'ss-nav-btn' + (activeSection === s ? ' active' : '')}
              onClick={() => setActiveSection(s)}>
              {s}
            </button>
          ))}
        </nav>

        <div className="ss-content">
          {activeSection === 'General' && (
            <div className="ss-section">
              <h2>General Settings</h2>
              <Field label="Site Name">
                <input value={general.siteName} onChange={(e) => setGeneral((g) => ({ ...g, siteName: e.target.value }))} />
              </Field>
              <Field label="Site URL">
                <input value={general.siteUrl} onChange={(e) => setGeneral((g) => ({ ...g, siteUrl: e.target.value }))} />
              </Field>
              <Field label="Support Email">
                <input type="email" value={general.supportEmail} onChange={(e) => setGeneral((g) => ({ ...g, supportEmail: e.target.value }))} />
              </Field>
              <div className="ss-row">
                <Field label="Default Currency">
                  <select value={general.defaultCurrency} onChange={(e) => setGeneral((g) => ({ ...g, defaultCurrency: e.target.value }))}>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </Field>
                <Field label="Max Upload Size (MB)">
                  <input type="number" min={1} max={100} value={general.maxUploadSizeMB}
                    onChange={(e) => setGeneral((g) => ({ ...g, maxUploadSizeMB: Number(e.target.value) }))} />
                </Field>
              </div>
              <Field label="Timezone">
                <select value={general.timezone} onChange={(e) => setGeneral((g) => ({ ...g, timezone: e.target.value }))}>
                  <option value="America/New_York">Eastern (UTC-5)</option>
                  <option value="America/Chicago">Central (UTC-6)</option>
                  <option value="America/Denver">Mountain (UTC-7)</option>
                  <option value="America/Los_Angeles">Pacific (UTC-8)</option>
                  <option value="UTC">UTC</option>
                </select>
              </Field>
            </div>
          )}

          {activeSection === 'Email' && (
            <div className="ss-section">
              <h2>Email Configuration</h2>
              <div className="ss-row">
                <Field label="SMTP Host">
                  <input value={email.smtpHost} onChange={(e) => setEmail((em) => ({ ...em, smtpHost: e.target.value }))} />
                </Field>
                <Field label="SMTP Port">
                  <input type="number" value={email.smtpPort} onChange={(e) => setEmail((em) => ({ ...em, smtpPort: Number(e.target.value) }))} />
                </Field>
              </div>
              <Field label="SMTP Username">
                <input value={email.smtpUser} onChange={(e) => setEmail((em) => ({ ...em, smtpUser: e.target.value }))} placeholder="your@email.com" />
              </Field>
              <div className="ss-row">
                <Field label="From Name">
                  <input value={email.fromName} onChange={(e) => setEmail((em) => ({ ...em, fromName: e.target.value }))} />
                </Field>
                <Field label="From Email">
                  <input type="email" value={email.fromEmail} onChange={(e) => setEmail((em) => ({ ...em, fromEmail: e.target.value }))} />
                </Field>
              </div>
              <div className="ss-toggles">
                <Toggle label="Email Verification" checked={email.enableEmailVerification}
                  onChange={(v) => setEmail((em) => ({ ...em, enableEmailVerification: v }))}
                  hint="Require users to verify email on registration" />
                <Toggle label="Booking Confirmation Emails" checked={email.enableBookingEmails}
                  onChange={(v) => setEmail((em) => ({ ...em, enableBookingEmails: v }))} />
                <Toggle label="Marketing Emails" checked={email.enableMarketingEmails}
                  onChange={(v) => setEmail((em) => ({ ...em, enableMarketingEmails: v }))} />
              </div>
            </div>
          )}

          {activeSection === 'Security' && (
            <div className="ss-section">
              <h2>Security Settings</h2>
              <div className="ss-row">
                <Field label="Session Timeout (hours)">
                  <input type="number" min={1} max={720} value={security.sessionTimeoutHours}
                    onChange={(e) => setSecurity((s) => ({ ...s, sessionTimeoutHours: Number(e.target.value) }))} />
                </Field>
                <Field label="Max Login Attempts">
                  <input type="number" min={3} max={20} value={security.maxLoginAttempts}
                    onChange={(e) => setSecurity((s) => ({ ...s, maxLoginAttempts: Number(e.target.value) }))} />
                </Field>
              </div>
              <div className="ss-row">
                <Field label="Rate Limit Window (minutes)">
                  <input type="number" min={1} value={security.rateLimitWindowMinutes}
                    onChange={(e) => setSecurity((s) => ({ ...s, rateLimitWindowMinutes: Number(e.target.value) }))} />
                </Field>
                <Field label="Rate Limit Max Requests">
                  <input type="number" min={10} value={security.rateLimitMaxRequests}
                    onChange={(e) => setSecurity((s) => ({ ...s, rateLimitMaxRequests: Number(e.target.value) }))} />
                </Field>
              </div>
              <div className="ss-toggles">
                <Toggle label="Require Email Verification" checked={security.requireEmailVerification}
                  onChange={(v) => setSecurity((s) => ({ ...s, requireEmailVerification: v }))} />
                <Toggle label="Google OAuth" checked={security.enableGoogleOAuth}
                  onChange={(v) => setSecurity((s) => ({ ...s, enableGoogleOAuth: v }))}
                  hint="Allow users to sign in with Google" />
                <Toggle label="Rate Limiting" checked={security.enableRateLimit}
                  onChange={(v) => setSecurity((s) => ({ ...s, enableRateLimit: v }))}
                  hint="Protect API endpoints from abuse" />
              </div>
            </div>
          )}

          {activeSection === 'Notifications' && (
            <div className="ss-section">
              <h2>Notification Settings</h2>
              <div className="ss-toggles">
                <Toggle label="Email Notifications" checked={notifications.enableEmailNotifications}
                  onChange={(v) => setNotifications((n) => ({ ...n, enableEmailNotifications: v }))}
                  hint="Send email notifications to users" />
                <Toggle label="Push Notifications" checked={notifications.enablePushNotifications}
                  onChange={(v) => setNotifications((n) => ({ ...n, enablePushNotifications: v }))}
                  hint="Browser push notifications (requires HTTPS)" />
                <Toggle label="Booking Alerts" checked={notifications.enableBookingAlerts}
                  onChange={(v) => setNotifications((n) => ({ ...n, enableBookingAlerts: v }))}
                  hint="Notify users of booking status changes" />
                <Toggle label="Message Alerts" checked={notifications.enableMessageAlerts}
                  onChange={(v) => setNotifications((n) => ({ ...n, enableMessageAlerts: v }))}
                  hint="Notify users of new messages" />
                <Toggle label="System Alerts" checked={notifications.enableSystemAlerts}
                  onChange={(v) => setNotifications((n) => ({ ...n, enableSystemAlerts: v }))}
                  hint="Send system-level notifications to admins" />
              </div>
            </div>
          )}

          {activeSection === 'Maintenance' && (
            <div className="ss-section">
              <h2>Maintenance</h2>
              <div className="ss-toggles">
                <Toggle label="Maintenance Mode" checked={maintenance.maintenanceMode}
                  onChange={(v) => setMaintenance((m) => ({ ...m, maintenanceMode: v }))}
                  hint="Take the site offline for maintenance" />
                <Toggle label="Debug Logging" checked={maintenance.enableDebugLogs}
                  onChange={(v) => setMaintenance((m) => ({ ...m, enableDebugLogs: v }))}
                  hint="Enable verbose debug logs (impacts performance)" />
              </div>
              {maintenance.maintenanceMode && (
                <Field label="Maintenance Message">
                  <textarea rows={3} value={maintenance.maintenanceMessage}
                    onChange={(e) => setMaintenance((m) => ({ ...m, maintenanceMessage: e.target.value }))} />
                </Field>
              )}
              <Field label="Log Retention (days)">
                <input type="number" min={1} max={365} value={maintenance.logRetentionDays}
                  onChange={(e) => setMaintenance((m) => ({ ...m, logRetentionDays: Number(e.target.value) }))} />
              </Field>
              <div className="ss-danger-zone">
                <h3>Danger Zone</h3>
                <div className="ss-danger-actions">
                  <div>
                    <div className="ss-danger-title">Clear Cache</div>
                    <div className="ss-danger-desc">Clear all cached data and sessions</div>
                  </div>
                  <button className="ss-danger-btn" onClick={() => alert('Cache cleared (demo)')}>Clear Cache</button>
                </div>
                <div className="ss-danger-actions">
                  <div>
                    <div className="ss-danger-title">Purge Old Logs</div>
                    <div className="ss-danger-desc">Delete logs older than {maintenance.logRetentionDays} days</div>
                  </div>
                  <button className="ss-danger-btn" onClick={() => alert('Logs purged (demo)')}>Purge Logs</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSystemSettings;
