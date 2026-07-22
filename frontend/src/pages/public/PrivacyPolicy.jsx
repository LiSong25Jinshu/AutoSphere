import './PrivacyPolicy.css';

const PrivacyPolicy = () => (
  <div className="privacy-page">
    <div className="privacy-container">
      <h1>Privacy Policy</h1>
      <p className="privacy-updated">Last updated: April 2026</p>

      <section>
        <h2>1. Who We Are</h2>
        <p>
          AutoSphere ("we", "us", "our") operates the AutoSphere automotive platform.
          This policy explains how we collect, use, and protect your personal data in
          accordance with the General Data Protection Regulation (GDPR).
        </p>
        <p>Data Controller: AutoSphere Ltd · support@autosphere.com</p>
      </section>

      <section>
        <h2>2. Data We Collect</h2>
        <ul>
          <li><strong>Account data:</strong> name, email address, phone number, role</li>
          <li><strong>Usage data:</strong> vehicles viewed, searches performed, bookings made</li>
          <li><strong>Communications:</strong> messages sent through the platform</li>
          <li><strong>Technical data:</strong> IP address, browser type, session tokens</li>
        </ul>
      </section>

      <section>
        <h2>3. Legal Basis for Processing</h2>
        <ul>
          <li><strong>Contract performance</strong> — to provide the service you signed up for</li>
          <li><strong>Legitimate interests</strong> — fraud prevention, platform security</li>
          <li><strong>Consent</strong> — marketing emails, analytics cookies (you can withdraw at any time)</li>
          <li><strong>Legal obligation</strong> — where required by law</li>
        </ul>
      </section>

      <section>
        <h2>4. How We Use Your Data</h2>
        <ul>
          <li>Provide and improve the AutoSphere platform</li>
          <li>Process bookings and facilitate communications</li>
          <li>Send service-related notifications</li>
          <li>Personalise vehicle recommendations (with your consent)</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>

      <section>
        <h2>5. Data Sharing</h2>
        <p>
          We do not sell your personal data. We share data only with:
        </p>
        <ul>
          <li>Dealers and service providers — to fulfil your bookings</li>
          <li>Infrastructure providers — hosting, database (under data processing agreements)</li>
          <li>Law enforcement — when legally required</li>
        </ul>
      </section>

      <section>
        <h2>6. Data Retention</h2>
        <p>
          We retain your account data for as long as your account is active.
          After account deletion, anonymised transaction records may be retained for
          up to 7 years for legal and accounting purposes.
        </p>
      </section>

      <section>
        <h2>7. Your Rights</h2>
        <p>Under GDPR you have the right to:</p>
        <ul>
          <li><strong>Access</strong> — request a copy of your personal data</li>
          <li><strong>Rectification</strong> — correct inaccurate data via your profile settings</li>
          <li><strong>Erasure</strong> — delete your account and personal data</li>
          <li><strong>Portability</strong> — export your data in machine-readable format</li>
          <li><strong>Restriction</strong> — limit how we process your data</li>
          <li><strong>Object</strong> — opt out of marketing and analytics</li>
          <li><strong>Withdraw consent</strong> — at any time via Settings → Privacy</li>
        </ul>
        <p>
          To exercise these rights, visit <strong>Settings → Privacy</strong> in your account,
          or contact us at <a href="mailto:privacy@autosphere.com">privacy@autosphere.com</a>.
        </p>
      </section>

      <section>
        <h2>8. Cookies</h2>
        <p>
          We use cookies for authentication (required) and, with your consent, for analytics
          and personalisation. You can manage cookie preferences via the banner shown on first
          visit or in Settings → Privacy.
        </p>
      </section>

      <section>
        <h2>9. Contact & Complaints</h2>
        <p>
          For privacy questions: <a href="mailto:privacy@autosphere.com">privacy@autosphere.com</a>
        </p>
        <p>
          You have the right to lodge a complaint with your local data protection authority.
        </p>
      </section>
    </div>
  </div>
);

export default PrivacyPolicy;
