import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthOperations } from '../hooks/useAuthOperations';
import '../pages/public/Auth.css';

const ForgotPasswordForm = () => {
  const { requestPasswordReset, isSubmitting } = useAuthOperations();
  
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const [requestError, setRequestError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateEmail = (email) => {
    if (!email) {
      return 'Email is required';
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }
    
    // Clear other messages
    setRequestError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const emailError = validateEmail(email);
    if (emailError) {
      setValidationError(emailError);
      return;
    }

    const result = await requestPasswordReset(email);
    
    if (result.success) {
      setSuccessMessage(result.message);
      setRequestError('');
      setEmail(''); // Clear the form
    } else {
      setRequestError(result.error);
      setSuccessMessage('');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Reset Password</h1>
            <p>Enter your email address and we'll send you a link to reset your password</p>
          </div>

          {requestError && (
            <div className="error-message">
              {requestError}
            </div>
          )}

          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-input ${validationError ? 'error' : ''}`}
                placeholder="Enter your email"
                value={email}
                onChange={handleInputChange}
                autoComplete="email"
                autoFocus
                required
              />
              {validationError && (
                <span className="error-message">{validationError}</span>
              )}
            </div>

            <button
              type="submit"
              className="btn primary full-width"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="auth-footer">
              <p>
                <Link to="/login" className="auth-link">
                  ← Back to Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>

        <div className="auth-info">
          <h2>Password Recovery</h2>
          <ul>
            <li>Enter your registered email address</li>
            <li>Check your inbox for the reset link</li>
            <li>Follow the link to create a new password</li>
            <li>Sign in with your new credentials</li>
            <li>Contact support if you need additional help</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;