import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Chip,
  Avatar,
  Rating,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Skeleton,
  Alert,
  Pagination,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Search,
  FilterList,
  LocationOn,
  Phone,
  Email,
  Star,
  Build,
  ExpandMore,
  Favorite,
  FavoriteBorder,
  Directions,
  Schedule,
  AttachMoney,
  ViewList,
  ViewModule,
} from '@mui/icons-material';

const ServiceProviderSearch = ({ 
  onProviderSelect, 
  selectedServiceType,
  userLocation 
}) => {
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    serviceTypes: [],
    priceRange: [0, 300],
    rating: 0,
    distance: 50,
    availability: 'any',
    sortBy: 'rating',
  });
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState([]);
  const itemsPerPage = 6;

  const serviceTypes = [
    'maintenance', 'repair', 'inspection', 'oil-change', 
    'tire-service', 'brake-service', 'battery', 'ac-service'
  ];

  const sortOptions = [
    { value: 'rating', label: 'Highest Rated' },
    { value: 'distance', label: 'Nearest First' },
    { value: 'price-low', label: 'Lowest Price' },
    { value: 'price-high', label: 'Highest Price' },
    { value: 'availability', label: 'Soonest Available' },
  ];

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [providers, searchQuery, filters]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockProviders = [
        {
          id: 1,
          name: 'AutoCare Plus',
          rating: 4.8,
          reviewCount: 156,
          specialties: ['maintenance', 'repair', 'inspection'],
          location: 'Downtown Auto Center',
          address: '123 Main St, Auto City, AC 12345',
          distance: 2.3,
          priceRange: [80, 200],
          priceLevel: '$$',
          availability: 'same-day',
          nextAvailable: '2024-01-15T09:00:00',
          image: '/placeholder-garage.jpg',
          phone: '(555) 123-4567',
          email: 'service@autocare-plus.com',
          description: 'Full-service automotive repair and maintenance with certified technicians.',
          certifications: ['ASE Certified', 'AAA Approved'],
          workingHours: 'Mon-Fri: 8AM-6PM, Sat: 8AM-4PM',
          services: {
            'oil-change': { price: 45, duration: '30 min' },
            'brake-service': { price: 150, duration: '2 hours' },
            'maintenance': { price: 120, duration: '1.5 hours' },
          }
        },
        {
          id: 2,
          name: 'QuickFix Motors',
          rating: 4.6,
          reviewCount: 89,
          specialties: ['oil-change', 'tire-service', 'brake-service'],
          location: 'Westside Service Hub',
          address: '456 West Ave, Auto City, AC 12346',
          distance: 3.7,
          priceRange: [40, 150],
          priceLevel: '$',
          availability: 'next-day',
          nextAvailable: '2024-01-16T10:00:00',
          image: '/placeholder-garage.jpg',
          phone: '(555) 987-6543',
          email: 'info@quickfix-motors.com',
          description: 'Fast and affordable automotive services with no appointment necessary.',
          certifications: ['Quick Service Certified'],
          workingHours: 'Mon-Sat: 7AM-7PM, Sun: 9AM-5PM',
          services: {
            'oil-change': { price: 35, duration: '20 min' },
            'tire-service': { price: 80, duration: '45 min' },
            'brake-service': { price: 120, duration: '1.5 hours' },
          }
        },
        {
          id: 3,
          name: 'Premium Auto Service',
          rating: 4.9,
          reviewCount: 203,
          specialties: ['maintenance', 'repair', 'ac-service', 'battery'],
          location: 'Luxury Car Center',
          address: '789 Premium Blvd, Auto City, AC 12347',
          distance: 5.1,
          priceRange: [100, 300],
          priceLevel: '$$$',
          availability: '2-3-days',
          nextAvailable: '2024-01-18T11:00:00',
          image: '/placeholder-garage.jpg',
          phone: '(555) 456-7890',
          email: 'contact@premium-auto.com',
          description: 'Premium automotive services specializing in luxury and high-end vehicles.',
          certifications: ['ASE Master Certified', 'Luxury Brand Certified'],
          workingHours: 'Mon-Fri: 8AM-5PM, Sat: 9AM-3PM',
          services: {
            'maintenance': { price: 200, duration: '3 hours' },
            'ac-service': { price: 180, duration: '2 hours' },
            'battery': { price: 150, duration: '1 hour' },
          }
        },
        {
          id: 4,
          name: 'Express Lube & More',
          rating: 4.4,
          reviewCount: 67,
          specialties: ['oil-change', 'inspection', 'battery'],
          location: 'Highway Service Plaza',
          address: '321 Highway 1, Auto City, AC 12348',
          distance: 8.2,
          priceRange: [30, 120],
          priceLevel: '$',
          availability: 'same-day',
          nextAvailable: '2024-01-15T14:00:00',
          image: '/placeholder-garage.jpg',
          phone: '(555) 234-5678',
          email: 'service@express-lube.com',
          description: 'Quick oil changes and basic automotive services with drive-through convenience.',
          certifications: ['Express Service Certified'],
          workingHours: 'Daily: 7AM-8PM',
          services: {
            'oil-change': { price: 30, duration: '15 min' },
            'inspection': { price: 50, duration: '30 min' },
            'battery': { price: 100, duration: '30 min' },
          }
        },
      ];

      setProviders(mockProviders);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...providers];

    // Search query filter
    if (searchQuery) {
      filtered = filtered.filter(provider =>
        provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.specialties.some(specialty => 
          specialty.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Service type filter
    if (filters.serviceTypes.length > 0) {
      filtered = filtered.filter(provider =>
        filters.serviceTypes.some(type => provider.specialties.includes(type))
      );
    }

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(provider => provider.rating >= filters.rating);
    }

    // Distance filter
    filtered = filtered.filter(provider => provider.distance <= filters.distance);

    // Price range filter
    filtered = filtered.filter(provider =>
      provider.priceRange[0] <= filters.priceRange[1] &&
      provider.priceRange[1] >= filters.priceRange[0]
    );

    // Availability filter
    if (filters.availability !== 'any') {
      filtered = filtered.filter(provider => provider.availability === filters.availability);
    }

    // Sort results
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'distance':
          return a.distance - b.distance;
        case 'price-low':
          return a.priceRange[0] - b.priceRange[0];
        case 'price-high':
          return b.priceRange[1] - a.priceRange[1];
        case 'availability':
          return new Date(a.nextAvailable) - new Date(b.nextAvailable);
        default:
          return 0;
      }
    });

    setFilteredProviders(filtered);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleFavorite = (providerId) => {
    setFavorites(prev => 
      prev.includes(providerId)
        ? prev.filter(id => id !== providerId)
        : [...prev, providerId]
    );
  };

  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case 'same-day': return 'success';
      case 'next-day': return 'info';
      case '2-3-days': return 'warning';
      default: return 'default';
    }
  };

  const formatAvailability = (availability) => {
    switch (availability) {
      case 'same-day': return 'Same Day';
      case 'next-day': return 'Next Day';
      case '2-3-days': return '2-3 Days';
      default: return 'Available';
    }
  };

  const renderProviderCard = (provider) => (
    <Card key={provider.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar src={provider.image} sx={{ width: 50, height: 50 }}>
              <Build />
            </Avatar>
            <Box>
              <Typography variant="h6" component="div">
                {provider.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Rating value={provider.rating} precision={0.1} readOnly size="small" />
                <Typography variant="body2" color="text.secondary">
                  {provider.rating} ({provider.reviewCount})
                </Typography>
              </Box>
            </Box>
          </Box>
          <IconButton
            onClick={() => handleFavorite(provider.id)}
            color={favorites.includes(provider.id) ? 'error' : 'default'}
          >
            {favorites.includes(provider.id) ? <Favorite /> : <FavoriteBorder />}
          </IconButton>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          {provider.description}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <LocationOn fontSize="small" color="action" />
          <Typography variant="body2">
            {provider.location} • {provider.distance} miles
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label={`Price: ${provider.priceLevel}`}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip
            label={formatAvailability(provider.availability)}
            size="small"
            color={getAvailabilityColor(provider.availability)}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {provider.specialties.map((specialty) => (
            <Chip
              key={specialty}
              label={specialty.replace('-', ' ')}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>
      </CardContent>

      <Box sx={{ p: 2, pt: 0 }}>
        <Grid container spacing={1}>
          <Grid item xs={4}>
            <Button
              size="small"
              startIcon={<Phone />}
              onClick={() => window.open(`tel:${provider.phone}`)}
              fullWidth
            >
              Call
            </Button>
          </Grid>
          <Grid item xs={4}>
            <Button
              size="small"
              startIcon={<Directions />}
              onClick={() => window.open(`https://maps.google.com/?q=${provider.address}`)}
              fullWidth
            >
              Directions
            </Button>
          </Grid>
          <Grid item xs={4}>
            <Button
              size="small"
              variant="contained"
              onClick={() => onProviderSelect?.(provider)}
              fullWidth
            >
              Select
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Card>
  );

  const renderProviderList = (provider) => (
    <Card key={provider.id} sx={{ mb: 2 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Avatar src={provider.image} sx={{ width: 60, height: 60 }}>
              <Build />
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h6" gutterBottom>
              {provider.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Rating value={provider.rating} precision={0.1} readOnly size="small" />
              <Typography variant="body2" color="text.secondary">
                {provider.rating} ({provider.reviewCount} reviews)
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {provider.location} • {provider.distance} miles
            </Typography>
          </Grid>
          <Grid item>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
              <Chip
                label={formatAvailability(provider.availability)}
                size="small"
                color={getAvailabilityColor(provider.availability)}
              />
              <Button
                variant="contained"
                onClick={() => onProviderSelect?.(provider)}
              >
                Select Provider
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const paginatedProviders = filteredProviders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Box>
      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search providers, locations, or services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={filters.sortBy}
                  label="Sort By"
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  {sortOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
                fullWidth
              >
                <ToggleButton value="grid">
                  <ViewModule />
                </ToggleButton>
                <ToggleButton value="list">
                  <ViewList />
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
          </Grid>

          {/* Advanced Filters */}
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <FilterList sx={{ mr: 1 }} />
              <Typography>Advanced Filters</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Service Types</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {serviceTypes.map((type) => (
                      <Chip
                        key={type}
                        label={type.replace('-', ' ')}
                        clickable
                        color={filters.serviceTypes.includes(type) ? 'primary' : 'default'}
                        onClick={() => {
                          const newTypes = filters.serviceTypes.includes(type)
                            ? filters.serviceTypes.filter(t => t !== type)
                            : [...filters.serviceTypes, type];
                          handleFilterChange('serviceTypes', newTypes);
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Minimum Rating</Typography>
                  <Rating
                    value={filters.rating}
                    onChange={(e, newValue) => handleFilterChange('rating', newValue || 0)}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>
                    Distance: {filters.distance} miles
                  </Typography>
                  <Slider
                    value={filters.distance}
                    onChange={(e, newValue) => handleFilterChange('distance', newValue)}
                    min={1}
                    max={50}
                    marks={[
                      { value: 5, label: '5mi' },
                      { value: 25, label: '25mi' },
                      { value: 50, label: '50mi' },
                    ]}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>
                    Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
                  </Typography>
                  <Slider
                    value={filters.priceRange}
                    onChange={(e, newValue) => handleFilterChange('priceRange', newValue)}
                    min={0}
                    max={300}
                    marks={[
                      { value: 0, label: '$0' },
                      { value: 150, label: '$150' },
                      { value: 300, label: '$300' },
                    ]}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

      {/* Results */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {filteredProviders.length} Service Providers Found
        </Typography>
        {filteredProviders.length > itemsPerPage && (
          <Pagination
            count={Math.ceil(filteredProviders.length / itemsPerPage)}
            page={currentPage}
            onChange={(e, page) => setCurrentPage(page)}
          />
        )}
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} md={viewMode === 'grid' ? 6 : 12} key={i}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      ) : filteredProviders.length === 0 ? (
        <Alert severity="info">
          No service providers found matching your criteria. Try adjusting your filters.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {paginatedProviders.map((provider) => (
            <Grid 
              item 
              xs={12} 
              md={viewMode === 'grid' ? 6 : 12} 
              key={provider.id}
            >
              {viewMode === 'grid' ? renderProviderCard(provider) : renderProviderList(provider)}
            </Grid>
          ))}
        </Grid>
      )}

      {/* Bottom Pagination */}
      {filteredProviders.length > itemsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={Math.ceil(filteredProviders.length / itemsPerPage)}
            page={currentPage}
            onChange={(e, page) => setCurrentPage(page)}
          />
        </Box>
      )}
    </Box>
  );
};

export default ServiceProviderSearch;