import { useState, useEffect } from 'react';
import { Container, Box, Typography } from '@mui/material';
import VehicleSearch from '../components/VehicleSearch';
import VehicleList from '../components/VehicleList';
import { vehicleService } from '../services/vehicleService';

const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchFilters, setSearchFilters] = useState({});
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [favoriteVehicles, setFavoriteVehicles] = useState([]);
  
  const pageSize = 12;

  useEffect(() => {
    fetchVehicles();
  }, [searchFilters, sortBy, currentPage]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare API filters
      const apiFilters = {
        page: currentPage,
        limit: pageSize,
        ...searchFilters
      };

      // Convert frontend filter format to backend format
      if (searchFilters.yearRange && Array.isArray(searchFilters.yearRange)) {
        apiFilters.minYear = searchFilters.yearRange[0];
        apiFilters.maxYear = searchFilters.yearRange[1];
        delete apiFilters.yearRange;
      }

      if (searchFilters.priceRange && Array.isArray(searchFilters.priceRange)) {
        apiFilters.minPrice = searchFilters.priceRange[0];
        apiFilters.maxPrice = searchFilters.priceRange[1];
        delete apiFilters.priceRange;
      }

      if (searchFilters.mileageRange && Array.isArray(searchFilters.mileageRange)) {
        apiFilters.minMileage = searchFilters.mileageRange[0];
        apiFilters.maxMileage = searchFilters.mileageRange[1];
        delete apiFilters.mileageRange;
      }

      // Map transmission and color filters
      if (searchFilters.transmission) {
        apiFilters.transmission = searchFilters.transmission.toLowerCase();
      }

      if (searchFilters.color) {
        apiFilters.color = searchFilters.color;
      }

      // Lowercase enum fields to match backend validation
      if (apiFilters.fuelType) {
        apiFilters.fuelType = apiFilters.fuelType.toLowerCase().replace(/-/g, '_').replace(/ /g, '_');
      }
      if (apiFilters.bodyType) {
        apiFilters.bodyType = apiFilters.bodyType.toLowerCase();
      }
      if (apiFilters.condition) {
        apiFilters.condition = apiFilters.condition.toLowerCase();
      }

      // Map frontend availability type to backend format
      if (apiFilters.availabilityType) {
        delete apiFilters.availabilityType;
      }

      // Strip any unknown keys that would cause backend validation to fail
      const ALLOWED_PARAMS = new Set([
        'page', 'limit', 'make', 'model', 'minYear', 'maxYear',
        'minPrice', 'maxPrice', 'minMileage', 'maxMileage',
        'condition', 'fuelType', 'transmission', 'bodyType',
        'color', 'featured', 'search', 'sortBy', 'sortOrder',
      ]);
      Object.keys(apiFilters).forEach((key) => {
        if (!ALLOWED_PARAMS.has(key)) delete apiFilters[key];
      });

      const result = await vehicleService.getVehicles(apiFilters);
      
      if (result.success) {
        // Backend returns: { success, data: [...], pagination: { total, page, limit, pages } }
        const responseBody = result.data;
        setVehicles(responseBody.data || []);
        setTotalCount(responseBody.pagination?.total || responseBody.data?.length || 0);
      } else {
        setError(result.message || 'Failed to load vehicles');
      }
      
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError('Failed to load vehicles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchData) => {
    setSearchFilters(searchData);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (filters) => {
    setSearchFilters(filters);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFavorite = (vehicleId) => {
    setFavoriteVehicles(prev => {
      if (prev.includes(vehicleId)) {
        return prev.filter(id => id !== vehicleId);
      } else {
        return [...prev, vehicleId];
      }
    });
  };

  const handleShare = (vehicle) => {
    if (navigator.share) {
      navigator.share({
        title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        text: `Check out this ${vehicle.year} ${vehicle.make} ${vehicle.model} for GH₵ ${vehicle.price.toLocaleString()}`,
        url: `${window.location.origin}/vehicles/${vehicle.id}`,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(`${window.location.origin}/vehicles/${vehicle.id}`);
      // You could show a toast notification here
      alert('Link copied to clipboard!');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Find Your Perfect Vehicle
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Browse our extensive collection of quality vehicles for sale and rent
        </Typography>
      </Box>

      {/* Search Component */}
      <VehicleSearch
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        initialFilters={searchFilters}
        loading={loading}
      />

      {/* Vehicle List */}
      <VehicleList
        vehicles={vehicles}
        loading={loading}
        error={error}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        onFavorite={handleFavorite}
        onShare={handleShare}
        favoriteVehicles={favoriteVehicles}
      />
    </Container>
  );
};

export default VehiclesPage;