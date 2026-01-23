import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  DirectionsCar as VehicleIcon,
  EventNote as BookingIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import SystemOverview from '../components/admin/SystemOverview';
import UserManagement from '../components/admin/UserManagement';
import AnalyticsReporting from '../components/admin/AnalyticsReporting';
import ContentModeration from '../components/admin/ContentModeration';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Mock system alerts - in real implementation, this would come from API
  useEffect(() => {
    const mockAlerts = [
      {
        id: 1,
        type: 'warning',
        message: 'High server load detected on vehicle search service',
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      },
      {
        id: 2,
        type: 'info',
        message: 'Scheduled maintenance completed successfully',
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      },
    ];
    setSystemAlerts(mockAlerts);
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    setLastRefresh(new Date());
    // In real implementation, this would trigger data refresh
  };

  const tabContent = [
    {
      label: 'Overview',
      icon: <DashboardIcon />,
      component: <SystemOverview onRefresh={handleRefresh} />,
    },
    {
      label: 'Users',
      icon: <PeopleIcon />,
      component: <UserManagement />,
    },
    {
      label: 'Analytics',
      icon: <AnalyticsIcon />,
      component: <AnalyticsReporting />,
    },
    {
      label: 'Moderation',
      icon: <SecurityIcon />,
      component: <ContentModeration />,
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Admin Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </Typography>
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleRefresh} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Welcome back, {user?.firstName} {user?.lastName}
        </Typography>

        {/* System Alerts */}
        {systemAlerts.length > 0 && (
          <Box sx={{ mt: 2 }}>
            {systemAlerts.map((alert) => (
              <Alert
                key={alert.id}
                severity={alert.type}
                sx={{ mb: 1 }}
                icon={alert.type === 'warning' ? <WarningIcon /> : undefined}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <Typography variant="body2">{alert.message}</Typography>
                  <Chip
                    label={alert.timestamp.toLocaleTimeString()}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Alert>
            ))}
          </Box>
        )}
      </Box>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          {tabContent.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              sx={{ minHeight: 64 }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box>
        {tabContent[activeTab]?.component}
      </Box>
    </Container>
  );
};

export default AdminDashboard;