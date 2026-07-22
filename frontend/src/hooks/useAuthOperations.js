import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

export const useAuthOperations = () => {
  const { login, register, logout, clearError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (credentials) => {
    setIsSubmitting(true);
    try {
      const result = await login(credentials.email, credentials.password);
      return result;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (userData) => {
    setIsSubmitting(true);
    try {
      const result = await register(userData);
      // Pass through requiresVerification and email from the API response
      return result;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const requestPasswordReset = async (email) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      return { 
        success: true, 
        message: response.data.message || 'Password reset email sent successfully.' 
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send password reset email';
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPassword = async (token, newPassword) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/auth/reset-password', {
        token,
        password: newPassword,
      });
      return { 
        success: true, 
        message: response.data.message || 'Password reset successfully.' 
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to reset password';
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyEmail = async (token) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/auth/verify-email', { token });
      return { 
        success: true, 
        message: response.data.message || 'Email verified successfully.' 
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Email verification failed';
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleLogin,
    handleRegister,
    handleLogout,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    isSubmitting,
    clearError,
  };
};

export default useAuthOperations;