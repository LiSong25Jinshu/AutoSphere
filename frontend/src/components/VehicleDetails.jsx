import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Chip,
  Card,
  CardContent,
  ImageList,
  ImageListItem,
  Dialog,
  DialogContent,
  IconButton,
  Breadcrumbs,
  Link,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Skeleton,
  Alert,
  Tooltip,
  Fab,
} from '@mui/material';
import {
  ArrowBack,
  Close,
  Favorite,
  FavoriteBorder,
  Share,
  Print,
  DirectionsCar,
  LocalGasStation,
  Speed,
  Settings,
  Palette,
  CalendarToday,
  LocationOn,
  Phone,
  Email,
  Star,
  CheckCircle,
  NavigateNext,
} from '@mui/icons-material';
import { getVehicleImages } from '../utils/imageUtils';

const VehicleDetails = ({ vehicleId, onFavorite, onShare, isFavorited = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const currentVehicleId = vehicleId || id;

  // Normalize image URLs (handles localhost refs in production)
  const vehicleImages = vehicle ? getVehicleImages(vehicle) : [];

  useEffect(() => {
    if (currentVehicleId) {
      fetchVehicleDetails(currentVehicleId);
    }
  }, [currentVehicleId]);

  const fetchVehicleDetails = async (id) => {
    try {
      setLoading(true);
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock vehicle data
      const mockVehicle = {
        id: id,
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        price: 28500,
        mileage: 15000,
        fuelType: 'Gasoline',
        transmission: 'Automatic',
        bodyType: 'Sedan',
        color: 'Silver',
        availabilityType: 'sale',
        isAvailable: true,
        description: 'This well-maintained 2022 Toyota Camry offers exceptional reliability and fuel efficiency. Perfect for daily commuting or family trips. Features include advanced safety systems, comfortable interior, and modern technology.',
        images: [
          '/placeholder-car.jpg',
          '/placeholder-car-2.jpg',
          '/placeholder-car-3.jpg',
          '/placeholder-car-4.jpg',
        ],
        features: [
          'Backup Camera',
          'Bluetooth Connectivity',
          'Cruise Control',
          'Keyless Entry',
          'Power Windows',
          'Air Conditioning',
          'Anti-lock Brakes',
          'Electronic Stability Control',
          'Airbags',
          'Power Steering',
        ],
        dealer: {
          id: 1,
          name: 'AutoSphere Motors',
          phone: '(555) 123-4567',
          email: 'sales@autosphere-motors.com',
          address: '123 Auto Lane, Car City, CC 12345',
          rating: 4.5,
          reviewCount: 127,
        },
        specifications: {
          engine: '2.5L 4-Cylinder',
          horsepower: '203 HP',
          torque: '184 lb-ft',
          fuelEconomy: '28 city / 39 highway MPG',
          drivetrain: 'Front-Wheel Drive',
          seating: '5 passengers',
          doors: '4 doors',
          vin: '1HGBH41JXMN109186',
        },
        createdAt: '2024-01-15',
        updatedAt: '2024-01-20',
      };
      
      setVehicle(mockVehicle);
    } catch (err) {
      setError('Failed to load vehicle details');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setImageDialogOpen(true);
  };

  const handleContactDealer = () => {
    navigate(`/contact/dealer/${vehicle.dealer.id}`, {
      state: { 
        vehicleId: vehicle.id, 
        vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}` 
      }
    });
  };

  const formatPrice = (price) => {
    if (!price) return '—';
    return `GH₵ ${new Intl.NumberFormat('en-GH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)}`;
  };

  const formatMileage = (mileage) => {
    return new Intl.NumberFormat('en-US').format(mileage) + ' miles';
  };

  const getAvailabilityColor = (type) => {
    switch (type) {
      case 'sale': return 'success';
      case 'rental': return 'info';
      case 'both': return 'warning';
      default: return 'default';
    }
  };

  const getAvailabilityText = (type) => {
    switch (type) {
      case 'sale': return 'For Sale';
      case 'rental': return 'For Rent';
      case 'both': return 'Sale & Rent';
      default: return 'Available';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="rectangular" width={100} height={75} />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={300} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!vehicle) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">Vehicle not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
        <Link color="inherit" href="/" onClick={() => navigate('/')}>
          Home
        </Link>
        <Link color="inherit" href="/vehicles" onClick={() => navigate('/vehicles')}>
          Vehicles
        </Link>
        <Typography color="text.primary">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </Typography>
      </Breadcrumbs>

      {/* Back Button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back to Results
      </Button>

      <Grid container spacing={4}>
        {/* Images Section */}
        <Grid item xs={12} md={8}>
          {/* Main Image */}
          <Box sx={{ mb: 2 }}>
            <img
              src={vehicleImages[selectedImageIndex]}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              style={{
                width: '100%',
                height: '400px',
                objectFit: 'cover',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              onClick={() => handleImageClick(selectedImageIndex)}
            />
          </Box>

          {/* Thumbnail Images */}
          <ImageList cols={4} gap={8} sx={{ height: 100 }}>
            {vehicleImages.map((image, index) => (
              <ImageListItem key={index}>
                <img
                  src={image}
                  alt={`View ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    cursor: 'pointer',
                    border: selectedImageIndex === index ? '2px solid #1976d2' : '2px solid transparent',
                    borderRadius: '4px',
                  }}
                  onClick={() => setSelectedImageIndex(index)}
                />
              </ImageListItem>
            ))}
          </ImageList>

          {/* Vehicle Details */}
          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Vehicle Details
              </Typography>
              <Typography variant="body1" paragraph>
                {vehicle.description}
              </Typography>

              <Divider sx={{ my: 3 }} />

              {/* Specifications */}
              <Typography variant="h6" gutterBottom>
                Specifications
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(vehicle.specifications).map(([key, value]) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Features */}
              <Typography variant="h6" gutterBottom>
                Features & Equipment
              </Typography>
              <Grid container spacing={1}>
                {vehicle.features.map((feature, index) => (
                  <Grid item key={index}>
                    <Chip
                      icon={<CheckCircle />}
                      label={feature}
                      variant="outlined"
                      size="small"
                      color="success"
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Price and Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {formatPrice(vehicle.price)}
                  </Typography>
                  <Chip
                    label={getAvailabilityText(vehicle.availabilityType)}
                    color={getAvailabilityColor(vehicle.availabilityType)}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
                <Box>
                  <Tooltip title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}>
                    <IconButton
                      onClick={() => onFavorite?.(vehicle.id)}
                      color="error"
                    >
                      {isFavorited ? <Favorite /> : <FavoriteBorder />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Share vehicle">
                    <IconButton
                      onClick={() => onShare?.(vehicle)}
                      color="primary"
                    >
                      <Share />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Print details">
                    <IconButton onClick={() => window.print()}>
                      <Print />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Typography variant="h5" gutterBottom>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Typography>

              {/* Key Details */}
              <List dense>
                <ListItem>
                  <ListItemIcon><Speed /></ListItemIcon>
                  <ListItemText primary={formatMileage(vehicle.mileage)} secondary="Mileage" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><LocalGasStation /></ListItemIcon>
                  <ListItemText primary={vehicle.fuelType} secondary="Fuel Type" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Settings /></ListItemIcon>
                  <ListItemText primary={vehicle.transmission} secondary="Transmission" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><DirectionsCar /></ListItemIcon>
                  <ListItemText primary={vehicle.bodyType} secondary="Body Type" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Palette /></ListItemIcon>
                  <ListItemText primary={vehicle.color} secondary="Color" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CalendarToday /></ListItemIcon>
                  <ListItemText primary={vehicle.year} secondary="Year" />
                </ListItem>
              </List>

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleContactDealer}
                sx={{ mt: 2 }}
              >
                Contact Dealer
              </Button>
            </CardContent>
          </Card>

          {/* Dealer Information */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Dealer Information
              </Typography>
              
              <Typography variant="h6" color="primary" gutterBottom>
                {vehicle.dealer.name}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Star sx={{ color: 'gold', mr: 0.5 }} />
                <Typography variant="body2">
                  {vehicle.dealer.rating} ({vehicle.dealer.reviewCount} reviews)
                </Typography>
              </Box>

              <List dense>
                <ListItem>
                  <ListItemIcon><Phone /></ListItemIcon>
                  <ListItemText
                    primary={
                      vehicle.dealer.phone
                        ? <a
                            href={`tel:${vehicle.dealer.phone.replace(/[\s\-().]/g, '')}`}
                            style={{ color: '#1976d2', fontWeight: 600, textDecoration: 'none' }}
                          >
                            {vehicle.dealer.phone}
                          </a>
                        : '—'
                    }
                    secondary="Tap to call"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Email /></ListItemIcon>
                  <ListItemText
                    primary={
                      vehicle.dealer.email
                        ? <a
                            href={`mailto:${vehicle.dealer.email}`}
                            style={{ color: '#1976d2', textDecoration: 'none' }}
                          >
                            {vehicle.dealer.email}
                          </a>
                        : '—'
                    }
                    secondary="Email"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><LocationOn /></ListItemIcon>
                  <ListItemText
                    primary={vehicle.dealer.address}
                    secondary="Address"
                  />
                </ListItem>
              </List>

              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate(`/dealers/${vehicle.dealer.id}`)}
                sx={{ mt: 2 }}
              >
                View Dealer Profile
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Image Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={() => setImageDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1,
            }}
          >
            <Close />
          </IconButton>
          <img
            src={vehicleImages[selectedImageIndex]}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '80vh',
              objectFit: 'contain',
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Floating Action Button for mobile contact */}
      <Fab
        color="primary"
        onClick={handleContactDealer}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' },
        }}
      >
        <Phone />
      </Fab>
    </Container>
  );
};

export default VehicleDetails;