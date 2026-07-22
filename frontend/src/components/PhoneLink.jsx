/**
 * PhoneLink — tap-to-call phone number component.
 *
 * Renders a tappable phone link that opens the device's calling app directly.
 * On desktop browsers it still opens the tel: protocol (Skype, FaceTime, etc.)
 *
 * Props:
 *  phone    — the phone number string (required)
 *  label    — override display text (optional, defaults to the number itself)
 *  showIcon — whether to show the 📞 icon prefix (default: true)
 *  className — extra CSS class (optional)
 *  size     — 'sm' | 'md' (default 'md')
 */
import './PhoneLink.css';

const PhoneLink = ({ phone, label, showIcon = true, className = '', size = 'md' }) => {
  if (!phone) return null;

  // Strip spaces/dashes for the href so all formats work
  const href = `tel:${phone.replace(/[\s\-().]/g, '')}`;

  return (
    <a
      href={href}
      className={`phone-link phone-link-${size} ${className}`}
      aria-label={`Call ${phone}`}
      onClick={e => e.stopPropagation()}   // don't bubble to parent card click
    >
      {showIcon && <span className="phone-link-icon">📞</span>}
      <span className="phone-link-text">{label || phone}</span>
    </a>
  );
};

export default PhoneLink;
