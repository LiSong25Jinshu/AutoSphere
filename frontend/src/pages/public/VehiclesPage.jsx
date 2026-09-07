import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { vehicleService } from '../../services/vehicleService';
import { savedVehiclesAPI } from '../../services/api';
import './VehiclesPage.css';

const pageSize = 12;

const defaultFilters = {
  search: '',
  make: '',
  model: '',
  minPrice: '',
  maxPrice: '',
  condition: '',
  fuelType: '',
  transmission: '',
  bodyType: '',
  sortBy: 'newest',
};

const mockVehicles = [
  {
    id: 1,
    make: 'Toyota',
    model: 'Camry',
    year: 2023,
    price: 28900,
    mileage: 14000,
    condition: 'used',
    fuelType: 'gasoline',
    transmission: 'automatic',
    bodyType: 'sedan',
    color: 'Silver',
    location: { city: 'Lagos', state: 'Lagos' },
    images: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80'],
    dealer: { firstName: 'Daniel', lastName: 'Adebayo', phone: '+2348000000000' },
    status: 'available',
    isFeatured: true,
  },
  {
    id: 2,
    make: 'BMW',
    model: 'X5',
    year: 2022,
    price: 52000,
    mileage: 22000,
    condition: 'certified_pre_owned',
    fuelType: 'diesel',
    transmission: 'automatic',
    bodyType: 'suv',
    color: 'Black',
    location: { city: 'Abuja', state: 'FCT' },
    images: ['https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80'],
    dealer: { firstName: 'Grace', lastName: 'Musa', phone: '+2348000000001' },
    status: 'available',
    isFeatured: false,
  },
  {
    id: 3,
    make: 'Tesla',
    model: 'Model 3',
    year: 2024,
    price: 41000,
    mileage: 9000,
    condition: 'new',
    fuelType: 'electric',
    transmission: 'automatic',
    bodyType: 'sedan',
    color: 'White',
    location: { city: 'Port Harcourt', state: 'Rivers' },
    images: ['https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80'],
    dealer: { firstName: 'Emeka', lastName: 'Okafor', phone: '+2348000000002' },
    status: 'available',
    isFeatured: true,
  },
  {
    id: 4,
    make: 'Honda',
    model: 'Civic',
    year: 2021,
    price: 26800,
    mileage: 31000,
    condition: 'used',
    fuelType: 'gasoline',
    transmission: 'automatic',
    bodyType: 'sedan',
    color: 'Gray',
    location: { city: 'Kano', state: 'Kano' },
    images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'],
    dealer: { firstName: 'Musa', lastName: 'Sani', phone: '+2348000000003' },
    status: 'available',
    isFeatured: false,
  },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHC',
    maximumFractionDigits: 0,
  }).format(value);

const buildApiFilters = (filterState, currentPage) => {
  const apiFilters = {
    page: currentPage,
    limit: pageSize,
    ...filterState,
  };

  if (filterState.yearRange && Array.isArray(filterState.yearRange)) {
    apiFilters.minYear = filterState.yearRange[0];
    apiFilters.maxYear = filterState.yearRange[1];
    delete apiFilters.yearRange;
  }

  if (filterState.priceRange && Array.isArray(filterState.priceRange)) {
    apiFilters.minPrice = filterState.priceRange[0];
    apiFilters.maxPrice = filterState.priceRange[1];
    delete apiFilters.priceRange;
  }

  if (filterState.mileageRange && Array.isArray(filterState.mileageRange)) {
    apiFilters.minMileage = filterState.mileageRange[0];
    apiFilters.maxMileage = filterState.mileageRange[1];
    delete apiFilters.mileageRange;
  }

  if (apiFilters.transmission) {
    apiFilters.transmission = apiFilters.transmission.toLowerCase();
  }

  if (apiFilters.color) {
    apiFilters.color = apiFilters.color;
  }

  if (apiFilters.fuelType) {
    apiFilters.fuelType = apiFilters.fuelType.toLowerCase().replace(/-/g, '_').replace(/ /g, '_');
  }

  if (apiFilters.bodyType) {
    apiFilters.bodyType = apiFilters.bodyType.toLowerCase();
  }

  if (apiFilters.condition) {
    apiFilters.condition = apiFilters.condition.toLowerCase();
  }

  if (apiFilters.availabilityType) {
    delete apiFilters.availabilityType;
  }

  const allowedParams = new Set([
    'page', 'limit', 'make', 'model', 'minYear', 'maxYear',
    'minPrice', 'maxPrice', 'minMileage', 'maxMileage',
    'condition', 'fuelType', 'transmission', 'bodyType',
    'color', 'featured', 'search', 'sortBy', 'sortOrder',
  ]);

  Object.keys(apiFilters).forEach((key) => {
    if (!allowedParams.has(key)) delete apiFilters[key];
  });

  Object.keys(apiFilters).forEach((key) => {
    if (apiFilters[key] === '' || apiFilters[key] === undefined || apiFilters[key] ===null) {
      delete apiFilters[key];
    }
  });
  
  return apiFilters;
};

