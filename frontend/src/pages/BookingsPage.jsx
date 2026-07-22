import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
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
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Build as BuildIcon,
  LocalCarWash as CarWashIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
} from '@mui/icons-material';

const BookingsPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'view', 'edit', 'create'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newBooking, setNewBooking] = useState({
    service: '',
    date: '',
    time: '',
    vehicle: '',
    notes: '',
  });

  const bookings = [
    {
      id: 1,
      customerName: 'John Smith',
      customerEmail: 'john.smith@email.com',
      service: 'Oil Change',
      serviceType: 'maintenance',
      vehicle: '2020 Honda Civic',
      date: '2024-01-25',
      time: '10:00 AM',
      status: 'confirmed',
      price: 'GH₵ 225',
      notes: 'Customer requested synthetic oil',
      provider: 'Mike\'s Auto Service',
    },
    {
      id: 2,
      customerName: 'Sarah Johnson',
      customerEmail: 'sarah.j@email.com',
      service: 'Premium Car Wash',
      serviceType: 'wash',
      vehicle: '2019 BMW X5',
      date: '2024-01-26',
      time: '2:00 PM',
      status: 'pending',
      price: 'GH₵ 175',
      notes: 'Interior cleaning included',
      provider: 'Clean Car Co.',
    },
    {
      id: 3,
      customerName: 'Mike Chen',
      customerEmail: 'mike.chen@email.com',
      service: 'Brake Inspection',
      serviceType: 'maintenance',
      vehicle: '2021 Toyota Camry',
      date: '2024-01-24',
      time: '9:00 AM',
      status: 'completed',
      price: 'GH₵ 400',
      notes: 'Brake pads replaced',
      provider: 'AutoCare Plus',
    },
    {
      id: 4,
      customerName: 'Lisa Davis',
      customerEmail: 'lisa.davis@email.com',
      service: 'Full Detail',
      serviceType: 'wash',
      vehicle: '2022 Mercedes C-Class',
      date: '2024-01-23',
      time: '11:00 AM',
      status: 'cancelled',
      price: 'GH₵ 600',
      notes: 'Customer cancelled due to schedule conflict',
      provider: 'Premium Detailing',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getServiceIcon = (serviceType) => {
    return serviceType === 'wash' ? <CarWashIcon /> : <BuildIcon />;
  };

  const filterBookingsByStatus = (status) => {
    if (status === 'all') return bookings;
    return bookings.filter(booking => booking.status === status);
  };

  const getBookingsForTab = (tabIndex) => {
    switch (tabIndex) {
      case 0: return bookings; // All
      case 1: return filterBookingsByStatus('pending'); // Pending
      case 2: return filterBookingsByStatus('confirmed'); // Confirmed
      case 3: return filterBookingsByStatus('completed'); // Completed
      default: return bookings;
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDialogOpen = (type, booking = null) => {
    setDialogType(type);
    setSelectedBooking(booking);
    if (type === 'create') {
      setNewBooking({
        service: '',
        date: '',
        time: '',
        vehicle: '',
        notes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedBooking(null);
    setDialogType('');
  };

  const handleCreateBooking = () => {
    // Handle booking creation logic here
    console.log('Creating booking:', newBooking);
    handleDialogClose();
  };

  const BookingCard = ({ booking }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: booking.serviceType === 'wash' ? '#2196f3' : '#ff9800', mr: 2 }}>
              {getServiceIcon(booking.serviceType)}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {booking.service}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {booking.customerName} • {booking.vehicle}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={booking.status}
            color={getStatusColor(booking.status)}
            size="small"
          />
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              <strong>Date:</strong> {new Date(booking.date).toLocaleDateString()}
            </Typography>
            <Typography variant="body2">
              <strong>Time:</strong> {booking.time}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              <strong>Price:</strong> {booking.price}
            </Typography>
            <Typography variant="body2">
              <strong>Provider:</strong> {booking.provider}
            </Typography>
          </Grid>
        </Grid>

        {booking.notes && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Notes:</strong> {booking.notes}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => handleDialogOpen('view', booking)}
          >
            View Details
          </Button>
          {booking.status === 'pending' && (
            <>
              <Button
                size="small"
                startIcon={<CheckCircleIcon />}
                color="success"
              >
                Confirm
              </Button>
              <Button
                size="small"
                startIcon={<CancelIcon />}
                color="error"
              >
                Cancel
              </Button>
            </>
          )}
          {booking.status === 'confirmed' && (
            <Button
              size="small"
              startIcon={<EditIcon />}
              color="primary"
              onClick={() => handleDialogOpen('edit', booking)}
            >
              Reschedule
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const BookingDetailsDialog = () => (
    <Dialog open={dialogOpen && dialogType === 'view'} onClose={handleDialogClose} maxWidth="md" fullWidth>
      <DialogTitle>Booking Details</DialogTitle>
      <DialogContent>
        {selectedBooking && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Service Information</Typography>
                <Typography><strong>Service:</strong> {selectedBooking.service}</Typography>
                <Typography><strong>Type:</strong> {selectedBooking.serviceType}</Typography>
                <Typography><strong>Date:</strong> {new Date(selectedBooking.date).toLocaleDateString()}</Typography>
                <Typography><strong>Time:</strong> {selectedBooking.time}</Typography>
                <Typography><strong>Price:</strong> {selectedBooking.price}</Typography>
                <Typography><strong>Status:</strong> 
                  <Chip 
                    label={selectedBooking.status} 
                    color={getStatusColor(selectedBooking.status)} 
                    size="small" 
                    sx={{ ml: 1 }} 
                  />
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Customer Information</Typography>
                <Typography><strong>Name:</strong> {selectedBooking.customerName}</Typography>
                <Typography><strong>Email:</strong> {selectedBooking.customerEmail}</Typography>
                <Typography><strong>Vehicle:</strong> {selectedBooking.vehicle}</Typography>
                <Typography><strong>Provider:</strong> {selectedBooking.provider}</Typography>
                {selectedBooking.notes && (
                  <Box sx={{ mt: 2 }}>
                    <Typography><strong>Notes:</strong></Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedBooking.notes}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  const CreateBookingDialog = () => (
    <Dialog open={dialogOpen && dialogType === 'create'} onClose={handleDialogClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Booking</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Service Type</InputLabel>
              <Select
                value={newBooking.service}
                label="Service Type"
                onChange={(e) => setNewBooking({ ...newBooking, service: e.target.value })}
              >
                <MenuItem value="Oil Change">Oil Change</MenuItem>
                <MenuItem value="Brake Service">Brake Service</MenuItem>
                <MenuItem value="Basic Car Wash">Basic Car Wash</MenuItem>
                <MenuItem value="Premium Car Wash">Premium Car Wash</MenuItem>
                <MenuItem value="Full Detail">Full Detail</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={newBooking.date}
              onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Time"
              type="time"
              value={newBooking.time}
              onChange={(e) => setNewBooking({ ...newBooking, time: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Vehicle"
              value={newBooking.vehicle}
              onChange={(e) => setNewBooking({ ...newBooking, vehicle: e.target.value })}
              placeholder="e.g., 2020 Honda Civic"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={newBooking.notes}
              onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
              placeholder="Any special requirements or notes..."
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose}>Cancel</Button>
        <Button onClick={handleCreateBooking} variant="contained">
          Create Booking
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Service Bookings
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleDialogOpen('create')}
        >
          New Booking
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label={`All (${bookings.length})`} />
          <Tab label={`Pending (${filterBookingsByStatus('pending').length})`} />
          <Tab label={`Confirmed (${filterBookingsByStatus('confirmed').length})`} />
          <Tab label={`Completed (${filterBookingsByStatus('completed').length})`} />
        </Tabs>
      </Paper>

      {/* Bookings List */}
      <Box>
        {getBookingsForTab(activeTab).length > 0 ? (
          getBookingsForTab(activeTab).map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No bookings found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeTab === 0 
                ? "You don't have any bookings yet. Create your first booking to get started."
                : `No ${['all', 'pending', 'confirmed', 'completed'][activeTab]} bookings found.`
              }
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Dialogs */}
      <BookingDetailsDialog />
      <CreateBookingDialog />
    </Container>
  );
};

export default BookingsPage;