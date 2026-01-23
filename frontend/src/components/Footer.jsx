import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import { 
  CarIcon, 
  ServiceIcon, 
  MessageIcon
} from './icons/AutoSphereIcons';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Services',
      links: [
        { name: 'Vehicle Marketplace', path: '/vehicles' },
        { name: 'Service Booking', path: '/services' },
        { name: 'Real-time Messaging', path: '/messages' }
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About AutoSphere', path: '/about' },
        { name: 'Contact Us', path: '/contact' },
        { name: 'Careers', path: '/careers' }
      ]
    },
    {
      title: 'Support',
      links: [
        { name: 'Help Center', path: '/help' },
        { name: 'FAQ', path: '/faq' },
        { name: 'Live Chat', path: '/chat' }
      ]
    }
  ];

  const socialLinks = [
    { name: 'Facebook', url: 'https://facebook.com/autosphere', icon: '📘' },
    { name: 'Twitter', url: 'https://twitter.com/autosphere', icon: '🐦' },
    { name: 'LinkedIn', url: 'https://linkedin.com/company/autosphere', icon: '💼' },
    { name: 'Instagram', url: 'https://instagram.com/autosphere', icon: '📷' }
  ];

  return (
    <footer className="autosphere-footer-simple">
      <div className="autosphere-footer-main">
        <div className="autosphere-container">
          {/* Footer Brand Section */}
          <div className="autosphere-footer-brand">
            <div className="autosphere-footer-logo">
              <CarIcon size={32} className="autosphere-footer-logo-icon" />
              <h3 className="autosphere-footer-logo-text">AutoSphere</h3>
            </div>
            <p className="autosphere-footer-description">
              Your complete automotive platform for buying, selling, and servicing vehicles.
            </p>

            {/* Social Links */}
            <div className="autosphere-footer-social">
              <h4 className="autosphere-footer-social-title">Follow Us</h4>
              <div className="autosphere-footer-social-links">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="autosphere-footer-social-link"
                    aria-label={`Follow us on ${social.name}`}
                  >
                    <span className="autosphere-footer-social-icon">{social.icon}</span>
                    <span className="autosphere-footer-social-name">{social.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Links Sections */}
          <div className="autosphere-footer-sections">
            {footerSections.map((section, index) => (
              <div key={index} className="autosphere-footer-section">
                <h4 className="autosphere-footer-section-title">{section.title}</h4>
                <ul className="autosphere-footer-section-links">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex} className="autosphere-footer-link-item">
                      <Link to={link.path} className="autosphere-footer-link">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="autosphere-footer-bottom">
        <div className="autosphere-container">
          <div className="autosphere-footer-bottom-content">
            <div className="autosphere-footer-copyright">
              <p className="autosphere-footer-copyright-text">
                © {currentYear} AutoSphere. All rights reserved.
              </p>
            </div>
            <div className="autosphere-footer-bottom-links">
              <Link to="/privacy" className="autosphere-footer-bottom-link">Privacy</Link>
              <Link to="/terms" className="autosphere-footer-bottom-link">Terms</Link>
              <Link to="/contact" className="autosphere-footer-bottom-link">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;