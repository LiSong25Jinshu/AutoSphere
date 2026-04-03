import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthOperations } from '../hooks/useAuthOperations';
import '../pages/public/Auth.css';

const ForgotPasswordForm = () => {
  const { requestPasswordReset, isSubmitting } = useAuthOperations();
  
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const [requestError, setRequestError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    setValidationError('');
    setRequestError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setValidationError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setValidationError('Please enter a valid email address'); return; }

    const result = await requestPasswordReset(email);
    if (result.success) {
      setSuccessMessage(result.message || 'If an account exists with this email, a reset link has been sent.');
      setEmail('');
    } else {
      setRequestError(result.error);
    }
  };

  return (
    <div className="auth-page auth-page-centered">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>Enter your email and we'll send you a reset link</p>
        </div>

        {requestError && <div className="error-message">{requestError}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email" id="email" name="email"
              className={`form-input ${validationError ? 'error' : ''}`}
              placeholder="Enter your email"
              value={email} onChange={handleInputChange}
              autoComplete="email" autoFocus required
            />
            {validationError && <span className="error-message">{validationError}</span>}
          </div>

          <button type="submit" className="btn primary full-width" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div className="auth-footer">
            <p><Link to="/login" className="auth-link">← Back to Sign In</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
