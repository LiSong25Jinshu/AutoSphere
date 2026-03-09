import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

const AnalyticsReporting = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [reportType, setReportType] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState({});
  const [topPerformers, setTopPerformers] = useState([]);

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    const fetchAnalyticsData = () => {
      setAnalyticsData({
        totalRevenue: 125000,
        totalBookings: 342,
        averageBookingValue: 165,
        customerSatisfaction: 4.7,
        revenueGrowth: 12.5,
        bookingGrowth: 8.3,
        conversionRate: 3.2,
      });

      setTopPerformers([
        { id: 1, name: 'AutoCare Plus', bookings: 45, revenue: 8500, rating: 4.9 },
        { id: 2, name: 'QuickFix Motors', bookings: 38, revenue: 6200, rating: 4.6 },
        { id: 3, name: 'Premium Auto Service', bookings: 32, revenue: 9800, rating: 4.8 },
      ]);
    };

    fetchAnalyticsData();
  }, [timeRange, reportType]);

  const handleExportReport = () => {
    // Mock export functionality
    console.log('Exporting report...');
  };

  const MetricCard = ({ title, value, change, icon, color = 'primary' }) => (
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
            {change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {change > 0 ? (
                  <TrendingUp color="success" fontSize="small" />
                ) : (
                  <TrendingDown color="error" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={change > 0 ? 'success.main' : 'error.main'}
                  sx={{ ml: 0.5 }}
                >
                  {Math.abs(change)}%
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Analytics & Reporting
        </Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExportReport}
        >
          Export Report
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
                <MenuItem value="90d">Last 90 Days</MenuItem>
                <MenuItem value="1y">Last Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={(e) => setReportType(e.target.value)}
              >
                <MenuItem value="overview">Overview</MenuItem>
                <MenuItem value="revenue">Revenue</MenuItem>
                <MenuItem value="bookings">Bookings</MenuItem>
                <MenuItem value="users">Users</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Revenue"
            value={`$${analyticsData.totalRevenue?.toLocaleString()}`}
            change={analyticsData.revenueGrowth}
            icon={<AssessmentIcon fontSize="large" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Bookings"
            value={analyticsData.totalBookings?.toLocaleString()}
            change={analyticsData.bookingGrowth}
            icon={<TrendingUp fontSize="large" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg Booking Value"
            value={`$${analyticsData.averageBookingValue}`}
            change={5.2}
            icon={<AssessmentIcon fontSize="large" />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Customer Rating"
            value={`${analyticsData.customerSatisfaction}/5.0`}
            change={2.1}
            icon={<TrendingUp fontSize="large" />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Top Performers */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Top Performing Service Providers
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Provider</TableCell>
                <TableCell align="right">Bookings</TableCell>
                <TableCell align="right">Revenue</TableCell>
                <TableCell align="right">Rating</TableCell>
                <TableCell align="right">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topPerformers.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell>{provider.name}</TableCell>
                  <TableCell align="right">{provider.bookings}</TableCell>
                  <TableCell align="right">${provider.revenue.toLocaleString()}</TableCell>
                  <TableCell align="right">{provider.rating}/5.0</TableCell>
                  <TableCell align="right">
                    <Chip
                      label="Active"
                      color="success"
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default AnalyticsReporting;
