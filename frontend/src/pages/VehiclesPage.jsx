import React, { useState, useEffect } from 'react';
import { Container, Box, Typography } from '@mui/material';
import VehicleSearch from '../components/VehicleSearch';
import VehicleList from '../components/VehicleList';

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
      
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock vehicle data
      const mockVehicles = generateMockVehicles();
      
      // Apply filters and sorting (mock implementation)
      let filteredVehicles = mockVehicles;
      
      // Apply search filter
      if (searchFilters.search) {
        filteredVehicles = filteredVehicles.filter(vehicle =>
          `${vehicle.make} ${vehicle.model} ${vehicle.year}`.toLowerCase()
            .includes(searchFilters.search.toLowerCase())
        );
      }
      
      // Apply other filters
      if (searchFilters.make) {
        filteredVehicles = filteredVehicles.filter(vehicle => 
          vehicle.make === searchFilters.make
        );
      }
      
      if (searchFilters.availabilityType) {
        filteredVehicles = filteredVehicles.filter(vehicle => 
          vehicle.availabilityType === searchFilters.availabilityType
        );
      }
      
      // Apply price range filter
      if (searchFilters.priceRange) {
        filteredVehicles = filteredVehicles.filter(vehicle => 
          vehicle.price >= searchFilters.priceRange[0] && 
          vehicle.price <= searchFilters.priceRange[1]
        );
      }
      
      // Apply sorting
      filteredVehicles.sort((a, b) => {
        switch (sortBy) {
          case 'price-low':
            return a.price - b.price;
          case 'price-high':
            return b.price - a.price;
          case 'mileage-low':
            return a.mileage - b.mileage;
          case 'mileage-high':
            return b.mileage - a.mileage;
          case 'year-new':
            return b.year - a.year;
          case 'year-old':
            return a.year - b.year;
          case 'oldest':
            return new Date(a.createdAt) - new Date(b.createdAt);
          case 'newest':
          default:
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
      });
      
      const totalCount = filteredVehicles.length;
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedVehicles = filteredVehicles.slice(startIndex, startIndex + pageSize);
      
      setVehicles(paginatedVehicles);
      setTotalCount(totalCount);
      
    } catch (err) {
      setError('Failed to load vehicles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateMockVehicles = () => {
    const makes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW', 'Mercedes-Benz', 'Audi'];
    const models = {
      Toyota: ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius'],
      Honda: ['Civic', 'Accord', 'CR-V', 'Pilot', 'Fit'],
      Ford: ['F-150', 'Escape', 'Explorer', 'Mustang', 'Focus'],
      Chevrolet: ['Silverado', 'Equinox', 'Malibu', 'Tahoe', 'Cruze'],
      Nissan: ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Leaf'],
      BMW: ['3 Series', '5 Series', 'X3', 'X5', 'i3'],
      'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC', 'GLE', 'A-Class'],
      Audi: ['A4', 'A6', 'Q5', 'Q7', 'e-tron'],
    };
    const colors = ['Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Green'];
    const fuelTypes = ['Gasoline', 'Diesel', 'Hybrid', 'Electric'];
    const transmissions = ['Manual', 'Automatic', 'CVT'];
    const bodyTypes = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Truck'];
    const availabilityTypes = ['sale', 'rental', 'both'];

    return Array.from({ length: 50 }, (_, index) => {
      const make = makes[Math.floor(Math.random() * makes.length)];
      const model = models[make][Math.floor(Math.random() * models[make].length)];
      const year = 2015 + Math.floor(Math.random() * 9);
      
      return {
        id: index + 1,
        make,
        model,
        year,
        price: 15000 + Math.floor(Math.random() * 50000),
        mileage: Math.floor(Math.random() * 100000),
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        transmission: transmissions[Math.floor(Math.random() * transmissions.length)],
        bodyType: bodyTypes[Math.floor(Math.random() * bodyTypes.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        availabilityType: availabilityTypes[Math.floor(Math.random() * availabilityTypes.length)],
        isAvailable: true,
        description: `This ${year} ${make} ${model} is in excellent condition and ready for its next owner. Well-maintained with regular service records.`,
        images: [
          '/placeholder-car.jpg',
          '/placeholder-car-2.jpg',
          '/placeholder-car-3.jpg',
        ],
        dealerId: Math.floor(Math.random() * 10) + 1,
        location: 'Auto City, AC',
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
    });
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
        text: `Check out this ${vehicle.year} ${vehicle.make} ${vehicle.model} for $${vehicle.price.toLocaleString()}`,
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