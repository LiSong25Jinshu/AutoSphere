import { useState, useEffect } from 'react';
import './CookieConsent.css';

const STORAGE_KEY = 'autosphere_cookie_consent';

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [prefs, setPrefs] = useState({
    functional: true,   // always on
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) setVisible(true);
  }, []);

  const save = (preferences) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...preferences,
      savedAt: new Date().toISOString(),
    }));
    setVisible(false);

    // Sync to backend if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      import('../services/api').then(({ gdprAPI }) => {
        gdprAPI.saveConsent(preferences).catch(() => {});
      });
    }
  };

  const acceptAll = () => save({ functional: true, analytics: true, marketing: true });
  const rejectAll = () => save({ functional: true, analytics: false, marketing: false });
  const saveCustom = () => save(prefs);

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <div className="cookie-banner__content">
        <div className="cookie-banner__text">
          <strong>We use cookies</strong>
          <p>
            AutoSphere uses cookies to provide essential functionality and improve your experience.
            You can choose which cookies to allow.{' '}
            <a href="/privacy-policy" className="cookie-banner__link">Privacy Policy</a>
          </p>
        </div>

        {showDetails && (
          <div className="cookie-banner__details">
            <label className="cookie-option">
              <input type="checkbox" checked disabled />
              <span>
                <strong>Functional (required)</strong>
                <small>Login sessions, security, core features</small>
              </span>
            </label>
            <label className="cookie-option">
              <input
                type="checkbox"
                checked={prefs.analytics}
                onChange={e => setPrefs(p => ({ ...p, analytics: e.target.checked }))}
              />
              <span>
                <strong>Analytics</strong>
                <small>Understand how you use the site to improve it</small>
              </span>
            </label>
            <label className="cookie-option">
              <input
                type="checkbox"
                checked={prefs.marketing}
                onChange={e => setPrefs(p => ({ ...p, marketing: e.target.checked }))}
              />
              <span>
                <strong>Marketing</strong>
                <small>Personalised vehicle recommendations and offers</small>
              </span>
            </label>
          </div>
        )}

        <div className="cookie-banner__actions">
          <button className="cookie-btn cookie-btn--secondary" onClick={rejectAll}>
            Reject All
          </button>
          <button
            className="cookie-btn cookie-btn--secondary"
            onClick={() => setShowDetails(v => !v)}
          >
            {showDetails ? 'Hide Options' : 'Manage Preferences'}
          </button>
          {showDetails ? (
            <button className="cookie-btn cookie-btn--primary" onClick={saveCustom}>
              Save Preferences
            </button>
          ) : (
            <button className="cookie-btn cookie-btn--primary" onClick={acceptAll}>
              Accept All
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
