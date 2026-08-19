/**
 * AccountSuspended — shown when a user's account has been deactivated by an admin.
 * Reached automatically via the axios interceptor when any API call returns
 * 403 ACCOUNT_DEACTIVATED.
 */
import { Link } from 'react-router-dom';
import './AccountSuspended.css';

const AccountSuspended = () => (
  <div className="sus-page">
    <div className="sus-card">

      {/* Icon */}
      <div className="sus-icon">🚫</div>

      {/* Heading */}
      <h1 className="sus-title">Account Deactivated</h1>

      {/* Message */}
      <p className="sus-msg">
        Your AutoSphere account has been <strong>deactivated</strong> by an administrator.
        You are no longer able to log in or use the platform.
      </p>

      {/* Reason box */}
      <div className="sus-reason-box">
        <p className="sus-reason-title">This can happen because of:</p>
        <ul className="sus-reason-list">
          <li>A violation of AutoSphere's Terms &amp; Conditions</li>
          <li>Suspicious or fraudulent activity detected on your account</li>
          <li>An ongoing review by the compliance team</li>
          <li>A request you submitted to deactivate your account</li>
        </ul>
      </div>

      {/* Contact support */}
      <p className="sus-support">
        If you believe this is a mistake or would like to appeal, please contact our
        support team and include your registered email address.
      </p>

      <a
        href="mailto:support@autosphere.com?subject=Account%20Deactivation%20Appeal"
        className="sus-btn primary"
      >
        ✉️ Contact Support
      </a>

      <Link to="/" className="sus-btn secondary">
        ← Back to Home
      </Link>

    </div>
  </div>
);

export default AccountSuspended;
