import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuthOperations } from '../hooks/useAuthOperations';
import '../pages/public/Auth.css';


const GoogleSignInButton = ({ label = 'Continue with Google' }) => {
  const handleGoogleAuth = () => {
    // Redirect to backend Google OAuth — works when credentials are configured
    window.location.href = '/api/auth/google';
  };

  return (
    <button
      type="button"
      className="btn social google full-width"
      onClick={handleGoogleAuth}
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
};

const RegisterForm = () => {
  const navigate = useNavigate();
  const { isAuthenticated, error, clearError } = useAuth();
  const { handleRegister, isSubmitting } = useAuthOperations();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    adminInviteCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [registrationError, setRegistrationError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component mounts only (not on every formData change)
  useEffect(() => {
    clearError();
    setRegistrationError('');
  }, [clearError]);

  const validateForm = () => {
    const errors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation (optional but if provided, should be valid)
    if (formData.phone && !/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Role validation
    if (!formData.role) {
      errors.role = 'Please select a role';
    }

    // Admin invite code validation
    if (formData.role === 'admin' && !formData.adminInviteCode.trim()) {
      errors.adminInviteCode = 'Admin invite code is required for administrator registration';
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

    // Prepare data for submission (exclude confirmPassword)
    const { confirmPassword, ...submitData } = formData;
    
    const result = await handleRegister(submitData);
    
    if (result.success) {
      if (result.requiresVerification) {
        // Go to OTP verification screen
        navigate('/verify-email', {
          state: { email: result.email, fromRegistration: true },
        });
      } else {
        setRegistrationSuccess(result.message);
        setTimeout(() => navigate('/login', {
          state: { message: 'Registration successful! Please sign in.' },
        }), 2000);
      }
    } else {
      setRegistrationError(result.error);
      setRegistrationSuccess('');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="auth-page auth-page-centered">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join AutoSphere to access vehicle sales, rentals, and services</p>
        </div>

        {(error || registrationError) && (
          <div className="error-message">
            {error || registrationError}
          </div>
        )}

        {registrationSuccess && (
          <div className="success-message">
            {registrationSuccess}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className={`form-input ${validationErrors.firstName ? 'error' : ''}`}
                placeholder="Enter your first name"
                value={formData.firstName}
                onChange={handleInputChange}
                autoComplete="given-name"
                autoFocus
                required
              />
              {validationErrors.firstName && (
                <span className="error-message">{validationErrors.firstName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                className={`form-input ${validationErrors.lastName ? 'error' : ''}`}
                placeholder="Enter your last name"
                value={formData.lastName}
                onChange={handleInputChange}
                autoComplete="family-name"
                required
              />
              {validationErrors.lastName && (
                <span className="error-message">{validationErrors.lastName}</span>
              )}
            </div>
          </div>

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
              required
            />
            {validationErrors.email && (
              <span className="error-message">{validationErrors.email}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number (Optional)</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className={`form-input ${validationErrors.phone ? 'error' : ''}`}
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleInputChange}
                autoComplete="tel"
              />
              {validationErrors.phone && (
                <span className="error-message">{validationErrors.phone}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="role">Account Type</label>
              <select
                id="role"
                name="role"
                className={`form-select ${validationErrors.role ? 'error' : ''}`}
                value={formData.role}
                onChange={handleInputChange}
                required
              >
                <option value="user">Customer</option>
                <option value="dealer">Dealer</option>
                <option value="service_provider">Service Provider</option>
                <option value="admin">Administrator</option>
              </select>
              {validationErrors.role && (
                <span className="error-message">{validationErrors.role}</span>
              )}
            </div>
          </div>

          {/* Admin invite code — only shown when admin role is selected */}
          {formData.role === 'admin' && (
            <div className="form-group admin-invite-group">
              <label htmlFor="adminInviteCode">
                🔐 Admin Invite Code <span className="required">*</span>
              </label>
              <input
                type="password"
                id="adminInviteCode"
                name="adminInviteCode"
                className={`form-input ${validationErrors.adminInviteCode ? 'error' : ''}`}
                placeholder="Enter the admin invite code"
                value={formData.adminInviteCode}
                onChange={handleInputChange}
                autoComplete="off"
                required
              />
              {validationErrors.adminInviteCode && (
                <span className="error-message">{validationErrors.adminInviteCode}</span>
              )}
              <small className="field-hint">
                Admin access is restricted. You need a valid invite code to register as an administrator.
              </small>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className={`form-input ${validationErrors.password ? 'error' : ''}`}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleInputChange}
                  autoComplete="new-password"
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

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={toggleConfirmPasswordVisibility}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <span className="error-message">{validationErrors.confirmPassword}</span>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn primary full-width"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="auth-divider"><span>OR</span></div>

          <GoogleSignInButton label="Sign up with Google" />

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in here
              </Link>
            </p>
            <p style={{ marginTop: '8px' }}>
              Registering as a dealer or service provider?{' '}
              <Link to="/register-provider" className="auth-link">
                Use the business signup →
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;