const VehicleCard = ({ vehicle, isAuthenticated, navigate, isSaved, onToggleSave, saving }) => {
  const handlePrimaryAction = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/vehicles/${vehicle.id}` } });
      return;
    }
    navigate(`/vehicles/${vehicle.id}`);
  };

  return (
    <article className="vehicle-card">
      <div className="vehicle-card-image-wrap">
        <img src={vehicle.images?.[0]} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} className="vehicle-card-image" />
        {vehicle.isFeatured && <span className="vehicle-badge">Featured</span>}
      </div>

      <div className="vehicle-card-body">
        <div className="vehicle-card-topline">
          <span className="vehicle-status">{vehicle.status}</span>
          <span className="vehicle-price">{formatCurrency(vehicle.price)}</span>
        </div>

        <h3 className="vehicle-name">{vehicle.year} {vehicle.make} {vehicle.model}</h3>

        <div className="vehicle-meta-grid">
          <span>{vehicle.mileage?.toLocaleString() || '0'} mi</span>
          <span>{vehicle.transmission}</span>
          <span>{vehicle.fuelType}</span>
        </div>

        <div className="vehicle-location">
          {vehicle.location?.city || 'City'}, {vehicle.location?.state || 'State'}
        </div>

        <div className="vehicle-card-actions">
          <button type="button" className="auto-btn auto-btn-primary" onClick={handlePrimaryAction}>
            {isAuthenticated ? 'View details' : 'Sign in to buy'}
          </button>
          <button
            type="button"
            className="auto-btn auto-btn-secondary"
            onClick={() => onToggleSave(vehicle.id)}
            disabled={saving}
          >
            {saving ? 'Saving…' : isSaved ? 'Remove saved' : 'Save'}
          </button>
        </div>
      </div>
    </article>
  );
};

const VehiclesPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState(mockVehicles);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(mockVehicles.length);
  const [savedVehicleIds, setSavedVehicleIds] = useState([]);
  const [savingVehicleId, setSavingVehicleId] = useState(null);

  useEffect(() => {
    const loadVehicles = async () => {
      setLoading(true);
      setError(null);

      try {
        const apiFilters = buildApiFilters(filters, currentPage);
        const response = await vehicleService.getVehicles(apiFilters);

        if (response.success) {
          const list = Array.isArray(response.data) ? response.data : [];
          const total = response.pagination?.total || list.length || 0;

          setVehicles(list);
          setTotalCount(total);

          if (list.length === 0) {
            setError('No vehicles match your current filters.');
          }
        } else {
          setVehicles([]);
          setTotalCount(0);
          setError(response.message || 'Failed to load vehicles');
        }
      } catch (err) {
        setVehicles([]);
        setTotalCount(0);
        setError('Failed to load vehicles. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadVehicles();
  }, [filters, currentPage]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSavedVehicleIds([]);
      return;
    }

    savedVehiclesAPI.getAll()
      .then((response) => {
        if (response.data?.success) {
          setSavedVehicleIds((response.data.data || []).map((vehicle) => vehicle.id));
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const handleToggleSave = async (vehicleId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/vehicles/${vehicleId}` } });
      return;
    }

    setSavingVehicleId(vehicleId);
    try {
      if (savedVehicleIds.includes(vehicleId)) {
        await savedVehiclesAPI.remove(vehicleId);
        setSavedVehicleIds((ids) => ids.filter((id) => id !== vehicleId));
      } else {
        await savedVehiclesAPI.save(vehicleId);
        setSavedVehicleIds((ids) => [...ids, vehicleId]);
      }
    } finally {
      setSavingVehicleId(null);
    }
  };

  const featuredVehicles = useMemo(
    () => vehicles.filter((vehicle) => vehicle.isFeatured).slice(0, 3),
    [vehicles]
  );

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchSubmit = () => {
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setCurrentPage(1);
    setFilters(defaultFilters);
  };

  return (
    <div className="vehicle-marketplace-page">
      <section className="vehicle-marketplace-hero">
        <div className="vehicle-marketplace-overlay" />
        <div className="vehicle-marketplace-content">
          <p className="eyebrow">AutoSphere Marketplace</p>
          <h1>Vehicle Marketplace</h1>
          <p>
            Discover high-quality cars from trusted dealers and reserve the right one for your next drive.
          </p>

          <div className="vehicle-search-bar">
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={(event) => {
                const value = event.target.value;
                setCurrentPage(1);
                setFilters((prev) => ({ ...prev, search: value }));
              }}
              placeholder="Search make, model, or keyword"
              aria-label="Search vehicles"
            />
            <button type="button" className="auto-btn auto-btn-primary" onClick={handleSearchSubmit}>
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="vehicle-marketplace-body">
        <aside className="vehicle-filters-panel">
          <div className="vehicle-filters-header">
            <h2>Filters</h2>
            <button type="button" className="link-button" onClick={clearFilters}>Clear all</button>
          </div>

          <div className="filter-group">
            <label>
              Make
              <input name="make" value={filters.make} onChange={handleFilterChange} placeholder="Toyota" />
            </label>
          </div>

          <div className="filter-group">
            <label>
              Model
              <input name="model" value={filters.model} onChange={handleFilterChange} placeholder="Camry" />
            </label>
          </div>

          <div className="filter-group two-column">
            <label>
              Min price
              <input name="minPrice" value={filters.minPrice} onChange={handleFilterChange} placeholder="5000000" />
            </label>
            <label>
              Max price
              <input name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} placeholder="20000000" />
            </label>
          </div>

          <div className="filter-group">
            <label>
              Condition
              <select name="condition" value={filters.condition} onChange={handleFilterChange}>
                <option value="">Any</option>
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="certified_pre_owned">Certified pre-owned</option>
              </select>
            </label>
          </div>

          <div className="filter-group">
            <label>
              Fuel type
              <select name="fuelType" value={filters.fuelType} onChange={handleFilterChange}>
                <option value="">Any</option>
                <option value="gasoline">Gasoline</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric</option>
                <option value="plug_in_hybrid">Plug-in hybrid</option>
              </select>
            </label>
          </div>

          <div className="filter-group">
            <label>
              Transmission
              <select name="transmission" value={filters.transmission} onChange={handleFilterChange}>
                <option value="">Any</option>
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
                <option value="cvt">CVT</option>
              </select>
            </label>
          </div>

          <div className="filter-group">
            <label>
              Body type
              <select name="bodyType" value={filters.bodyType} onChange={handleFilterChange}>
                <option value="">Any</option>
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="hatchback">Hatchback</option>
                <option value="truck">Truck</option>
                <option value="wagon">Wagon</option>
              </select>
            </label>
          </div>
        </aside>

        <main className="vehicle-results-panel">
          <div className="results-toolbar">
            <div>
              <h2>Available vehicles</h2>
              <p>{totalCount} matches</p>
            </div>

            <label className="sort-select-wrap">
              Sort by
              <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="mileage_asc">Mileage: low to high</option>
              </select>
            </label>
          </div>

          {error && (
            <div className="empty-state" style={{ color: '#b42318', paddingTop: '12px', paddingBottom: '12px' }}>
              {error}
            </div>
          )}

          <div className="featured-grid">
            {featuredVehicles.map((vehicle) => (
              <div key={vehicle.id} className="featured-card">
                <img src={vehicle.images?.[0]} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} />
                <div>
                  <p>{vehicle.year} {vehicle.make} {vehicle.model}</p>
                  <strong>{formatCurrency(vehicle.price)}</strong>
                </div>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="empty-state">Loading vehicles…</div>
          ) : vehicles.length === 0 ? (
            <div className="empty-state">No vehicles match your current filters.</div>
          ) : (
            <div className="vehicle-grid">
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  isAuthenticated={isAuthenticated}
                  navigate={navigate}
                  isSaved={savedVehicleIds.includes(vehicle.id)}
                  onToggleSave={handleToggleSave}
                  saving={savingVehicleId === vehicle.id}
                />
              ))}
            </div>
          )}
        </main>
      </section>

      <div className="vehicle-marketplace-footer">
        <p>Need a custom fit? <Link to="/register">Create an account</Link> to save vehicles and buy faster.</p>
      </div>
    </div>
  );
};

export default VehiclesPage;
