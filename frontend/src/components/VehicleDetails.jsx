import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Grid, Typography, Button, Chip, Card, CardContent,
  ImageList, ImageListItem, Dialog, DialogContent, IconButton,
  Breadcrumbs, Link, Divider, List, ListItem, ListItemIcon, ListItemText,
  Paper, Skeleton, Alert, Tooltip,
} from '@mui/material';
import {
  ArrowBack, Close, Favorite, FavoriteBorder, Share, Print,
  DirectionsCar, LocalGasStation, Speed, Settings, Palette,
  CalendarToday, LocationOn, Phone, Email, Star, CheckCircle, NavigateNext,
} from '@mui/icons-material';
import { getVehicleImages } from '../utils/imageUtils';
import { vehicleService } from '../services/vehicleService';
import StartChatButton from './StartChatButton';

const VehicleDetails = ({ vehicleId, onFavorite, onShare, isFavorited = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const currentVehicleId = vehicleId || id;

  useEffect(() => {
    if (currentVehicleId) {
      fetchVehicleDetails(currentVehicleId);
    }
  }, [currentVehicleId]);

  const fetchVehicleDetails = async (idToFetch) => {
    try {
      setLoading(true);
      setError(null);
      // Fetch the real vehicle from the API
      const res = await vehicleService.getVehicleById(idToFetch);
      const vehicleData = res?.success ? (res.data?.data || res.data) : null;
      
      // Fallback mock vehicle data
      const mockVehicle = {
        id: idToFetch,
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
        condition: 'used',
        isAvailable: true,
        description: 'This well-maintained 2022 Toyota Camry offers exceptional reliability and fuel efficiency. Perfect for daily commuting or family trips. Features include advanced safety systems, comfortable interior, and modern technology.',
        images: [
          '/placeholder-car.jpg',
        ],
        features: [
          'Backup Camera',
          'Bluetooth Connectivity',
          'Cruise Control',
          'Keyless Entry',
          'Power Windows',
          'Air Conditioning',
          'Anti-lock Brakes',
        ],
        dealer: {
          id: 1,
          name: 'AutoSphere Motors',
          phone: '(555) 123-4567',
          email: 'sales@autosphere-motors.com',
          address: '123 Auto Lane, Car City, CC 12345',
          rating: 4.8,
          reviewCount: 127,
        },
      };
      
      if (vehicleData && vehicleData.id) {
        setVehicle(vehicleData);
      } else {
        setVehicle(mockVehicle);
      }
    } catch (err) {
      console.error('Failed to load vehicle details:', err);
      setError('Failed to load vehicle details');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setImageDialogOpen(true);
  };

  const formatPrice = (price) => {
    if (!price) return '—';
    return `GH₵ ${new Intl.NumberFormat('en-GH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)}`;
  };

  const formatMileage = (mileage) => {
    if (!mileage) return '—';
    return new Intl.NumberFormat('en-US').format(mileage) + ' miles';
  };

  const getAvailabilityColor = (type) => {
    switch (type) {
      case 'sale': return 'success';
      case 'rent':
      case 'rental': return 'info';
      case 'both': return 'warning';
      default: return 'default';
    }
  };

  const getAvailabilityText = (type) => {
    switch (type) {
      case 'sale': return 'For Sale';
      case 'rent':
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
            <Skeleton variant="rectangular" height={400} sx={{ mb: 2, borderRadius: 2 }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="rectangular" width={100} height={75} sx={{ borderRadius: 1 }} />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/vehicles')}>
          Back to Vehicles
        </Button>
      </Container>
    );
  }

  if (!vehicle) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info" sx={{ mb: 2 }}>Vehicle not found</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/vehicles')}>
          Back to Vehicles
        </Button>
      </Container>
    );
  }

  // Normalize image URLs
  const vehicleImages = getVehicleImages(vehicle);
  const primaryImage = vehicleImages[0] || (Array.isArray(vehicle.images) && vehicle.images[0]) || '/placeholder-car.jpg';

  // Extract / construct specifications safely
  const specs = vehicle.specifications || {
    'Make': vehicle.make,
    'Model': vehicle.model,
    'Year': vehicle.year,
    'Condition': vehicle.condition ? vehicle.condition.replace(/_/g, ' ') : 'Used',
    'Body Type': vehicle.bodyType,
    'Transmission': vehicle.transmission,
    'Fuel Type': vehicle.fuelType,
    'Color': vehicle.color || 'N/A',
    'Mileage': vehicle.mileage ? `${Number(vehicle.mileage).toLocaleString()} mi` : 'N/A',
    'VIN': vehicle.vin || 'N/A',
  };

  const featuresList = Array.isArray(vehicle.features) ? vehicle.features : [];

  // Safely resolve dealer data
  const dealer = vehicle.dealer || {};
  const dealerId = dealer.id || vehicle.dealerId || 1;
  const dealerName = dealer.name || `${dealer.firstName || ''} ${dealer.lastName || ''}`.trim() || 'AutoSphere Dealer';
  const dealerPhone = dealer.phone || '';
  const dealerEmail = dealer.email || '';
  const dealerAddress = dealer.address || (typeof vehicle.location === 'string' ? vehicle.location : (vehicle.location?.city ? `${vehicle.location.city}, ${vehicle.location.state || ''}` : 'Location on request'));
  const dealerRating = dealer.rating || 4.8;
  const dealerReviewCount = dealer.reviewCount || 12;

  // Build reference object for messaging with car image
  const messageReference = {
    type: vehicle.availabilityType === 'rent' ? 'rental' : 'vehicle',
    id: vehicle.id,
    title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    subtitle: `${formatPrice(vehicle.price)} · ${vehicle.condition ? vehicle.condition.replace(/_/g, ' ') : 'Used'}`,
    image: primaryImage,
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
        <Link color="inherit" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          Home
        </Link>
        <Link color="inherit" href="/vehicles" onClick={(e) => { e.preventDefault(); navigate('/vehicles'); }}>
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
          <Box sx={{ mb: 2, position: 'relative' }}>
            <img
              src={vehicleImages[selectedImageIndex] || primaryImage}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              style={{
                width: '100%',
                height: '400px',
                objectFit: 'cover',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              onClick={() => handleImageClick(selectedImageIndex)}
              onError={(e) => { e.target.src = '/placeholder-car.jpg'; }}
            />
          </Box>

          {/* Thumbnail Images */}
          {vehicleImages.length > 1 && (
            <ImageList cols={4} gap={8} sx={{ height: 100, mb: 3 }}>
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
                    onError={(e) => { e.target.src = '/placeholder-car.jpg'; }}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          )}

          {/* Vehicle Details */}
          <Card sx={{ mt: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                Vehicle Details
              </Typography>
              {vehicle.description && (
                <Typography variant="body1" paragraph color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {vehicle.description}
                </Typography>
              )}

              <Divider sx={{ my: 3 }} />

              {/* Specifications */}
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Specifications
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(specs).map(([key, value]) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #f0f0f0' }}>
                      <Typography variant="body2" color="text.secondary">
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
                      </Typography>
                      <Typography variant="body2" fontWeight="600">
                        {String(value)}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* Features */}
              {featuresList.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Features & Equipment
                  </Typography>
                  <Grid container spacing={1} sx={{ mt: 0.5 }}>
                    {featuresList.map((feature, index) => (
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
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Price and Actions */}
          <Card sx={{ mb: 3, borderRadius: 2 }}>
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

              <Typography variant="h5" gutterBottom fontWeight="bold">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Typography>

              {/* Key Details */}
              <List dense sx={{ my: 1 }}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}><Speed color="action" /></ListItemIcon>
                  <ListItemText primary={formatMileage(vehicle.mileage)} secondary="Mileage" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}><LocalGasStation color="action" /></ListItemIcon>
                  <ListItemText primary={vehicle.fuelType ? vehicle.fuelType.replace(/_/g, ' ') : 'N/A'} secondary="Fuel Type" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}><Settings color="action" /></ListItemIcon>
                  <ListItemText primary={vehicle.transmission || 'Automatic'} secondary="Transmission" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}><DirectionsCar color="action" /></ListItemIcon>
                  <ListItemText primary={vehicle.bodyType || 'Sedan'} secondary="Body Type" />
                </ListItem>
                {vehicle.color && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><Palette color="action" /></ListItemIcon>
                    <ListItemText primary={vehicle.color} secondary="Color" />
                  </ListItem>
                )}
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}><CalendarToday color="action" /></ListItemIcon>
                  <ListItemText primary={vehicle.year} secondary="Year" />
                </ListItem>
              </List>

              <Box sx={{ mt: 3 }}>
                <StartChatButton
                  userId={dealerId}
                  userName={dealerName}
                  userRole="dealer"
                  userPhone={dealerPhone}
                  label="💬 Message Dealer"
                  variant="primary"
                  size="md"
                  className="vd-contact-btn"
                  reference={messageReference}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Dealer Information */}
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Dealer Information
              </Typography>
              
              <Typography variant="h6" color="primary" gutterBottom fontWeight="600">
                {dealerName}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Star sx={{ color: '#f59e0b', mr: 0.5, fontSize: '1.2rem' }} />
                <Typography variant="body2" fontWeight="600">
                  {dealerRating}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                  ({dealerReviewCount} reviews)
                </Typography>
              </Box>

              <List dense sx={{ px: 0 }}>
                {dealerPhone && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><Phone color="action" /></ListItemIcon>
                    <ListItemText
                      primary={
                        <a
                          href={`tel:${dealerPhone.replace(/[\s\-().]/g, '')}`}
                          style={{ color: '#1976d2', fontWeight: 600, textDecoration: 'none' }}
                        >
                          {dealerPhone}
                        </a>
                      }
                      secondary="Tap to call"
                    />
                  </ListItem>
                )}
                {dealerEmail && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><Email color="action" /></ListItemIcon>
                    <ListItemText
                      primary={
                        <a
                          href={`mailto:${dealerEmail}`}
                          style={{ color: '#1976d2', textDecoration: 'none' }}
                        >
                          {dealerEmail}
                        </a>
                      }
                      secondary="Email"
                    />
                  </ListItem>
                )}
                {dealerAddress && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><LocationOn color="action" /></ListItemIcon>
                    <ListItemText
                      primary={dealerAddress}
                      secondary="Location"
                    />
                  </ListItem>
                )}
              </List>

              <Box sx={{ mt: 2 }}>
                <StartChatButton
                  userId={dealerId}
                  userName={dealerName}
                  userRole="dealer"
                  userPhone={dealerPhone}
                  label="💬 Chat with Dealer"
                  variant="outline"
                  size="md"
                  className="vd-contact-btn"
                  reference={messageReference}
                />
              </Box>
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
        <DialogContent sx={{ p: 0, position: 'relative', background: '#000' }}>
          <IconButton
            onClick={() => setImageDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1,
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
            }}
          >
            <Close />
          </IconButton>
          <img
            src={vehicleImages[selectedImageIndex] || primaryImage}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '85vh',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto',
            }}
            onError={(e) => { e.target.src = '/placeholder-car.jpg'; }}
          />
        </DialogContent>
      </Dialog>

      {/* Mobile floating contact button */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, position: 'fixed', bottom: 20, right: 20, zIndex: 1200 }}>
        <StartChatButton
          userId={dealerId}
          userName={dealerName}
          userRole="dealer"
          userPhone={dealerPhone}
          label="💬 Contact Dealer"
          variant="primary"
          size="md"
          reference={messageReference}
        />
      </Box>
    </Container>
  );
};

export default VehicleDetails;