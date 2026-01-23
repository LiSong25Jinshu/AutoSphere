import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box, Typography, Paper } from '@mui/material';

const RoleBasedRoute = ({ children, allowedRoles, fallbackPath = '/unauthorized' }) => {
  const { isAuthenticated, isLoading, user, hasAnyRole } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (!hasAnyRole(allowedRoles)) {
    // Show unauthorized message or redirect
    if (fallbackPath === '/unauthorized') {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
          p={3}
        >
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 500 }}>
            <Typography variant="h5" color="error" gutterBottom>
              Access Denied
            </Typography>
            <Typography variant="body1" color="text.secondary">
              You don't have permission to access this page.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Required roles: {allowedRoles.join(', ')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your role: {user?.role || 'Unknown'}
            </Typography>
          </Paper>
        </Box>
      );
    }
    
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default RoleBasedRoute;