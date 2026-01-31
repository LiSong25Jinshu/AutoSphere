import { Link } from 'react-router-dom';
import './Footer.css';
import { CarIcon } from './icons/AutoSphereIcons';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: 'Facebook', url: 'https://facebook.com/autosphere', icon: '📘' },
    { name: 'Twitter', url: 'https://twitter.com/autosphere', icon: '🐦' },
    { name: 'LinkedIn', url: 'https://linkedin.com/company/autosphere', icon: '💼' },
    { name: 'Instagram', url: 'https://instagram.com/autosphere', icon: '📷' }
  ];

  const contactInfo = {
    phone: '+233 55 008 6700',
    email: 'support@autosphere.com'
  };

  return (
    <footer className="autosphere-footer-compact">
      <div className="autosphere-container">
        <div className="autosphere-footer-content">
          {/* Brand Section */}
          <div className="autosphere-footer-brand">
            <div className="autosphere-footer-logo">
              <CarIcon size={24} className="autosphere-footer-logo-icon" />
              <span className="autosphere-footer-logo-text">AutoSphere</span>
            </div>
            <p className="autosphere-footer-tagline">
              Your complete automotive platform
            </p>
          </div>

          {/* Quick Links */}
          <div className="autosphere-footer-links">
            <Link to="/vehicles" className="autosphere-footer-link">Vehicles</Link>
            <Link to="/about" className="autosphere-footer-link">About</Link>
            <Link to="/contact" className="autosphere-footer-link">Contact</Link>
            <Link to="/help" className="autosphere-footer-link">Help</Link>
          </div>

          {/* Contact & Social */}
          <div className="autosphere-footer-contact">
            <div className="autosphere-footer-contact-info">
              <a href={`tel:${contactInfo.phone}`} className="autosphere-footer-contact-link">
                📞 {contactInfo.phone}
              </a>
              <a href={`mailto:${contactInfo.email}`} className="autosphere-footer-contact-link">
                📧 {contactInfo.email}
              </a>
            </div>
            <div className="autosphere-footer-social">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="autosphere-footer-social-link"
                  aria-label={`Follow us on ${social.name}`}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <div className="autosphere-footer-copyright">
            <p>© {currentYear} AutoSphere</p>
            <div className="autosphere-footer-legal">
              <Link to="/privacy" className="autosphere-footer-legal-link">Privacy</Link>
              <Link to="/terms" className="autosphere-footer-legal-link">Terms</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;