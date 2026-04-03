import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthOperations } from '../hooks/useAuthOperations';
import '../pages/public/Auth.css';

const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword, isSubmitting } = useAuthOperations();

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [resetError, setResetError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const t = searchParams.get('token');
    if (!t) setResetError('Invalid or missing reset token. Please request a new password reset.');
    else setToken(t);
  }, [searchParams]);

  const validate = () => {
    const e = {};
    if (!formData.password) e.password = 'Password is required';
    else if (formData.password.length < 8) e.password = 'At least 8 characters required';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password))
      e.password = 'Must contain uppercase, lowercase, and a number';
    if (!formData.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setValidationErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (validationErrors[name]) setValidationErrors(p => ({ ...p, [name]: '' }));
    setResetError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) { setResetError('Invalid token. Please request a new password reset.'); return; }
    if (!validate()) return;
    const result = await resetPassword(token, formData.password);
    if (result.success) {
      setSuccessMessage(result.message || 'Password reset successfully!');
      setTimeout(() => navigate('/login', { state: { message: 'Password reset! Please sign in.' } }), 2000);
    } else {
      setResetError(result.error);
    }
  };

  return (
    <div className="auth-page auth-page-centered">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Set New Password</h1>
          <p>Enter your new password below</p>
        </div>

        {resetError && <div className="error-message">{resetError}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password" name="password"
                className={`form-input ${validationErrors.password ? 'error' : ''}`}
                placeholder="Create a new password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                autoFocus
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {validationErrors.password && <span className="error-message">{validationErrors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword" name="confirmPassword"
                className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
                placeholder="Confirm your new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label="Toggle confirm password visibility">
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {validationErrors.confirmPassword && <span className="error-message">{validationErrors.confirmPassword}</span>}
          </div>

          <button type="submit" className="btn primary full-width" disabled={isSubmitting || !token}>
            {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
          </button>

          <div className="auth-footer">
            <p><Link to="/login" className="auth-link">Back to Sign In</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
