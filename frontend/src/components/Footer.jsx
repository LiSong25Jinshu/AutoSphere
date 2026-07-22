import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="auto-footer">
      <div className="auto-footer-content">
        <div className="auto-footer-links">
          <Link to="/about" className="auto-footer-link">About</Link>
          <Link to="/contact" className="auto-footer-link">Contact</Link>
          <Link to="/privacy" className="auto-footer-link">Privacy</Link>
          <Link to="/terms" className="auto-footer-link">Terms</Link>
          <Link to="/help" className="auto-footer-link">Support</Link>
        </div>
        <div className="auto-footer-copyright">
          AutoSphere © {currentYear}
        </div>
        <div className="auto-footer-region">
          🌍 Global
        </div>
      </div>
    </footer>
  );
};

export default Footer;