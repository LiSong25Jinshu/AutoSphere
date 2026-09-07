import { Link } from 'react-router-dom';

/**
 * Shown to dealers and service providers whose application is still awaiting
 * admin review.  They can log out, read the FAQ, or contact support.
 */
const AccountPending = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    fontFamily: 'Arial, sans-serif',
    padding: '24px',
  }}>
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      padding: '48px 40px',
      maxWidth: '520px',
      width: '100%',
      textAlign: 'center',
    }}>
      {/* Icon */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: '#fff7e6', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
        fontSize: 36,
      }}>
        ⏳
      </div>

      <h1 style={{ fontSize: '1.75rem', color: '#1a1a1a', margin: '0 0 12px' }}>
        Application Under Review
      </h1>

      <p style={{ color: '#555', lineHeight: 1.7, margin: '0 0 24px' }}>
        Thank you for registering with <strong>AutoSphere</strong>. Your dealer / service provider
        application has been submitted and is currently being reviewed by our admin team.
      </p>

      <div style={{
        background: '#fffbeb',
        border: '1px solid #fcd34d',
        borderRadius: '10px',
        padding: '16px 20px',
        marginBottom: '28px',
        textAlign: 'left',
      }}>
        <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#92400e' }}>What happens next?</p>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#78350f', lineHeight: 1.8, fontSize: '14px' }}>
          <li>Our team typically reviews applications within <strong>1–2 business days</strong>.</li>
          <li>You will receive an email notification once the review is complete.</li>
          <li>If approved, you can log in immediately and access your dashboard.</li>
          <li>If additional information is needed, support will contact you directly.</li>
        </ul>
      </div>

      <p style={{ color: '#888', fontSize: '14px', margin: '0 0 28px' }}>
        Have questions? Email us at{' '}
        <a href="mailto:support@autosphere.com" style={{ color: '#1976d2' }}>
          support@autosphere.com
        </a>
      </p>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link
          to="/login"
          style={{
            padding: '11px 24px',
            background: '#1976d2',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '15px',
          }}
        >
          Back to Login
        </Link>
        <a
          href="mailto:support@autosphere.com"
          style={{
            padding: '11px 24px',
            background: '#f5f5f5',
            color: '#333',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '15px',
          }}
        >
          Contact Support
        </a>
      </div>
    </div>
  </div>
);

export default AccountPending;
