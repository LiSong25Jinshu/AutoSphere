import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuthOperations } from '../hooks/useAuthOperations';
import GoogleLoginButton from './GoogleLoginButton';
import '../pages/public/Auth.css';

const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, error, clearError } = useAuth();
  const { handleLogin, isSubmitting } = useAuthOperations();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [loginError, setLoginError] = useState('');
  const [emailNotVerified, setEmailNotVerified] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear errors when component mounts or form data changes
  useEffect(() => {
    clearError();
    setLoginError('');
  }, [clearError, formData]);

  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setEmailNotVerified(false);
    const result = await handleLogin(formData);
    
    if (!result.success) {
      setLoginError(result.error);
      
      // Check if error is related to email verification
      if (result.error && (
        result.error.toLowerCase().includes('verify') || 
        result.error.toLowerCase().includes('verification') ||
        result.error.toLowerCase().includes('not verified')
      )) {
        setEmailNotVerified(true);
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Sign In</h1>
            <p>Welcome back to AutoSphere</p>
          </div>

          {(error || loginError) && (
            <div className="error-message">
              {error || loginError}
              {emailNotVerified && (
                <div style={{ marginTop: '10px' }}>
                  <Link 
                    to={`/verify-email?email=${encodeURIComponent(formData.email)}`}
                    className="auth-link"
                    style={{ fontSize: '0.9em' }}
                  >
                    Click here to resend verification email
                  </Link>
                </div>
              )}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-input ${validationErrors.email ? 'error' : ''}`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                autoComplete="email"
                autoFocus
                required
              />
              {validationErrors.email && (
                <span className="error-message">{validationErrors.email}</span>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className={`form-input ${validationErrors.password ? 'error' : ''}`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {validationErrors.password && (
                <span className="error-message">{validationErrors.password}</span>
              )}
            </div>

            <button
              type="submit"
              className="btn primary full-width"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="auth-divider">
              <span>OR</span>
            </div>

            <GoogleLoginButton 
              disabled={isSubmitting}
            />

            <div className="form-options">
              <Link to="/forgot-password" className="forgot-link">
                Forgot your password?
              </Link>
            </div>

            <div className="auth-footer">
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="auth-link">
                  Sign up here
                </Link>
              </p>
            </div>
          </form>
        </div>

        <div className="auth-info">
          <h2>Join AutoSphere</h2>
          <ul>
            <li>Browse and purchase vehicles from trusted dealers</li>
            <li>Book automotive services with certified providers</li>
            <li>Get AI-powered vehicle recommendations</li>
            <li>Connect with automotive professionals</li>
            <li>Access exclusive deals and offers</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;