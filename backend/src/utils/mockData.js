// Mock data storage for when database is not available
let mockBookings = [
  {
    id: 1,
    userId: 4, // Jane Customer from setup
    serviceProviderId: 3, // Mike Mechanic from setup
    vehicleId: 1,
    serviceType: 'oil_change',
    title: 'Regular Oil Change',
    description: 'Routine oil change and filter replacement',
    scheduledDate: '2026-02-15',
    scheduledTime: '10:00',
    estimatedDuration: 60,
    estimatedCost: 75.00,
    status: 'confirmed',
    priority: 'normal',
    customerNotes: 'Please use synthetic oil',
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01'),
    user: {
      id: 4,
      firstName: 'Jane',
      lastName: 'Customer',
      email: 'user@autosphere.com',
      phone: '+1234567892'
    },
    serviceProvider: {
      id: 3,
      firstName: 'Mike',
      lastName: 'Mechanic',
      email: 'service@autosphere.com',
      phone: '+1234567891'
    },
    vehicle: {
      id: 1,
      make: 'Toyota',
      model: 'Camry',
      year: 2023,
      vin: '1HGBH41JXMN109186'
    }
  },
  {
    id: 2,
    userId: 4,
    serviceProviderId: 3,
    vehicleId: null,
    serviceType: 'brake_service',
    title: 'Brake Inspection',
    description: 'Complete brake system inspection and service',
    scheduledDate: '2026-02-20',
    scheduledTime: '14:00',
    estimatedDuration: 120,
    estimatedCost: 150.00,
    status: 'pending',
    priority: 'high',
    customerNotes: 'Hearing squeaking noise when braking',
    createdAt: new Date('2026-02-02'),
    updatedAt: new Date('2026-02-02'),
    user: {
      id: 4,
      firstName: 'Jane',
      lastName: 'Customer',
      email: 'user@autosphere.com',
      phone: '+1234567892'
    },
    serviceProvider: {
      id: 3,
      firstName: 'Mike',
      lastName: 'Mechanic',
      email: 'service@autosphere.com',
      phone: '+1234567891'
    },
    vehicle: null
  },
  {
    id: 3,
    userId: 4,
    serviceProviderId: 3,
    vehicleId: 1,
    serviceType: 'tire_service',
    title: 'Tire Rotation & Balance',
    description: 'Rotate tires and wheel balancing service',
    scheduledDate: '2026-01-28',
    scheduledTime: '09:00',
    estimatedDuration: 90,
    estimatedCost: 85.00,
    actualCost: 85.00,
    status: 'completed',
    priority: 'normal',
    customerNotes: 'Regular maintenance',
    completedAt: new Date('2026-01-28'),
    rating: 5,
    review: 'Excellent service! Very professional and quick.',
    createdAt: new Date('2026-01-20'),
    updatedAt: new Date('2026-01-28'),
    user: {
      id: 4,
      firstName: 'Jane',
      lastName: 'Customer',
      email: 'user@autosphere.com',
      phone: '+1234567892'
    },
    serviceProvider: {
      id: 3,
      firstName: 'Mike',
      lastName: 'Mechanic',
      email: 'service@autosphere.com',
      phone: '+1234567891'
    },
    vehicle: {
      id: 1,
      make: 'Toyota',
      model: 'Camry',
      year: 2023,
      vin: '1HGBH41JXMN109186'
    }
  }
];

let nextId = 4;

export const mockBookingService = {
  findAll: (options = {}) => {
    let results = [...mockBookings];
    
    // Apply where clause filtering
    if (options.where) {
      Object.keys(options.where).forEach(key => {
        const value = options.where[key];
        results = results.filter(booking => booking[key] === value);
      });
    }
    
    // Apply ordering
    if (options.order) {
      const [field, direction] = options.order[0];
      results.sort((a, b) => {
        const aVal = new Date(a[field]);
        const bVal = new Date(b[field]);
        return direction === 'DESC' ? bVal - aVal : aVal - bVal;
      });
    }
    
    // Apply pagination
    if (options.limit && options.offset) {
      results = results.slice(options.offset, options.offset + options.limit);
    } else if (options.limit) {
      results = results.slice(0, options.limit);
    }
    
    return Promise.resolve(results);
  },

  findByPk: (id) => {
    const booking = mockBookings.find(b => b.id === parseInt(id));
    return Promise.resolve(booking || null);
  },

  create: (data) => {
    const newBooking = {
      id: nextId++,
      ...data,
      status: data.status || 'pending',
      priority: data.priority || 'normal',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: data.userId,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '+1234567890'
      },
      serviceProvider: {
        id: data.serviceProviderId,
        firstName: 'Service',
        lastName: 'Provider',
        email: 'provider@example.com',
        phone: '+1234567891'
      },
      vehicle: data.vehicleId ? {
        id: data.vehicleId,
        make: 'Test',
        model: 'Vehicle',
        year: 2023,
        vin: 'TEST123456789'
      } : null
    };
    
    mockBookings.push(newBooking);
    return Promise.resolve(newBooking);
  },

  update: (id, data) => {
    const index = mockBookings.findIndex(b => b.id === parseInt(id));
    if (index === -1) return Promise.resolve(null);
    
    mockBookings[index] = {
      ...mockBookings[index],
      ...data,
      updatedAt: new Date()
    };
    
    return Promise.resolve(mockBookings[index]);
  },

  count: (options = {}) => {
    let results = [...mockBookings];
    
    if (options.where) {
      Object.keys(options.where).forEach(key => {
        const value = options.where[key];
        results = results.filter(booking => booking[key] === value);
      });
    }
    
    return Promise.resolve(results.length);
  }
};

export default mockBookingService;