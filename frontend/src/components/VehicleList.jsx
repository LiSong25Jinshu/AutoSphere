import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Pagination,
  CircularProgress,
  Alert,
  Paper,
  Skeleton,
} from '@mui/material';
import {
  GridView,
  ViewList,
  Sort,
} from '@mui/icons-material';
import VehicleCard from './VehicleCard';

const VehicleList = ({
  vehicles = [],
  loading = false,
  error = null,
  totalCount = 0,
  currentPage = 1,
  pageSize = 12,
  onPageChange,
  onSortChange,
  onFavorite,
  onShare,
  favoriteVehicles = [],
}) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'price-low', 'price-high', 'mileage-low', 'mileage-high'

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleViewModeChange = (_, newViewMode) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const handleSortChange = (event) => {
    const newSortBy = event.target.value;
    setSortBy(newSortBy);
    onSortChange?.(newSortBy);
  };

  const handlePageChange = (_, page) => {
    onPageChange?.(page);
  };

  const getSortLabel = (sortValue) => {
    const sortLabels = {
      'newest': 'Newest First',
      'oldest': 'Oldest First',
      'price-low': 'Price: Low to High',
      'price-high': 'Price: High to Low',
      'mileage-low': 'Mileage: Low to High',
      'mileage-high': 'Mileage: High to Low',
      'year-new': 'Year: Newest First',
      'year-old': 'Year: Oldest First',
    };
    return sortLabels[sortValue] || 'Sort By';
  };

  const renderSkeletonCards = () => {
    return Array.from({ length: pageSize }).map((_, index) => (
      <Grid item xs={12} sm={6} md={4} lg={3} key={`skeleton-${index}`}>
        <Paper sx={{ height: '100%' }}>
          <Skeleton variant="rectangular" height={200} />
          <Box sx={{ p: 2 }}>
            <Skeleton variant="text" height={32} width="80%" />
            <Skeleton variant="text" height={24} width="60%" />
            <Box sx={{ display: 'flex', gap: 1, my: 1 }}>
              <Skeleton variant="text" height={20} width="30%" />
              <Skeleton variant="text" height={20} width="30%" />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Skeleton variant="rectangular" height={36} width="48%" />
              <Skeleton variant="rectangular" height={36} width="48%" />
            </Box>
          </Box>
        </Paper>
      </Grid>
    ));
  };

  const renderVehicleCards = () => {
    if (viewMode === 'grid') {
      return vehicles.map((vehicle) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={vehicle.id}>
          <VehicleCard
            vehicle={vehicle}
            onFavorite={onFavorite}
            onShare={onShare}
            isFavorited={favoriteVehicles.includes(vehicle.id)}
          />
        </Grid>
      ));
    } else {
      // List view - wider cards
      return vehicles.map((vehicle) => (
        <Grid item xs={12} key={vehicle.id}>
          <VehicleCard
            vehicle={vehicle}
            onFavorite={onFavorite}
            onShare={onShare}
            isFavorited={favoriteVehicles.includes(vehicle.id)}
            compact={true}
          />
        </Grid>
      ));
    }
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header with controls */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        {/* Results count */}
        <Typography variant="h6" component="div">
          {loading ? (
            <Skeleton width={200} />
          ) : (
            <>
              {totalCount > 0 ? (
                <>
                  Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount.toLocaleString()} vehicles
                </>
              ) : (
                'No vehicles found'
              )}
            </>
          )}
        </Typography>

        {/* Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Sort dropdown */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={handleSortChange}
              disabled={loading}
              startAdornment={<Sort sx={{ mr: 1 }} />}
            >
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="oldest">Oldest First</MenuItem>
              <MenuItem value="price-low">Price: Low to High</MenuItem>
              <MenuItem value="price-high">Price: High to Low</MenuItem>
              <MenuItem value="mileage-low">Mileage: Low to High</MenuItem>
              <MenuItem value="mileage-high">Mileage: High to Low</MenuItem>
              <MenuItem value="year-new">Year: Newest First</MenuItem>
              <MenuItem value="year-old">Year: Oldest First</MenuItem>
            </Select>
          </FormControl>

          {/* View mode toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
            disabled={loading}
          >
            <ToggleButton value="grid" aria-label="grid view">
              <GridView />
            </ToggleButton>
            <ToggleButton value="list" aria-label="list view">
              <ViewList />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Vehicle Grid/List */}
      <Grid container spacing={3}>
        {loading ? renderSkeletonCards() : renderVehicleCards()}
      </Grid>

      {/* Empty state */}
      {!loading && vehicles.length === 0 && (
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="h5" color="text.secondary">
            No vehicles found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Try adjusting your search criteria or filters to find more vehicles.
          </Typography>
        </Box>
      )}

      {/* Loading indicator */}
      {loading && vehicles.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
};

export default VehicleList;