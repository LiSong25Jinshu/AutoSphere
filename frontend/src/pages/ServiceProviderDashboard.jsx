import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  Build as BuildIcon,
  LocalCarWash as CarWashIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

const ServiceProviderDashboard = () => {
  const [activeBookings] = useState([
    {
      id: 1,
      customerName: 'John Smith',
      service: 'Oil Change',
      vehicle: '2020 Honda Civic',
      time: '10:00 AM',
      status: 'In Progress',
      type: 'maintenance'
    },
    {
      id: 2,
      customerName: 'Sarah Johnson',
      service: 'Premium Car Wash',
      vehicle: '2019 BMW X5',
      time: '11:30 AM',
      status: 'Scheduled',
      type: 'wash'
    },
    {
      id: 3,
      customerName: 'Mike Chen',
      service: 'Brake Inspection',
      vehicle: '2021 Toyota Camry',
      time: '2:00 PM',
      status: 'Scheduled',
      type: 'maintenance'
    },
  ]);

  const services = [
    {
      name: 'Car Wash Services',
      icon: <CarWashIcon sx={{ fontSize: 40, color: '#2196f3' }} />,
      items: ['Basic Wash', 'Premium Wash', 'Full Detail', 'Interior Cleaning'],
      bookings: 15,
      revenue: '$450'
    },
    {
      name: 'Maintenance Services',
      icon: <BuildIcon sx={{ fontSize: 40, color: '#ff9800' }} />,
      items: ['Oil Change', 'Brake Service', 'Tire Rotation', 'Engine Diagnostics'],
      bookings: 8,
      revenue: '$1,200'
    }
  ];

  const stats = [
    { label: 'Today\'s Bookings', value: '12', icon: <ScheduleIcon />, color: '#4caf50' },
    { label: 'This Week Revenue', value: '$2,850', icon: <MoneyIcon />, color: '#2196f3' },
    { label: 'Customer Rating', value: '4.8', icon: <StarIcon />, color: '#ff9800' },
    { label: 'Active Services', value: '23', icon: <TrendingUpIcon />, color: '#9c27b0' },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Service Provider Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage your car wash and maintenance services
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: stat.color, mr: 2 }}>
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Services Overview */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Your Services
            </Typography>
            {services.map((service, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {service.icon}
                  <Box sx={{ ml: 2, flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {service.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip 
                        label={`${service.bookings} bookings`} 
                        size="small" 
                        color="primary" 
                      />
                      <Chip 
                        label={service.revenue} 
                        size="small" 
                        color="success" 
                      />
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ ml: 7 }}>
                  {service.items.map((item, itemIndex) => (
                    <Chip
                      key={itemIndex}
                      label={item}
                      variant="outlined"
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
                {index < services.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Active Bookings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Today's Appointments
              </Typography>
              <Button variant="outlined" size="small">
                View All
              </Button>
            </Box>
            <List>
              {activeBookings.map((booking, index) => (
                <React.Fragment key={booking.id}>
                  <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: booking.type === 'wash' ? '#2196f3' : '#ff9800' }}>
                        {booking.type === 'wash' ? <CarWashIcon /> : <BuildIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {booking.customerName}
                          </Typography>
                          <Chip
                            label={booking.status}
                            size="small"
                            color={booking.status === 'In Progress' ? 'success' : 'default'}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {booking.service} • {booking.vehicle}
                          </Typography>
                          <Typography variant="body2" color="primary" fontWeight="bold">
                            {booking.time}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < activeBookings.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<ScheduleIcon />}
                  sx={{ py: 2 }}
                >
                  Manage Schedule
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<CarWashIcon />}
                  sx={{ py: 2 }}
                  color="info"
                >
                  Add Wash Service
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<BuildIcon />}
                  sx={{ py: 2 }}
                  color="warning"
                >
                  Add Maintenance
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<NotificationsIcon />}
                  sx={{ py: 2 }}
                >
                  View Messages
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Service Performance Analytics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Service Performance This Month
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Car Wash Services
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Basic Wash (8 bookings)</Typography>
                    <Typography variant="body2" fontWeight="bold">$120</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={40} sx={{ height: 8, borderRadius: 4, mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Premium Wash (5 bookings)</Typography>
                    <Typography variant="body2" fontWeight="bold">$175</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={60} sx={{ height: 8, borderRadius: 4, mb: 2 }} color="info" />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Full Detail (2 bookings)</Typography>
                    <Typography variant="body2" fontWeight="bold">$240</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={80} sx={{ height: 8, borderRadius: 4 }} color="success" />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Maintenance Services
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Oil Change (4 bookings)</Typography>
                    <Typography variant="body2" fontWeight="bold">$180</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={50} sx={{ height: 8, borderRadius: 4, mb: 2 }} color="warning" />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Brake Service (2 bookings)</Typography>
                    <Typography variant="body2" fontWeight="bold">$320</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={70} sx={{ height: 8, borderRadius: 4, mb: 2 }} color="error" />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Engine Diagnostics (2 bookings)</Typography>
                    <Typography variant="body2" fontWeight="bold">$200</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={90} sx={{ height: 8, borderRadius: 4 }} color="secondary" />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ServiceProviderDashboard;