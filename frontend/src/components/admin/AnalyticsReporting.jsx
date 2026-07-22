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
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';

const AnalyticsReporting = () => {
  const [timeRange, setTimeRange] = useState('30');
  const [reportType, setReportType] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await adminAPI.getAnalytics(parseInt(timeRange));
        setAnalyticsData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalyticsData();
  }, [timeRange]);

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
        <Typography variant="h5" gutterBottom>Analytics & Reporting</Typography>
        <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExportReport}>
          Export Report
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Time Range</InputLabel>
          <Select value={timeRange} label="Time Range" onChange={(e) => setTimeRange(e.target.value)}>
            <MenuItem value="7">Last 7 Days</MenuItem>
            <MenuItem value="30">Last 30 Days</MenuItem>
            <MenuItem value="90">Last 90 Days</MenuItem>
            <MenuItem value="365">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && analyticsData && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard title="Total Bookings" value={analyticsData.totalBookings?.toLocaleString()}
                icon={<TrendingUp fontSize="large" />} color="primary" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard title="Completed" value={analyticsData.completedBookings?.toLocaleString()}
                icon={<AssessmentIcon fontSize="large" />} color="success" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard title="Completion Rate" value={`${analyticsData.completionRate}%`}
                icon={<TrendingUp fontSize="large" />} color="info" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard title="New Users" value={analyticsData.newUsers?.toLocaleString()}
                icon={<AssessmentIcon fontSize="large" />} color="warning" />
            </Grid>
          </Grid>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Top Service Providers</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Provider</TableCell>
                    <TableCell align="right">Bookings</TableCell>
                    <TableCell align="right">Avg Rating</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analyticsData.topProviders?.length > 0 ? (
                    analyticsData.topProviders.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>{p.email}</div>
                        </TableCell>
                        <TableCell align="right">{p.bookings}</TableCell>
                        <TableCell align="right">{p.avgRating ? `${p.avgRating}/5.0` : '—'}</TableCell>
                        <TableCell align="right"><Chip label="Active" color="success" size="small" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No data for this period</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default AnalyticsReporting;
