import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Paper, Typography, Box, Card, CardContent,
  LinearProgress, List, ListItem, ListItemText, ListItemIcon,
  Divider, CircularProgress, Alert,
} from '@mui/material';
import { People, DirectionsCar, EventNote, Message } from '@mui/icons-material';
import { adminAPI } from '../../services/api';

const MetricCard = ({ title, value, icon, sub, color = 'primary' }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="overline">{title}</Typography>
          <Typography variant="h4" component="div">{value ?? '—'}</Typography>
          {sub && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{sub}</Typography>}
        </Box>
        <Box sx={{ color: `${color}.main` }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

const SystemOverview = ({ onRefresh }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getStats();
      setStats(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats, onRefresh]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" action={<button onClick={fetchStats}>Retry</button>}>{error}</Alert>;
  if (!stats) return null;

  const { totals, thisMonth, breakdowns, recent } = stats;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Key Metrics</Typography>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <MetricCard title="Total Users" value={totals.users?.toLocaleString()}
          icon={<People fontSize="large" />}
          sub={`+${thisMonth.users} this month`} color="primary" />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard title="Vehicle Listings" value={totals.vehicles?.toLocaleString()}
          icon={<DirectionsCar fontSize="large" />}
          sub={`+${thisMonth.vehicles} this month`} color="secondary" />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard title="Total Bookings" value={totals.bookings?.toLocaleString()}
          icon={<EventNote fontSize="large" />}
          sub={`${totals.activeBookings} active`} color="success" />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard title="Conversations" value={totals.conversations?.toLocaleString()}
          icon={<Message fontSize="large" />} color="info" />
      </Grid>

      {/* Bookings by status */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Bookings by Status</Typography>
          {breakdowns.bookingsByStatus.length === 0 && (
            <Typography variant="body2" color="text.secondary">No booking data</Typography>
          )}
          {breakdowns.bookingsByStatus.map((row) => (
            <Box key={row.status} sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {row.status?.replace(/_/g, ' ')}
                </Typography>
                <Typography variant="body2" fontWeight={600}>{row.count}</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={totals.bookings > 0 ? (row.count / totals.bookings) * 100 : 0}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          ))}
        </Paper>
      </Grid>

      {/* Recent registrations */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Recent Registrations</Typography>
          <List dense>
            {recent.users.map((u, i) => (
              <React.Fragment key={u.id}>
                <ListItem>
                  <ListItemIcon><People color="primary" /></ListItemIcon>
                  <ListItemText
                    primary={`${u.firstName} ${u.lastName}`}
                    secondary={`${u.email} · ${u.role} · ${new Date(u.createdAt).toLocaleDateString()}`}
                  />
                </ListItem>
                {i < recent.users.length - 1 && <Divider />}
              </React.Fragment>
            ))}
            {recent.users.length === 0 && (
              <ListItem><ListItemText primary="No recent registrations" /></ListItem>
            )}
          </List>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default SystemOverview;
