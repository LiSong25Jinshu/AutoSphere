import { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Profile.css';

const ServiceProviderProfilePage = () => {
  const { user, login } = useAuth();
  const [tab, setTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    businessName: '', businessType: 'car_wash', address: '',
    city: '', state: '', description: '',
  });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        businessName: user.businessName || '',
        businessType: user.businessType || 'car_wash',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        description: user.description || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await userAPI.updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || null,
        email: form.email,
      });
      const updated = res.data?.data || res.data;
      const token = localStorage.getItem('token');
      if (updated && token) {
        localStorage.setItem('user', JSON.stringify({ ...user, ...updated }));
      }
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleBusinessSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await userAPI.updateProfile({
        businessName: form.businessName || null,
        businessType: form.businessType || null,
        businessDescription: form.description || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
      });
      const updated = res.data?.data || res.data;
      const token = localStorage.getItem('token');
      if (updated && token) {
        localStorage.setItem('user', JSON.stringify({ ...user, ...updated }));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save business info');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    if (passwords.newPass !== passwords.confirm) { setPwError('Passwords do not match'); return; }
    if (passwords.newPass.length < 6) { setPwError('Password must be at least 6 characters'); return; }
    try {
      await userAPI.changePassword(passwords.current, passwords.newPass);
      setPasswords({ current: '', newPass: '', confirm: '' });
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 3000);
    } catch (e) {
      setPwError(e.response?.data?.message || 'Failed to update password');
    }
  };

  const initials = `${form.firstName?.[0] || ''}${form.lastName?.[0] || ''}`.toUpperCase() || 'SP';

  return (
    <div className="sp-profile-page">
      <div className="sp-profile-header">
        <div className="sp-profile-avatar">{initials}</div>
        <div className="sp-profile-header-info">
          <h1>{form.firstName} {form.lastName}</h1>
          <p>{form.businessName || 'Service Provider'}</p>
          <span className="sp-profile-badge">Service Provider</span>
        </div>
        {tab === 'profile' && !editing && (
          <button className="sp-profile-edit-btn" onClick={() => setEditing(true)}>Edit Profile</button>
        )}
      </div>

      {saved && <div className="sp-profile-success">Profile saved successfully!</div>}
      {error && <div className="sp-profile-error">{error}</div>}

      <div className="sp-profile-tabs">
        {['profile', 'business', 'security'].map((t) => (
          <button key={t}
            className={'sp-profile-tab' + (tab === t ? ' active' : '')}
            onClick={() => { setTab(t); setEditing(false); setError(''); }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="sp-profile-content">
        {tab === 'profile' && (
          <form className="sp-profile-form" onSubmit={handleSave}>
            <div className="sp-profile-section-title">Personal Information</div>
            <div className="sp-profile-row">
              <div className="sp-profile-group">
                <label>First Name</label>
                <input name="firstName" value={form.firstName} disabled={!editing} onChange={handleChange} />
              </div>
              <div className="sp-profile-group">
                <label>Last Name</label>
                <input name="lastName" value={form.lastName} disabled={!editing} onChange={handleChange} />
              </div>
            </div>
            <div className="sp-profile-row">
              <div className="sp-profile-group">
                <label>Email</label>
                <input name="email" type="email" value={form.email} disabled={!editing} onChange={handleChange} />
              </div>
              <div className="sp-profile-group">
                <label>Phone</label>
                <input name="phone" value={form.phone} disabled={!editing} onChange={handleChange} placeholder="+1 (555) 000-0000" />
              </div>
            </div>
            {editing && (
              <div className="sp-profile-actions">
                <button type="button" className="sp-btn-cancel" onClick={() => setEditing(false)}>Cancel</button>
                <button type="submit" className="sp-btn-save" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            )}
          </form>
        )}

        {tab === 'business' && (
          <form className="sp-profile-form" onSubmit={handleSave}>
            <div className="sp-profile-section-title">Business Information</div>
            <div className="sp-profile-row">
              <div className="sp-profile-group">
                <label>Business Name</label>
                <input name="businessName" value={form.businessName} onChange={handleChange} placeholder="e.g. QuickFix Auto" />
              </div>
              <div className="sp-profile-group">
                <label>Business Type</label>
                <select name="businessType" value={form.businessType} onChange={handleChange}>
                  <option value="car_wash">Car Wash</option>
                  <option value="maintenance">Maintenance & Repair</option>
                  <option value="both">Car Wash & Maintenance</option>
                </select>
              </div>
            </div>
            <div className="sp-profile-row">
              <div className="sp-profile-group">
                <label>Address</label>
                <input name="address" value={form.address} onChange={handleChange} placeholder="123 Main St" />
              </div>
              <div className="sp-profile-group">
                <label>City</label>
                <input name="city" value={form.city} onChange={handleChange} placeholder="Detroit" />
              </div>
            </div>
            <div className="sp-profile-group">
              <label>State</label>
              <input name="state" value={form.state} onChange={handleChange} placeholder="MI" style={{ maxWidth: 120 }} />
            </div>
            <div className="sp-profile-group full">
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4}
                placeholder="Describe your services..." />
            </div>
            <div className="sp-profile-actions">
              <button type="submit" className="sp-btn-save" disabled={saving}>{saving ? 'Saving...' : 'Save Business Info'}</button>
            </div>
          </form>
        )}

        {tab === 'security' && (
          <form className="sp-profile-form" onSubmit={handlePasswordChange}>
            <div className="sp-profile-section-title">Change Password</div>
            {pwError && <div className="sp-profile-error">{pwError}</div>}
            {pwSaved && <div className="sp-profile-success">Password updated successfully!</div>}
            <div className="sp-profile-group full">
              <label>Current Password</label>
              <input type="password" value={passwords.current}
                onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} required />
            </div>
            <div className="sp-profile-group full">
              <label>New Password</label>
              <input type="password" value={passwords.newPass}
                onChange={(e) => setPasswords((p) => ({ ...p, newPass: e.target.value }))} required />
            </div>
            <div className="sp-profile-group full">
              <label>Confirm New Password</label>
              <input type="password" value={passwords.confirm}
                onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} required />
            </div>
            <div className="sp-profile-actions">
              <button type="submit" className="sp-btn-save">Update Password</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ServiceProviderProfilePage;
