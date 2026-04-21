import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuthOperations } from '../hooks/useAuthOperations';
import '../pages/public/Auth.css';

const GoogleSignInButton = ({ label = 'Continue with Google' }) => (
  <button
    type="button"
    className="btn social google full-width"
    onClick={() => { window.location.href = '/api/auth/google'; }}
    aria-label={label}
  >
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" style={{ marginRight: '8px', flexShrink: 0 }}>
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
    </svg>
    {label}
  </button>
);

const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, error, clearError } = useAuth();
  const { handleLogin, isSubmitting } = useAuthOperations();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname;
      const roleHome = {
        user: '/dashboard',
        dealer: '/dealer-dashboard',
        service_provider: '/service-provider-dashboard',
        admin: '/admin-dashboard',
      };
      const dest = from && from !== '/login' ? from : (roleHome[user?.role] || '/dashboard');
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, navigate, location, user]);

  useEffect(() => {
    clearError();
    setLoginError('');
  }, [clearError]);

  const validateForm = () => {
    const errors = {};
    if (!formData.email) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Please enter a valid email address';
    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) setValidationErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const result = await handleLogin(formData);
    if (!result.success) setLoginError(result.error);
  };

  return (
    <div className="auth-page auth-page-centered">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Sign In</h1>
          <p>Welcome back to AutoSphere</p>
        </div>

        {(error || loginError) && (
          <div className="error-message">{error || loginError}</div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email" id="email" name="email"
              className={`form-input ${validationErrors.email ? 'error' : ''}`}
              placeholder="Enter your email"
              value={formData.email} onChange={handleInputChange}
              autoComplete="email" autoFocus required
            />
            {validationErrors.email && <span className="error-message">{validationErrors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'} id="password" name="password"
                className={`form-input ${validationErrors.password ? 'error' : ''}`}
                placeholder="Enter your password"
                value={formData.password} onChange={handleInputChange}
                autoComplete="current-password" required
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {validationErrors.password && <span className="error-message">{validationErrors.password}</span>}
          </div>

          <button type="submit" className="btn primary full-width" disabled={isSubmitting}>
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="form-options">
            <Link to="/forgot-password" className="forgot-link">Forgot your password?</Link>
          </div>

          <div className="auth-divider"><span>OR</span></div>

          <GoogleSignInButton />

          <div className="auth-footer">
            <p>Don't have an account?{' '}<Link to="/register" className="auth-link">Sign up here</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
