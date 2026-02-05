import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { googleLogin } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');
      const error = searchParams.get('error');

      if (error) {
        console.error('Google OAuth error:', error);
        navigate('/login', { 
          state: { error: decodeURIComponent(error) }
        });
        return;
      }

      if (token && userParam) {
        try {
          const user = JSON.parse(decodeURIComponent(userParam));
          
          // Use the googleLogin function from context
          const result = await googleLogin(user, token);
          
          if (result.success) {
            // Redirect to dashboard
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/login', { 
              state: { error: result.error || 'Authentication failed. Please try again.' }
            });
          }
        } catch (error) {
          console.error('Error processing Google OAuth callback:', error);
          navigate('/login', { 
            state: { error: 'Authentication failed. Please try again.' }
          });
        }
      } else {
        navigate('/login', { 
          state: { error: 'Authentication failed. Please try again.' }
        });
      }
    };

    handleCallback();
  }, [searchParams, navigate, googleLogin]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '24px',
      textAlign: 'center'
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '24px'
      }}></div>
      <h2 style={{ marginBottom: '8px', color: '#333' }}>
        Completing Google Sign In...
      </h2>
      <p style={{ color: '#666', margin: 0 }}>
        Please wait while we set up your account.
      </p>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GoogleAuthCallback;