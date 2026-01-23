import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  Button,
  Typography,
  Alert,
  Container,
  CircularProgress,
} from '@mui/material';
import { CheckCircle, Error, ArrowBack } from '@mui/icons-material';
import { useAuthOperations } from '../hooks/useAuthOperations';

const EmailVerificationForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyEmail, isSubmitting } = useAuthOperations();
  
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, success, error
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const verificationToken = searchParams.get('token');
    if (!verificationToken) {
      setVerificationStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }

    setToken(verificationToken);
    
    // Automatically attempt verification when component loads
    const performVerification = async () => {
      const result = await verifyEmail(verificationToken);
      
      if (result.success) {
        setVerificationStatus('success');
        setMessage(result.message);
      } else {
        setVerificationStatus('error');
        setMessage(result.error);
      }
    };

    performVerification();
  }, [searchParams, verifyEmail]);

  const handleRetryVerification = async () => {
    if (!token) return;
    
    const result = await verifyEmail(token);
    
    if (result.success) {
      setVerificationStatus('success');
      setMessage(result.message);
    } else {
      setVerificationStatus('error');
      setMessage(result.error);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login', { 
      state: { message: 'Email verified successfully! You can now sign in.' }
    });
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case 'pending':
        return (
          <>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography component="h1" variant="h5" gutterBottom>
              Verifying Email...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              Please wait while we verify your email address.
            </Typography>
          </>
        );

      case 'success':
        return (
          <>
            <CheckCircle 
              sx={{ 
                fontSize: 60, 
                color: 'success.main', 
                mb: 2 
              }} 
            />
            <Typography component="h1" variant="h5" gutterBottom color="success.main">
              Email Verified!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              {message}
            </Typography>
            <Button
              variant="contained"
              onClick={handleGoToLogin}
              sx={{ mb: 2 }}
            >
              Continue to Sign In
            </Button>
          </>
        );

      case 'error':
        return (
          <>
            <Error 
              sx={{ 
                fontSize: 60, 
                color: 'error.main', 
                mb: 2 
              }} 
            />
            <Typography component="h1" variant="h5" gutterBottom color="error.main">
              Verification Failed
            </Typography>
            <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
              {message}
            </Alert>
            {token && (
              <Button
                variant="contained"
                onClick={handleRetryVerification}
                disabled={isSubmitting}
                sx={{ mb: 2 }}
              >
                {isSubmitting ? 'Retrying...' : 'Retry Verification'}
              </Button>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {renderContent()}
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link
              to="/login"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Button
                startIcon={<ArrowBack />}
                variant="text"
                color="primary"
              >
                Back to Sign In
              </Button>
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default EmailVerificationForm;