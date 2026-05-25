import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Typography,
  Chip,
  Collapse,
  Grid,
  Autocomplete,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess,
  Save,
  BookmarkBorder,
  Delete,
} from '@mui/icons-material';
import savedSearchService from '../services/savedSearchService';

const VehicleSearch = ({ 
  onSearch, 
  onFilterChange, 
  initialFilters = {},
  loading = false 
}) => {
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
  const [filters, setFilters] = useState({
    make: initialFilters.make || '',
    model: initialFilters.model || '',
    yearRange: initialFilters.yearRange || [2000, new Date().getFullYear()],
    priceRange: initialFilters.priceRange || [0, 100000],
    mileageRange: initialFilters.mileageRange || [0, 200000],
    fuelType: initialFilters.fuelType || '',
    transmission: initialFilters.transmission || '',
    bodyType: initialFilters.bodyType || '',
    availabilityType: initialFilters.availabilityType || '',
    color: initialFilters.color || '',
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  
  // Saved searches state
  const [savedSearches, setSavedSearches] = useState([]);
  const [savedSearchAnchor, setSavedSearchAnchor] = useState(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [makeSuggestions, setMakeSuggestions] = useState([]);

  // Mock data - in real app, these would come from API
  const carMakes = [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW', 'Mercedes-Benz',
    'Audi', 'Volkswagen', 'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Lexus'
  ];

  const fuelTypes = ['Gasoline', 'Diesel', 'Hybrid', 'Electric', 'Plug-in Hybrid'];
  const transmissionTypes = ['Manual', 'Automatic', 'CVT'];
  const bodyTypes = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Truck', 'Van'];
  const colors = ['Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Brown', 'Other'];

  useEffect(() => {
    updateActiveFilters();
  }, [filters, searchTerm]);

  // Load saved searches on mount
  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = async () => {
    try {
      const searches = await savedSearchService.getSavedSearches();
      setSavedSearches(searches);
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    }
  };

  const updateActiveFilters = () => {
    const active = [];
    
    if (searchTerm) active.push({ key: 'search', label: `Search: ${searchTerm}`, value: searchTerm });
    if (filters.make) active.push({ key: 'make', label: `Make: ${filters.make}`, value: filters.make });
    if (filters.model) active.push({ key: 'model', label: `Model: ${filters.model}`, value: filters.model });
    if (filters.yearRange[0] > 2000 || filters.yearRange[1] < new Date().getFullYear()) {
      active.push({ key: 'yearRange', label: `Year: ${filters.yearRange[0]}-${filters.yearRange[1]}`, value: filters.yearRange });
    }
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) {
      active.push({ key: 'priceRange', label: `Price: GH₵ ${filters.priceRange[0].toLocaleString()}-GH₵ ${filters.priceRange[1].toLocaleString()}`, value: filters.priceRange });
    }
    if (filters.mileageRange[0] > 0 || filters.mileageRange[1] < 200000) {
      active.push({ key: 'mileageRange', label: `Mileage: ${filters.mileageRange[0].toLocaleString()}-${filters.mileageRange[1].toLocaleString()} miles`, value: filters.mileageRange });
    }
    if (filters.fuelType) active.push({ key: 'fuelType', label: `Fuel: ${filters.fuelType}`, value: filters.fuelType });
    if (filters.transmission) active.push({ key: 'transmission', label: `Transmission: ${filters.transmission}`, value: filters.transmission });
    if (filters.bodyType) active.push({ key: 'bodyType', label: `Body: ${filters.bodyType}`, value: filters.bodyType });
    if (filters.availabilityType) active.push({ key: 'availabilityType', label: `Type: ${filters.availabilityType}`, value: filters.availabilityType });
    if (filters.color) active.push({ key: 'color', label: `Color: ${filters.color}`, value: filters.color });

    setActiveFilters(active);
  };

  const handleSearch = () => {
    const searchData = {
      search: searchTerm,
      ...filters,
    };
    onSearch?.(searchData);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.({ search: searchTerm, ...newFilters });
  };

  const handleRemoveFilter = (filterKey) => {
    if (filterKey === 'search') {
      setSearchTerm('');
      onFilterChange?.({ search: '', ...filters });
    } else {
      let resetValue;
      switch (filterKey) {
        case 'yearRange':
          resetValue = [2000, new Date().getFullYear()];
          break;
        case 'priceRange':
          resetValue = [0, 100000];
          break;
        case 'mileageRange':
          resetValue = [0, 200000];
          break;
        default:
          resetValue = '';
      }
      handleFilterChange(filterKey, resetValue);
    }
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilters({
      make: '',
      model: '',
      yearRange: [2000, new Date().getFullYear()],
      priceRange: [0, 100000],
      mileageRange: [0, 200000],
      fuelType: '',
      transmission: '',
      bodyType: '',
      availabilityType: '',
      color: '',
    });
    onFilterChange?.({
      search: '',
      make: '',
      model: '',
      yearRange: [2000, new Date().getFullYear()],
      priceRange: [0, 100000],
      mileageRange: [0, 200000],
      fuelType: '',
      transmission: '',
      bodyType: '',
      availabilityType: '',
      color: '',
    });
  };

  // Saved search handlers
  const handleSaveSearch = async () => {
    if (!searchName.trim()) {
      setSnackbar({ open: true, message: 'Please enter a name for this search', severity: 'error' });
      return;
    }

    try {
      const criteria = { search: searchTerm, ...filters };
      await savedSearchService.createSavedSearch(searchName, criteria, false);
      setSnackbar({ open: true, message: 'Search saved successfully', severity: 'success' });
      setSaveDialogOpen(false);
      setSearchName('');
      loadSavedSearches();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save search', severity: 'error' });
    }
  };

  const handleLoadSearch = (savedSearch) => {
    const criteria = savedSearch.searchCriteria;
    setSearchTerm(criteria.search || '');
    setFilters({
      make: criteria.make || '',
      model: criteria.model || '',
      yearRange: criteria.yearRange || [2000, new Date().getFullYear()],
      priceRange: criteria.priceRange || [0, 100000],
      mileageRange: criteria.mileageRange || [0, 200000],
      fuelType: criteria.fuelType || '',
      transmission: criteria.transmission || '',
      bodyType: criteria.bodyType || '',
      availabilityType: criteria.availabilityType || '',
      color: criteria.color || '',
    });
    setSavedSearchAnchor(null);
    setSnackbar({ open: true, message: `Loaded "${savedSearch.name}"`, severity: 'success' });
    
    // Trigger search with loaded criteria
    onFilterChange?.({ search: criteria.search || '', ...criteria });
  };

  const handleDeleteSearch = async (id, name) => {
    try {
      await savedSearchService.deleteSavedSearch(id);
      setSnackbar({ open: true, message: `Deleted "${name}"`, severity: 'success' });
      loadSavedSearches();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete search', severity: 'error' });
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      {/* Main Search Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by make, model, or keywords..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
          }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Searching...' : 'Search'}
        </Button>
        <Button
          variant="outlined"
          startIcon={<Save />}
          onClick={() => setSaveDialogOpen(true)}
          sx={{ minWidth: 120 }}
        >
          Save
        </Button>
        <Button
          variant="outlined"
          startIcon={<BookmarkBorder />}
          onClick={(e) => setSavedSearchAnchor(e.currentTarget)}
          sx={{ minWidth: 120 }}
        >
          Saved
        </Button>
        <Button
          variant="outlined"
          startIcon={<FilterList />}
          endIcon={showAdvancedFilters ? <ExpandLess /> : <ExpandMore />}
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          Filters
        </Button>
      </Box>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {activeFilters.map((filter) => (
            <Chip
              key={filter.key}
              label={filter.label}
              onDelete={() => handleRemoveFilter(filter.key)}
              color="primary"
              variant="outlined"
              size="small"
            />
          ))}
          <Button
            size="small"
            startIcon={<Clear />}
            onClick={handleClearAllFilters}
            sx={{ ml: 1 }}
          >
            Clear All
          </Button>
        </Box>
      )}

      {/* Advanced Filters */}
      <Collapse in={showAdvancedFilters}>
        <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Grid container spacing={3}>
            {/* Make and Model */}
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                options={makeSuggestions.length > 0 ? makeSuggestions : carMakes}
                value={filters.make}
                onChange={(_, value) => handleFilterChange('make', value || '')}
                onInputChange={async (_, value) => {
                  if (value && value.length >= 2) {
                    try {
                      const response = await fetch(
                        `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/vehicles/suggestions?q=${encodeURIComponent(value)}`
                      );
                      const data = await response.json();
                      if (data.success && data.data.makes) {
                        setMakeSuggestions(data.data.makes);
                      }
                    } catch (error) {
                      console.error('Failed to fetch suggestions:', error);
                    }
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Make" fullWidth />
                )}
                freeSolo
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Model"
                value={filters.model}
                onChange={(e) => handleFilterChange('model', e.target.value)}
              />
            </Grid>

            {/* Availability Type */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Availability</InputLabel>
                <Select
                  value={filters.availabilityType}
                  label="Availability"
                  onChange={(e) => handleFilterChange('availabilityType', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="sale">For Sale</MenuItem>
                  <MenuItem value="rental">For Rent</MenuItem>
                  <MenuItem value="both">Sale & Rent</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Body Type */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Body Type</InputLabel>
                <Select
                  value={filters.bodyType}
                  label="Body Type"
                  onChange={(e) => handleFilterChange('bodyType', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {bodyTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Year Range */}
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>Year Range</Typography>
              <Slider
                value={filters.yearRange}
                onChange={(_, value) => handleFilterChange('yearRange', value)}
                valueLabelDisplay="auto"
                min={1990}
                max={new Date().getFullYear() + 1}
                marks={[
                  { value: 2000, label: '2000' },
                  { value: 2010, label: '2010' },
                  { value: 2020, label: '2020' },
                  { value: new Date().getFullYear(), label: 'New' },
                ]}
              />
            </Grid>

            {/* Price Range */}
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>Price Range</Typography>
              <Slider
                value={filters.priceRange}
                onChange={(_, value) => handleFilterChange('priceRange', value)}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `$${value.toLocaleString()}`}
                min={0}
                max={150000}
                step={1000}
                marks={[
                  { value: 0, label: 'GH₵ 0' },
                  { value: 25000, label: 'GH₵ 25K' },
                  { value: 50000, label: 'GH₵ 50K' },
                  { value: 100000, label: 'GH₵ 100K' },
                ]}
              />
            </Grid>

            {/* Mileage Range */}
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>Mileage Range</Typography>
              <Slider
                value={filters.mileageRange}
                onChange={(_, value) => handleFilterChange('mileageRange', value)}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value.toLocaleString()} mi`}
                min={0}
                max={300000}
                step={5000}
                marks={[
                  { value: 0, label: '0' },
                  { value: 50000, label: '50K' },
                  { value: 100000, label: '100K' },
                  { value: 200000, label: '200K' },
                ]}
              />
            </Grid>

            {/* Fuel Type */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Fuel Type</InputLabel>
                <Select
                  value={filters.fuelType}
                  label="Fuel Type"
                  onChange={(e) => handleFilterChange('fuelType', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {fuelTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Transmission */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Transmission</InputLabel>
                <Select
                  value={filters.transmission}
                  label="Transmission"
                  onChange={(e) => handleFilterChange('transmission', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {transmissionTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Color */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Color</InputLabel>
                <Select
                  value={filters.color}
                  label="Color"
                  onChange={(e) => handleFilterChange('color', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {colors.map((color) => (
                    <MenuItem key={color} value={color}>{color}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Collapse>

      {/* Saved Searches Menu */}
      <Menu
        anchorEl={savedSearchAnchor}
        open={Boolean(savedSearchAnchor)}
        onClose={() => setSavedSearchAnchor(null)}
        PaperProps={{ sx: { minWidth: 250 } }}
      >
        {savedSearches.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No saved searches
            </Typography>
          </MenuItem>
        ) : (
          savedSearches.map((search) => (
            <MenuItem key={search.id} sx={{ display: 'flex', justifyContent: 'space-between', pr: 1 }}>
              <Box onClick={() => handleLoadSearch(search)} sx={{ flex: 1 }}>
                <ListItemText primary={search.name} />
              </Box>
              <ListItemIcon sx={{ minWidth: 'auto' }}>
                <Button
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSearch(search.id, search.name);
                  }}
                >
                  <Delete fontSize="small" />
                </Button>
              </ListItemIcon>
            </MenuItem>
          ))
        )}
      </Menu>

      {/* Save Search Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Search</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Search Name"
            fullWidth
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="e.g., Red SUVs under GH₵ 150k"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveSearch} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default VehicleSearch;