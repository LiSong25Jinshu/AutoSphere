import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  DirectionsCar,
  EventNote,
  Message,
  Speed,
  Storage,
  Memory,
  NetworkCheck,
} from '@mui/icons-material';

const SystemOverview = ({ onRefresh }) => {
  const [systemMetrics, setSystemMetrics] = useState({
    totalUsers: 0,
    totalVehicles: 0,
    totalBookings: 0,
    activeConversations: 0,
    serverLoad: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkLatency: 0,
  });

  const [recentActivity, setRecentActivity] = useState([]);

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    const fetchSystemMetrics = () => {
      setSystemMetrics({
        totalUsers: 1247,
        totalVehicles: 856,
        totalBookings: 342,
        activeConversations: 23,
        serverLoad: 68,
        memoryUsage: 72,
        diskUsage: 45,
        networkLatency: 120,
      });

      setRecentActivity([
        {
          id: 1,
          type: 'user_registration',
          message: 'New user registered: john.doe@email.com',
          timestamp: new Date(Date.now() - 300000),
        },
        {
          id: 2,
          type: 'vehicle_listing',
          message: 'New vehicle listed: 2023 Toyota Camry',
          timestamp: new Date(Date.now() - 600000),
        },
        {
          id: 3,
          type: 'booking_created',
          message: 'Service booking created for maintenance',
          timestamp: new Date(Date.now() - 900000),
        },
        {
          id: 4,
          type: 'system_alert',
          message: 'Database backup completed successfully',
          timestamp: new Date(Date.now() - 1200000),
        },
      ]);
    };

    fetchSystemMetrics();
    const interval = setInterval(fetchSystemMetrics, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [onRefresh]);

  const MetricCard = ({ title, value, icon, trend, color = 'primary' }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend > 0 ? (
                  <TrendingUp color="success" fontSize="small" />
                ) : (
                  <TrendingDown color="error" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={trend > 0 ? 'success.main' : 'error.main'}
                  sx={{ ml: 0.5 }}
                >
                  {Math.abs(trend)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ color: `${color}.main` }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const PerformanceCard = ({ title, value, maxValue, unit, color }) => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ mr: 1 }}>
          {value}{unit}
        </Typography>
        <Chip
          label={`${Math.round((value / maxValue) * 100)}%`}
          size="small"
          color={value / maxValue > 0.8 ? 'error' : value / maxValue > 0.6 ? 'warning' : 'success'}
        />
      </Box>
      <LinearProgress
        variant="determinate"
        value={(value / maxValue) * 100}
        color={color}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Paper>
  );

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registration':
        return <People color="primary" />;
      case 'vehicle_listing':
        return <DirectionsCar color="secondary" />;
      case 'booking_created':
        return <EventNote color="success" />;
      case 'system_alert':
        return <NetworkCheck color="info" />;
      default:
        return <Message />;
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Key Metrics */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Key Metrics
        </Typography>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Total Users"
          value={systemMetrics.totalUsers.toLocaleString()}
          icon={<People fontSize="large" />}
          trend={12}
          color="primary"
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Vehicle Listings"
          value={systemMetrics.totalVehicles.toLocaleString()}
          icon={<DirectionsCar fontSize="large" />}
          trend={8}
          color="secondary"
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Active Bookings"
          value={systemMetrics.totalBookings.toLocaleString()}
          icon={<EventNote fontSize="large" />}
          trend={-3}
          color="success"
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Live Conversations"
          value={systemMetrics.activeConversations}
          icon={<Message fontSize="large" />}
          trend={15}
          color="info"
        />
      </Grid>

      {/* System Performance */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            System Performance
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <PerformanceCard
                title="Server Load"
                value={systemMetrics.serverLoad}
                maxValue={100}
                unit="%"
                color="primary"
              />
            </Grid>
            <Grid item xs={12}>
              <PerformanceCard
                title="Memory Usage"
                value={systemMetrics.memoryUsage}
                maxValue={100}
                unit="%"
                color="warning"
              />
            </Grid>
            <Grid item xs={12}>
              <PerformanceCard
                title="Disk Usage"
                value={systemMetrics.diskUsage}
                maxValue={100}
                unit="%"
                color="info"
              />
            </Grid>
            <Grid item xs={12}>
              <PerformanceCard
                title="Network Latency"
                value={systemMetrics.networkLatency}
                maxValue={1000}
                unit="ms"
                color="success"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Recent Activity */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <List>
            {recentActivity.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <ListItem>
                  <ListItemIcon>
                    {getActivityIcon(activity.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={activity.message}
                    secondary={activity.timestamp.toLocaleString()}
                  />
                </ListItem>
                {index < recentActivity.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default SystemOverview;