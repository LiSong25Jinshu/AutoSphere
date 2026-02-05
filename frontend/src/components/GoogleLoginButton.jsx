import React from 'react';

const GoogleLoginButton = ({ disabled = false }) => {
  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    const backendURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
    window.location.href = `${backendURL}/api/auth/google`;
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={disabled}
      className={`btn social google full-width ${disabled ? 'disabled' : ''}`}
    >
      <img
        src="https://developers.google.com/identity/images/g-logo.png"
        alt="Google"
        style={{ width: '18px', height: '18px' }}
      />
      Continue with Google
    </button>
  );
};

export default GoogleLoginButton;