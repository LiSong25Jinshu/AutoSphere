/**
 * mockData.js — in-memory fallback data used when the database is unavailable.
 * Used by bookings.js and vehicles.js routes.
 */

// ─── Mock Vehicles ────────────────────────────────────────────────────────────

const MOCK_VEHICLES = [
  {
    id: 1, make: 'Toyota', model: 'Camry', year: 2022, price: 145900,
    mileage: 18500, fuelType: 'Hybrid', transmission: 'Automatic',
    condition: 'used', status: 'available', availabilityType: 'sale',
    color: 'Silver', description: 'Well maintained hybrid sedan.',
    images: [], dealerId: 1,
    dealer: { id: 1, firstName: 'Demo', lastName: 'Dealer', email: 'dealer@demo.com', phone: '+233200000001' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 2, make: 'Honda', model: 'Civic', year: 2021, price: 124500,
    mileage: 25000, fuelType: 'Petrol', transmission: 'Automatic',
    condition: 'used', status: 'available', availabilityType: 'sale',
    color: 'White', description: 'Reliable and fuel-efficient.',
    images: [], dealerId: 1,
    dealer: { id: 1, firstName: 'Demo', lastName: 'Dealer', email: 'dealer@demo.com', phone: '+233200000001' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 3, make: 'BMW', model: 'X5', year: 2020, price: 228000,
    mileage: 32000, fuelType: 'Petrol', transmission: 'Automatic',
    condition: 'used', status: 'available', availabilityType: 'sale',
    color: 'Black', description: 'Luxury SUV in excellent condition.',
    images: [], dealerId: 1,
    dealer: { id: 1, firstName: 'Demo', lastName: 'Dealer', email: 'dealer@demo.com', phone: '+233200000001' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 4, make: 'Toyota', model: 'RAV4', year: 2023, price: 8500,
    mileage: 5000, fuelType: 'Petrol', transmission: 'Automatic',
    condition: 'new', status: 'available', availabilityType: 'rent',
    color: 'Red', description: 'Available for daily or weekly rental.',
    images: [], dealerId: 1,
    dealer: { id: 1, firstName: 'Demo', lastName: 'Dealer', email: 'dealer@demo.com', phone: '+233200000001' },
    createdAt: new Date().toISOString(),
  },
];

let mockBookings = [
  {
    id: 1, userId: 4, serviceProviderId: 2,
    serviceType: 'oil_change', title: 'Oil Change',
    status: 'confirmed', scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    scheduledTime: '10:00', estimatedCost: 180, customerNotes: 'Use synthetic oil.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    user: { id: 4, firstName: 'Test', lastName: 'Customer', email: 'test@autosphere.com', phone: '+233200000004' },
    serviceProvider: { id: 2, firstName: 'Demo', lastName: 'Provider', email: 'provider@demo.com', phone: '+233200000002' },
  },
];

let nextBookingId = 10;

// ─── Mock Vehicle Service ─────────────────────────────────────────────────────

export const mockVehicleService = {
  searchVehicles: async ({ make, model, minYear, maxYear, minPrice, maxPrice, fuelType,
    transmission, condition, availabilityType, limit = 20, offset = 0 } = {}) => {
    let results = [...MOCK_VEHICLES];
    if (make)             results = results.filter(v => v.make.toLowerCase().includes(make.toLowerCase()));
    if (model)            results = results.filter(v => v.model.toLowerCase().includes(model.toLowerCase()));
    if (minYear)          results = results.filter(v => v.year >= Number(minYear));
    if (maxYear)          results = results.filter(v => v.year <= Number(maxYear));
    if (minPrice)         results = results.filter(v => v.price >= Number(minPrice));
    if (maxPrice)         results = results.filter(v => v.price <= Number(maxPrice));
    if (fuelType)         results = results.filter(v => v.fuelType.toLowerCase() === fuelType.toLowerCase());
    if (transmission)     results = results.filter(v => v.transmission.toLowerCase() === transmission.toLowerCase());
    if (condition)        results = results.filter(v => v.condition === condition);
    if (availabilityType) results = results.filter(v => v.availabilityType === availabilityType);
    return results.slice(offset, offset + limit);
  },

  findFeatured: async ({ limit = 6, offset = 0 } = {}) => {
    return MOCK_VEHICLES.filter(v => v.status === 'available').slice(offset, offset + limit);
  },

  findByPk: async (id) => {
    return MOCK_VEHICLES.find(v => v.id === Number(id)) || null;
  },

  count: async ({ where = {} } = {}) => {
    let results = [...MOCK_VEHICLES];
    if (where.status) results = results.filter(v => v.status === where.status);
    return results.length;
  },
};

// ─── Mock Booking Service ─────────────────────────────────────────────────────

export const mockBookingService = {
  findAll: async ({ where = {}, order = [], limit = 20, offset = 0 } = {}) => {
    let results = [...mockBookings];
    if (where.userId)           results = results.filter(b => b.userId === where.userId);
    if (where.serviceProviderId) results = results.filter(b => b.serviceProviderId === where.serviceProviderId);
    if (where.status)           results = results.filter(b => b.status === where.status);
    return results.slice(offset, offset + limit);
  },

  findByPk: async (id) => {
    return mockBookings.find(b => b.id === Number(id)) || null;
  },

  count: async ({ where = {} } = {}) => {
    let results = [...mockBookings];
    if (where.userId)            results = results.filter(b => b.userId === where.userId);
    if (where.serviceProviderId) results = results.filter(b => b.serviceProviderId === where.serviceProviderId);
    if (where.status)            results = results.filter(b => b.status === where.status);
    return results.length;
  },

  create: async (data) => {
    const booking = {
      id: nextBookingId++,
      userId: data.userId,
      serviceProviderId: data.serviceProviderId,
      serviceType: data.serviceType,
      title: data.title || data.serviceType,
      description: data.description || '',
      status: 'pending',
      scheduledDate: data.scheduledDate || data.date,
      scheduledTime: data.scheduledTime || data.time,
      estimatedCost: data.estimatedCost || 0,
      customerNotes: data.customerNotes || data.notes || '',
      priority: data.priority || 'normal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: { id: data.userId, firstName: 'Customer', lastName: '', email: '', phone: '' },
      serviceProvider: { id: data.serviceProviderId, firstName: 'Provider', lastName: '', email: '', phone: '' },
    };
    mockBookings.push(booking);
    return booking;
  },

  update: async (id, data) => {
    const idx = mockBookings.findIndex(b => b.id === Number(id));
    if (idx === -1) return null;
    mockBookings[idx] = { ...mockBookings[idx], ...data, updatedAt: new Date().toISOString() };
    return mockBookings[idx];
  },

  destroy: async (id) => {
    const idx = mockBookings.findIndex(b => b.id === Number(id));
    if (idx !== -1) mockBookings.splice(idx, 1);
    return true;
  },
};
