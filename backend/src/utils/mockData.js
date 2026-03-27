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

// Mock vehicle data storage
let mockVehicles = [
  {
    id: 1,
    dealerId: 2, // Assuming dealer user ID
    make: 'Toyota',
    model: 'Camry',
    year: 2023,
    price: 28500.00,
    mileage: 15000,
    condition: 'used',
    fuelType: 'gasoline',
    transmission: 'automatic',
    bodyType: 'sedan',
    color: 'Silver',
    vin: '1HGBH41JXMN109186',
    description: 'Excellent condition Toyota Camry with low mileage. Well-maintained with regular service records.',
    features: ['Backup Camera', 'Bluetooth', 'Cruise Control', 'Power Windows'],
    images: ['/placeholder-car.jpg', '/placeholder-car-2.jpg'],
    status: 'available',
    location: { city: 'Auto City', state: 'AC', zipCode: '12345' },
    viewCount: 45,
    isFeatured: true,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
    dealer: {
      id: 2,
      firstName: 'John',
      lastName: 'Dealer',
      email: 'dealer@autosphere.com',
      phone: '+1234567890'
    }
  },
  {
    id: 2,
    dealerId: 2,
    make: 'Honda',
    model: 'CR-V',
    year: 2022,
    price: 32000.00,
    mileage: 22000,
    condition: 'used',
    fuelType: 'gasoline',
    transmission: 'automatic',
    bodyType: 'suv',
    color: 'Black',
    vin: '2HGBH41JXMN109187',
    description: 'Reliable Honda CR-V SUV perfect for families. Great fuel economy and safety features.',
    features: ['All-Wheel Drive', 'Apple CarPlay', 'Lane Keeping Assist', 'Heated Seats'],
    images: ['/placeholder-car.jpg', '/placeholder-car-2.jpg'],
    status: 'available',
    location: { city: 'Auto City', state: 'AC', zipCode: '12345' },
    viewCount: 32,
    isFeatured: false,
    createdAt: new Date('2026-01-20'),
    updatedAt: new Date('2026-01-20'),
    dealer: {
      id: 2,
      firstName: 'John',
      lastName: 'Dealer',
      email: 'dealer@autosphere.com',
      phone: '+1234567890'
    }
  },
  {
    id: 3,
    dealerId: 2,
    make: 'Ford',
    model: 'F-150',
    year: 2024,
    price: 45000.00,
    mileage: 5000,
    condition: 'used',
    fuelType: 'gasoline',
    transmission: 'automatic',
    bodyType: 'truck',
    color: 'Blue',
    vin: '3HGBH41JXMN109188',
    description: 'Nearly new Ford F-150 truck with excellent towing capacity and modern features.',
    features: ['4WD', 'Tow Package', 'Navigation', 'Premium Sound'],
    images: ['/placeholder-car.jpg', '/placeholder-car-2.jpg'],
    status: 'available',
    location: { city: 'Auto City', state: 'AC', zipCode: '12345' },
    viewCount: 67,
    isFeatured: true,
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01'),
    dealer: {
      id: 2,
      firstName: 'John',
      lastName: 'Dealer',
      email: 'dealer@autosphere.com',
      phone: '+1234567890'
    }
  },
  {
    id: 4,
    dealerId: 2,
    make: 'BMW',
    model: '3 Series',
    year: 2021,
    price: 38000.00,
    mileage: 28000,
    condition: 'used',
    fuelType: 'gasoline',
    transmission: 'automatic',
    bodyType: 'sedan',
    color: 'White',
    vin: '4HGBH41JXMN109189',
    description: 'Luxury BMW 3 Series with premium features and excellent performance.',
    features: ['Leather Seats', 'Sunroof', 'Premium Audio', 'Sport Package'],
    images: ['/placeholder-car.jpg', '/placeholder-car-2.jpg'],
    status: 'available',
    location: { city: 'Auto City', state: 'AC', zipCode: '12345' },
    viewCount: 89,
    isFeatured: false,
    createdAt: new Date('2026-01-25'),
    updatedAt: new Date('2026-01-25'),
    dealer: {
      id: 2,
      firstName: 'John',
      lastName: 'Dealer',
      email: 'dealer@autosphere.com',
      phone: '+1234567890'
    }
  },
  {
    id: 5,
    dealerId: 2,
    make: 'Tesla',
    model: 'Model 3',
    year: 2023,
    price: 42000.00,
    mileage: 8000,
    condition: 'used',
    fuelType: 'electric',
    transmission: 'automatic',
    bodyType: 'sedan',
    color: 'Red',
    vin: '5HGBH41JXMN109190',
    description: 'Electric Tesla Model 3 with autopilot and supercharging capability.',
    features: ['Autopilot', 'Supercharging', 'Premium Interior', 'Over-the-Air Updates'],
    images: ['/placeholder-car.jpg', '/placeholder-car-2.jpg'],
    status: 'available',
    location: { city: 'Auto City', state: 'AC', zipCode: '12345' },
    viewCount: 156,
    isFeatured: true,
    createdAt: new Date('2026-02-05'),
    updatedAt: new Date('2026-02-05'),
    dealer: {
      id: 2,
      firstName: 'John',
      lastName: 'Dealer',
      email: 'dealer@autosphere.com',
      phone: '+1234567890'
    }
  }
];

