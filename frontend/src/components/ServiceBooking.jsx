import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Avatar,
  Rating,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CalendarToday,
  AccessTime,
  LocationOn,
  Person,
  Phone,
  Email,
  CheckCircle,
  Build,
  DirectionsCar,
} from '@mui/icons-material';
// Temporarily removed date picker imports to fix dependency issues
// import { DatePicker, TimePicker } from '@mui/x-date-pickers';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const ServiceBooking = ({ vehicleId, onBookingComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [serviceProviders, setServiceProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookingData, setBookingData] = useState({
    serviceType: '',
    selectedDate: null,
    selectedTime: null,
    vehicleInfo: '',
    description: '',
    urgency: 'normal',
  });
  const [confirmationDialog, setConfirmationDialog] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  const serviceTypes = [
    { value: 'maintenance', label: 'Regular Maintenance', icon: '🔧' },
    { value: 'repair', label: 'Repair Service', icon: '🛠️' },
    { value: 'inspection', label: 'Vehicle Inspection', icon: '🔍' },
    { value: 'oil-change', label: 'Oil Change', icon: '🛢️' },
    { value: 'tire-service', label: 'Tire Service', icon: '🛞' },
    { value: 'brake-service', label: 'Brake Service', icon: '🛑' },
    { value: 'battery', label: 'Battery Service', icon: '🔋' },
    { value: 'ac-service', label: 'AC Service', icon: '❄️' },
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low Priority', color: 'success' },
    { value: 'normal', label: 'Normal', color: 'primary' },
    { value: 'high', label: 'High Priority', color: 'warning' },
    { value: 'urgent', label: 'Urgent', color: 'error' },
  ];

  const steps = [
    'Select Service Type',
    'Choose Service Provider',
    'Pick Date & Time',
    'Confirm Details',
  ];

  useEffect(() => {
    if (activeStep === 1) {
      fetchServiceProviders();
    }
  }, [activeStep, bookingData.serviceType]);

  useEffect(() => {
    if (activeStep === 2 && selectedProvider) {
      fetchAvailableSlots();
    }
  }, [activeStep, selectedProvider, bookingData.selectedDate]);

  const fetchServiceProviders = async () => {
    try {
      setLoading(true);
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockProviders = [
        {
          id: 1,
          name: 'AutoCare Plus',
          rating: 4.8,
          reviewCount: 156,
          specialties: ['maintenance', 'repair', 'inspection'],
          location: 'Downtown Auto Center',
          distance: '2.3 miles',
          priceRange: '$$',
          availability: 'Same day',
          image: '/placeholder-garage.jpg',
          phone: '(555) 123-4567',
          email: 'service@autocare-plus.com',
        },
        {
          id: 2,
          name: 'QuickFix Motors',
          rating: 4.6,
          reviewCount: 89,
          specialties: ['oil-change', 'tire-service', 'brake-service'],
          location: 'Westside Service Hub',
          distance: '3.7 miles',
          priceRange: '$',
          availability: 'Next day',
          image: '/placeholder-garage.jpg',
          phone: '(555) 987-6543',
          email: 'info@quickfix-motors.com',
        },
        {
          id: 3,
          name: 'Premium Auto Service',
          rating: 4.9,
          reviewCount: 203,
          specialties: ['maintenance', 'repair', 'ac-service', 'battery'],
          location: 'Luxury Car Center',
          distance: '5.1 miles',
          priceRange: '$$$',
          availability: '2-3 days',
          image: '/placeholder-garage.jpg',
          phone: '(555) 456-7890',
          email: 'contact@premium-auto.com',
        },
      ];

      // Filter providers based on service type
      const filteredProviders = mockProviders.filter(provider =>
        provider.specialties.includes(bookingData.serviceType)
      );

      setServiceProviders(filteredProviders);
    } catch (error) {
      console.error('Failed to fetch service providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockSlots = [
        '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'
      ];

      setAvailableSlots(mockSlots);
    } catch (error) {
      console.error('Failed to fetch available slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleServiceTypeChange = (serviceType) => {
    setBookingData(prev => ({ ...prev, serviceType }));
    setSelectedProvider(null);
    handleNext();
  };

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
    handleNext();
  };

  const handleDateTimeSelect = () => {
    if (bookingData.selectedDate && bookingData.selectedTime) {
      handleNext();
    }
  };

  const handleBookingSubmit = async () => {
    try {
      setLoading(true);
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockBookingResult = {
        id: 'BK-' + Date.now(),
        status: 'confirmed',
        confirmationNumber: 'CNF-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        estimatedDuration: '2-3 hours',
        totalCost: '$150 - $200',
      };

      setBookingResult(mockBookingResult);
      setConfirmationDialog(true);
      onBookingComplete?.(mockBookingResult);
    } catch (error) {
      console.error('Failed to create booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderServiceTypeStep = () => (
    <Grid container spacing={2}>
      {serviceTypes.map((service) => (
        <Grid item xs={12} sm={6} md={4} key={service.value}>
          <Card
            sx={{
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3,
              },
              border: bookingData.serviceType === service.value ? 2 : 0,
              borderColor: 'primary.main',
            }}
            onClick={() => handleServiceTypeChange(service.value)}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h3" sx={{ mb: 1 }}>
                {service.icon}
              </Typography>
              <Typography variant="h6" gutterBottom>
                {service.label}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderProviderStep = () => (
    <Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {serviceProviders.map((provider) => (
            <Grid item xs={12} key={provider.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { boxShadow: 3 },
                  border: selectedProvider?.id === provider.id ? 2 : 0,
                  borderColor: 'primary.main',
                }}
                onClick={() => handleProviderSelect(provider)}
              >
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item>
                      <Avatar
                        src={provider.image}
                        sx={{ width: 60, height: 60 }}
                      >
                        <Build />
                      </Avatar>
                    </Grid>
                    <Grid item xs>
                      <Typography variant="h6" gutterBottom>
                        {provider.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Rating value={provider.rating} precision={0.1} readOnly size="small" />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {provider.rating} ({provider.reviewCount} reviews)
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Chip
                          icon={<LocationOn />}
                          label={`${provider.location} • ${provider.distance}`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`Price: ${provider.priceRange}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={`Available: ${provider.availability}`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {selectedProvider && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={handleNext}>
            Continue with {selectedProvider.name}
          </Button>
        </Box>
      )}
    </Box>
  );

  const renderDateTimeStep = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="Select Date"
            value={bookingData.selectedDate ? bookingData.selectedDate.toISOString().split('T')[0] : ''}
            onChange={(e) => setBookingData(prev => ({ 
              ...prev, 
              selectedDate: e.target.value ? new Date(e.target.value) : null 
            }))}
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              min: new Date().toISOString().split('T')[0]
            }}
          />
        </Grid>
        
        {bookingData.selectedDate && (
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Available Time Slots
            </Typography>
            {loading ? (
              <CircularProgress />
            ) : (
              <Grid container spacing={1}>
                {availableSlots.map((slot) => (
                  <Grid item key={slot}>
                    <Chip
                      label={slot}
                      clickable
                      color={bookingData.selectedTime === slot ? 'primary' : 'default'}
                      onClick={() => setBookingData(prev => ({ ...prev, selectedTime: slot }))}
                      icon={<AccessTime />}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        )}

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Vehicle Information"
            placeholder="e.g., 2020 Toyota Camry, License: ABC123"
            value={bookingData.vehicleInfo}
            onChange={(e) => setBookingData(prev => ({ ...prev, vehicleInfo: e.target.value }))}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Service Description"
            placeholder="Describe the issue or service needed..."
            value={bookingData.description}
            onChange={(e) => setBookingData(prev => ({ ...prev, description: e.target.value }))}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Urgency Level</InputLabel>
            <Select
              value={bookingData.urgency}
              label="Urgency Level"
              onChange={(e) => setBookingData(prev => ({ ...prev, urgency: e.target.value }))}
            >
              {urgencyLevels.map((level) => (
                <MenuItem key={level.value} value={level.value}>
                  <Chip label={level.label} color={level.color} size="small" />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {bookingData.selectedDate && bookingData.selectedTime && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={handleDateTimeSelect}>
                Continue to Confirmation
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  const renderConfirmationStep = () => (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        Please review your booking details before confirming.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Service Details
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar><Build /></Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={serviceTypes.find(s => s.value === bookingData.serviceType)?.label}
                    secondary="Service Type"
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar><CalendarToday /></Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={bookingData.selectedDate?.toLocaleDateString()}
                    secondary="Date"
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar><AccessTime /></Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={bookingData.selectedTime}
                    secondary="Time"
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar><DirectionsCar /></Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={bookingData.vehicleInfo || 'Not specified'}
                    secondary="Vehicle"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Service Provider
              </Typography>
              {selectedProvider && (
                <List dense>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar src={selectedProvider.image}>
                        <Build />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={selectedProvider.name}
                      secondary={`${selectedProvider.rating} ⭐ (${selectedProvider.reviewCount} reviews)`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar><LocationOn /></Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={selectedProvider.location}
                      secondary={selectedProvider.distance}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar><Phone /></Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={selectedProvider.phone}
                      secondary="Phone"
                    />
                  </ListItem>
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {bookingData.description && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Service Description
                </Typography>
                <Typography variant="body1">
                  {bookingData.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={handleBack}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleBookingSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
            >
              {loading ? 'Confirming...' : 'Confirm Booking'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Book a Service
      </Typography>

      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
            <StepContent>
              {index === 0 && renderServiceTypeStep()}
              {index === 1 && renderProviderStep()}
              {index === 2 && renderDateTimeStep()}
              {index === 3 && renderConfirmationStep()}
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmationDialog}
        onClose={() => setConfirmationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircle color="success" sx={{ mr: 1 }} />
            Booking Confirmed!
          </Box>
        </DialogTitle>
        <DialogContent>
          {bookingResult && (
            <Box>
              <Typography variant="body1" paragraph>
                Your service appointment has been successfully booked.
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary={bookingResult.confirmationNumber}
                    secondary="Confirmation Number"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={bookingResult.estimatedDuration}
                    secondary="Estimated Duration"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={bookingResult.totalCost}
                    secondary="Estimated Cost"
                  />
                </ListItem>
              </List>
              <Alert severity="info" sx={{ mt: 2 }}>
                You will receive a confirmation email shortly. The service provider will contact you 24 hours before your appointment.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmationDialog(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServiceBooking;