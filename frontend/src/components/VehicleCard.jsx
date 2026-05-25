import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Share,
  DirectionsCar,
  LocalGasStation,
  Speed,
  Settings,
  LocationOn,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getVehiclePrimaryImage } from '../utils/imageUtils';

const VehicleCard = ({ 
  vehicle, 
  onFavorite, 
  onShare, 
  isFavorited = false,
  showLocation = true,
  compact = false 
}) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/vehicles/${vehicle.id}`);
  };

  const handleContact = () => {
    navigate(`/contact/dealer/${vehicle.dealerId}`, {
      state: { vehicleId: vehicle.id, vehicleName: vehicle.getDisplayName?.() || `${vehicle.year} ${vehicle.make} ${vehicle.model}` }
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
    if (!mileage) return 'N/A';
    return new Intl.NumberFormat('en-US').format(mileage) + ' miles';
  };

  const getAvailabilityColor = (type) => {
    switch (type) {
      case 'sale':
        return 'success';
      case 'rental':
        return 'info';
      case 'both':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getAvailabilityText = (type) => {
    switch (type) {
      case 'sale':
        return 'For Sale';
      case 'rental':
        return 'For Rent';
      case 'both':
        return 'Sale & Rent';
      default:
        return 'Available';
    }
  };

  const primaryImage = getVehiclePrimaryImage(vehicle);

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      {/* Vehicle Image */}
      <CardMedia
        component="img"
        height={compact ? 160 : 200}
        image={primaryImage}
        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
        sx={{
          objectFit: 'cover',
          cursor: 'pointer',
        }}
        onClick={handleViewDetails}
      />

      {/* Card Content */}
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Availability Badge */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Chip
            label={getAvailabilityText(vehicle.availabilityType)}
            color={getAvailabilityColor(vehicle.availabilityType)}
            size="small"
            variant="filled"
          />
          <Box>
            <Tooltip title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}>
              <IconButton
                size="small"
                onClick={() => onFavorite?.(vehicle.id)}
                color="error"
              >
                {isFavorited ? <Favorite /> : <FavoriteBorder />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Share vehicle">
              <IconButton
                size="small"
                onClick={() => onShare?.(vehicle)}
                color="primary"
              >
                <Share />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Vehicle Title */}
        <Typography 
          variant="h6" 
          component="h3" 
          gutterBottom
          sx={{ 
            fontWeight: 600,
            cursor: 'pointer',
            '&:hover': { color: 'primary.main' }
          }}
          onClick={handleViewDetails}
        >
          {vehicle.year} {vehicle.make} {vehicle.model}
        </Typography>

        {/* Price */}
        <Typography 
          variant="h5" 
          color="primary" 
          sx={{ fontWeight: 700, mb: 2 }}
        >
          {formatPrice(vehicle.price)}
        </Typography>

        {/* Vehicle Details */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Speed fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {formatMileage(vehicle.mileage)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LocalGasStation fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {vehicle.fuelType || 'N/A'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Settings fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {vehicle.transmission || 'N/A'}
            </Typography>
          </Box>
        </Box>

        {/* Body Type and Color */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          {vehicle.bodyType && (
            <Chip 
              label={vehicle.bodyType} 
              size="small" 
              variant="outlined"
              icon={<DirectionsCar />}
            />
          )}
          {vehicle.color && (
            <Chip 
              label={vehicle.color} 
              size="small" 
              variant="outlined"
            />
          )}
        </Box>

        {/* Location (if available) */}
        {showLocation && vehicle.location && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
            <LocationOn fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {vehicle.location}
            </Typography>
          </Box>
        )}

        {/* Description Preview */}
        {!compact && vehicle.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mt: 1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {vehicle.description}
          </Typography>
        )}
      </CardContent>

      {/* Card Actions */}
      <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
        <Button 
          variant="outlined" 
          fullWidth 
          onClick={handleViewDetails}
          sx={{ mr: 1 }}
        >
          View Details
        </Button>
        <Button 
          variant="contained" 
          fullWidth 
          onClick={handleContact}
        >
          Contact Dealer
        </Button>
      </CardActions>
    </Card>
  );
};

export default VehicleCard;