let nextVehicleId = 6;

export const mockVehicleService = {
  findAll: (options = {}) => {
    let results = [...mockVehicles];
    
    // Apply where clause filtering
    if (options.where) {
      Object.keys(options.where).forEach(key => {
        const value = options.where[key];
        if (key === 'status') {
          results = results.filter(vehicle => vehicle[key] === value);
        }
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
    const vehicle = mockVehicles.find(v => v.id === parseInt(id));
    return Promise.resolve(vehicle || null);
  },

  searchVehicles: (searchParams = {}) => {
    let results = [...mockVehicles].filter(v => v.status === 'available');
    
    // Apply search filters
    if (searchParams.make) {
      results = results.filter(v => 
        v.make.toLowerCase().includes(searchParams.make.toLowerCase())
      );
    }
    
    if (searchParams.model) {
      results = results.filter(v => 
        v.model.toLowerCase().includes(searchParams.model.toLowerCase())
      );
    }
    
    if (searchParams.minYear) {
      results = results.filter(v => v.year >= searchParams.minYear);
    }
    
    if (searchParams.maxYear) {
      results = results.filter(v => v.year <= searchParams.maxYear);
    }
    
    if (searchParams.minPrice) {
      results = results.filter(v => v.price >= searchParams.minPrice);
    }
    
    if (searchParams.maxPrice) {
      results = results.filter(v => v.price <= searchParams.maxPrice);
    }
    
    if (searchParams.condition) {
      results = results.filter(v => v.condition === searchParams.condition);
    }
    
    if (searchParams.fuelType) {
      results = results.filter(v => v.fuelType === searchParams.fuelType);
    }
    
    if (searchParams.bodyType) {
      results = results.filter(v => v.bodyType === searchParams.bodyType);
    }
    
    // Apply pagination
    const limit = searchParams.limit || 20;
    const offset = searchParams.offset || 0;
    const paginatedResults = results.slice(offset, offset + limit);
    
    return Promise.resolve(paginatedResults);
  },

  findFeatured: (options = {}) => {
    let results = mockVehicles.filter(v => v.isFeatured && v.status === 'available');
    
    // Apply pagination
    if (options.limit && options.offset) {
      results = results.slice(options.offset, options.offset + options.limit);
    } else if (options.limit) {
      results = results.slice(0, options.limit);
    }
    
    return Promise.resolve(results);
  },

  findByDealer: (dealerId, options = {}) => {
    let results = mockVehicles.filter(v => v.dealerId === parseInt(dealerId));
    
    // Apply pagination
    if (options.limit && options.offset) {
      results = results.slice(options.offset, options.offset + options.limit);
    } else if (options.limit) {
      results = results.slice(0, options.limit);
    }
    
    return Promise.resolve(results);
  },

  create: (data) => {
    const newVehicle = {
      id: nextVehicleId++,
      ...data,
      status: data.status || 'available',
      viewCount: 0,
      isFeatured: data.isFeatured || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      dealer: {
        id: data.dealerId,
        firstName: 'Test',
        lastName: 'Dealer',
        email: 'dealer@example.com',
        phone: '+1234567890'
      }
    };
    
    mockVehicles.push(newVehicle);
    return Promise.resolve(newVehicle);
  },

  update: (id, data) => {
    const index = mockVehicles.findIndex(v => v.id === parseInt(id));
    if (index === -1) return Promise.resolve(null);
    
    mockVehicles[index] = {
      ...mockVehicles[index],
      ...data,
      updatedAt: new Date()
    };
    
    return Promise.resolve(mockVehicles[index]);
  },

  count: (options = {}) => {
    let results = [...mockVehicles];
    
    if (options.where) {
      Object.keys(options.where).forEach(key => {
        const value = options.where[key];
        results = results.filter(vehicle => vehicle[key] === value);
      });
    }
    
    return Promise.resolve(results.length);
  }
};

export default mockBookingService;