import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Grid, Card, CardContent, Button, Chip,
  Avatar, List, ListItem, ListItemText, ListItemAvatar, Divider, Paper,
  LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  DirectionsCar as CarIcon, TrendingUp as TrendingUpIcon, People as PeopleIcon,
  AttachMoney as MoneyIcon, Inventory as InventoryIcon, Analytics as AnalyticsIcon,
  Add as AddIcon, Edit as EditIcon, Visibility as ViewIcon, Star as StarIcon,
} from '@mui/icons-material';
import { vehicleService } from '../../services/vehicleService';
import { useAuth } from '../../contexts/AuthContext';

const DealerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inventoryCount, setInventoryCount] = useState(0);

  useEffect(() => {
    vehicleService.getVehicles({ limit: 1 }).then(res => {
      if (res.success) setInventoryCount(res.data?.pagination?.total || res.data?.data?.length || 0);
    });
  }, []);

  const [recentInquiries] = useState([
    {
      id: 1,
      customerName: 'Alice Johnson',
      vehicle: '2022 Honda Accord',
      type: 'Purchase Inquiry',
      time: '2 hours ago',
      status: 'New',
      priority: 'high'
    },
    {
      id: 2,
      customerName: 'Bob Smith',
      vehicle: '2021 Toyota Camry',
      type: 'Test Drive Request',
      time: '4 hours ago',
      status: 'Scheduled',
      priority: 'medium'
    },
    {
      id: 3,
      customerName: 'Carol Davis',
      vehicle: '2023 BMW X5',
      type: 'Financing Question',
      time: '1 day ago',
      status: 'In Progress',
      priority: 'low'
    },
  ]);

  const [topVehicles] = useState([
    { id: 1, model: '2022 Honda Civic', views: 245, inquiries: 18, price: '$24,500' },
    { id: 2, model: '2021 Toyota Corolla', views: 198, inquiries: 15, price: '$22,800' },
    { id: 3, model: '2023 Nissan Altima', views: 167, inquiries: 12, price: '$26,900' },
    { id: 4, model: '2022 Hyundai Elantra', views: 134, inquiries: 9, price: '$23,200' },
  ]);

  const stats = [
    { label: 'Total Inventory', value: inventoryCount || '—', icon: <InventoryIcon />, color: '#4caf50', change: 'Live from API' },
    { label: 'Monthly Sales', value: '23', icon: <CarIcon />, color: '#2196f3', change: '+12% vs last month' },
    { label: 'Active Leads', value: '45', icon: <PeopleIcon />, color: '#ff9800', change: '8 new today' },
    { label: 'Revenue (MTD)', value: '$485K', icon: <MoneyIcon />, color: '#9c27b0', change: '+18% vs last month' },
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'primary';
      case 'Scheduled': return 'info';
      case 'In Progress': return 'warning';
      case 'Completed': return 'success';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Dealer Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage your vehicle inventory and customer relationships
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
                <Typography variant="caption" color="success.main">
                  {stat.change}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Customer Inquiries */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Recent Customer Inquiries
              </Typography>
              <Button variant="outlined" size="small">
                View All
              </Button>
            </Box>
            <List>
              {recentInquiries.map((inquiry, index) => (
                <React.Fragment key={inquiry.id}>
                  <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#2196f3' }}>
                        <PeopleIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {inquiry.customerName}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                              label={inquiry.status}
                              size="small"
                              color={getStatusColor(inquiry.status)}
                            />
                            <Chip
                              label={inquiry.priority}
                              size="small"
                              color={getPriorityColor(inquiry.priority)}
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {inquiry.type} • {inquiry.vehicle}
                          </Typography>
                          <Typography variant="body2" color="primary" fontWeight="bold">
                            {inquiry.time}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < recentInquiries.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<AddIcon />}
                  sx={{ py: 2 }}
                  onClick={() => navigate('/dealer/inventory')}
                >
                  Add New Vehicle
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<EditIcon />}
                  sx={{ py: 2 }}
                  color="info"
                  onClick={() => navigate('/dealer/inventory')}
                >
                  Update Inventory
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<AnalyticsIcon />}
                  sx={{ py: 2 }}
                  color="warning"
                  onClick={() => navigate('/dealer/sales')}
                >
                  View Analytics
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ViewIcon />}
                  sx={{ py: 2 }}
                  onClick={() => navigate('/dealer/messages')}
                >
                  Manage Leads
                </Button>
              </Grid>
            </Grid>

            {/* Performance Summary */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                This Month's Performance
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Sales Target</Typography>
                  <Typography variant="body2" fontWeight="bold">76%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={76} sx={{ height: 8, borderRadius: 4 }} />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Lead Conversion</Typography>
                  <Typography variant="body2" fontWeight="bold">62%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={62} sx={{ height: 8, borderRadius: 4 }} color="warning" />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <StarIcon sx={{ color: '#ffc107', mr: 1 }} />
                <Typography variant="body2">
                  Customer Rating: <strong>4.7/5</strong>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Top Performing Vehicles */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Top Performing Vehicles
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Vehicle Model</TableCell>
                    <TableCell align="right">Views</TableCell>
                    <TableCell align="right">Inquiries</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Conversion Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: '#2196f3', mr: 2, width: 32, height: 32 }}>
                            <CarIcon fontSize="small" />
                          </Avatar>
                          <Typography variant="body2" fontWeight="bold">
                            {vehicle.model}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">{vehicle.views}</TableCell>
                      <TableCell align="right">
                        <Chip label={vehicle.inquiries} size="small" color="primary" />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {vehicle.price}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="success.main" fontWeight="bold">
                          {Math.round((vehicle.inquiries / vehicle.views) * 100)}%
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DealerDashboard;