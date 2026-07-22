import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  MoreVert,
  CalendarToday,
  AccessTime,
  LocationOn,
  Build,
  Phone,
  Email,
  Edit,
  Cancel,
  CheckCircle,
  Schedule,
  Warning,
  DirectionsCar,
  Person,
} from '@mui/icons-material';

const AppointmentCard = ({ 
  appointment, 
  onEdit, 
  onCancel, 
  onReschedule,
  showActions = true 
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [rescheduleDialog, setRescheduleDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCancelConfirm = () => {
    onCancel?.(appointment.id, cancelReason);
    setCancelDialog(false);
    setCancelReason('');
    handleMenuClose();
  };

  const handleRescheduleConfirm = () => {
    onReschedule?.(appointment.id);
    setRescheduleDialog(false);
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'in-progress': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'rescheduled': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle />;
      case 'pending': return <Schedule />;
      case 'in-progress': return <Build />;
      case 'completed': return <CheckCircle />;
      case 'cancelled': return <Cancel />;
      case 'rescheduled': return <Schedule />;
      default: return <Schedule />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isUpcoming = () => {
    const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
    return appointmentDate > new Date() && appointment.status !== 'cancelled';
  };

  const isPast = () => {
    const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
    return appointmentDate < new Date();
  };

  return (
    <>
      <Card 
        sx={{ 
          mb: 2,
          border: appointment.status === 'confirmed' && isUpcoming() ? 2 : 0,
          borderColor: 'success.main',
          opacity: appointment.status === 'cancelled' ? 0.7 : 1,
        }}
      >
        <CardContent>
          {/* Header with Status and Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={getStatusIcon(appointment.status)}
                label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                color={getStatusColor(appointment.status)}
                size="small"
              />
              {isUpcoming() && appointment.status === 'confirmed' && (
                <Chip label="Upcoming" color="info" size="small" variant="outlined" />
              )}
              {isPast() && appointment.status === 'completed' && (
                <Chip label="Completed" color="success" size="small" variant="outlined" />
              )}
            </Box>
            
            {showActions && (
              <IconButton onClick={handleMenuOpen} size="small">
                <MoreVert />
              </IconButton>
            )}
          </Box>

          {/* Service Information */}
          <Typography variant="h6" gutterBottom>
            {appointment.serviceType}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Confirmation: {appointment.confirmationNumber}
          </Typography>

          {/* Date and Time */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday color="action" fontSize="small" />
                <Typography variant="body2">
                  {formatDate(appointment.date)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime color="action" fontSize="small" />
                <Typography variant="body2">
                  {formatTime(appointment.time)}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Service Provider */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar src={appointment.provider.image} sx={{ width: 40, height: 40 }}>
              <Build />
            </Avatar>
            <Box>
              <Typography variant="subtitle2">
                {appointment.provider.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  {appointment.provider.location}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Vehicle Information */}
          {appointment.vehicleInfo && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <DirectionsCar color="action" fontSize="small" />
              <Typography variant="body2">
                {appointment.vehicleInfo}
              </Typography>
            </Box>
          )}

          {/* Description */}
          {appointment.description && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {appointment.description}
              </Typography>
            </Box>
          )}

          {/* Cost Information */}
          {appointment.estimatedCost && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Estimated Cost:
              </Typography>
              <Typography variant="subtitle2" color="primary">
                {appointment.estimatedCost}
              </Typography>
            </Box>
          )}

          {/* Urgency Level */}
          {appointment.urgency && appointment.urgency !== 'normal' && (
            <Box sx={{ mt: 1 }}>
              <Chip
                label={`${appointment.urgency.charAt(0).toUpperCase() + appointment.urgency.slice(1)} Priority`}
                color={appointment.urgency === 'urgent' ? 'error' : 'warning'}
                size="small"
                variant="outlined"
              />
            </Box>
          )}
        </CardContent>

        {/* Actions */}
        {showActions && (appointment.status === 'confirmed' || appointment.status === 'pending') && (
          <CardActions>
            <Button
              size="small"
              startIcon={<Phone />}
              onClick={() => window.open(`tel:${appointment.provider.phone}`)}
            >
              Call Provider
            </Button>
            <Button
              size="small"
              startIcon={<Email />}
              onClick={() => window.open(`mailto:${appointment.provider.email}`)}
            >
              Email
            </Button>
          </CardActions>
        )}
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {(appointment.status === 'confirmed' || appointment.status === 'pending') && isUpcoming() && [
          <MenuItem key="edit" onClick={() => { onEdit?.(appointment); handleMenuClose(); }}>
            <Edit sx={{ mr: 1 }} fontSize="small" />
            Edit Details
          </MenuItem>,
          <MenuItem key="reschedule" onClick={() => setRescheduleDialog(true)}>
            <Schedule sx={{ mr: 1 }} fontSize="small" />
            Reschedule
          </MenuItem>,
          <MenuItem key="cancel" onClick={() => setCancelDialog(true)}>
            <Cancel sx={{ mr: 1 }} fontSize="small" />
            Cancel Appointment
          </MenuItem>
        ]}
        {appointment.status === 'completed' && (
          <MenuItem onClick={handleMenuClose}>
            <Person sx={{ mr: 1 }} fontSize="small" />
            Leave Review
          </MenuItem>
        )}
      </Menu>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelDialog}
        onClose={() => setCancelDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cancel Appointment</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Are you sure you want to cancel this appointment? This action cannot be undone.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for cancellation (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Please let us know why you're cancelling..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>
            Keep Appointment
          </Button>
          <Button onClick={handleCancelConfirm} color="error" variant="contained">
            Cancel Appointment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reschedule Confirmation Dialog */}
      <Dialog
        open={rescheduleDialog}
        onClose={() => setRescheduleDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reschedule Appointment</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            You will be redirected to select a new date and time for your appointment.
          </Typography>
          <Alert severity="info">
            Your current appointment will be cancelled and a new one will be created.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRescheduleDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleRescheduleConfirm} variant="contained">
            Continue to Reschedule
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AppointmentCard;