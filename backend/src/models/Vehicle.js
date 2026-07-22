import { DataTypes, Op } from 'sequelize';
import { sequelize } from '../config/database.js';

const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  dealerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'dealer_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  make: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: [1, 50],
    },
  },
  model: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: [1, 50],
    },
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1900,
      max: new Date().getFullYear() + 2,
    },
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  mileage: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
    },
  },
  condition: {
    type: DataTypes.ENUM('new', 'used', 'certified_pre_owned'),
    allowNull: false,
    defaultValue: 'used',
  },
  fuelType: {
    type: DataTypes.ENUM('gasoline', 'diesel', 'hybrid', 'electric', 'plug_in_hybrid'),
    allowNull: false,
    defaultValue: 'gasoline',
    field: 'fuel_type',
  },
  transmission: {
    type: DataTypes.ENUM('manual', 'automatic', 'cvt'),
    allowNull: false,
    defaultValue: 'automatic',
  },
  bodyType: {
    type: DataTypes.ENUM('sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'truck', 'van', 'wagon'),
    allowNull: false,
    field: 'body_type',
  },
  color: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  vin: {
    type: DataTypes.STRING(17),
    allowNull: true,
    unique: true,
    validate: {
      len: [17, 17],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  features: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  status: {
    type: DataTypes.ENUM('available', 'sold', 'pending', 'reserved'),
    allowNull: false,
    defaultValue: 'available',
  },
  location: {
    type: DataTypes.JSON,
    allowNull: true,
    // Structure: { address, city, state, zipCode, coordinates: { lat, lng } }
  },
  viewCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'view_count',
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_featured',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at',
  },
}, {
  tableName: 'vehicles',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    {
      fields: ['dealer_id'],
    },
    {
      fields: ['make', 'model'],
    },
    {
      fields: ['year'],
    },
    {
      fields: ['price'],
    },
    {
      fields: ['condition'],
    },
    {
      fields: ['fuel_type'],
    },
    {
      fields: ['body_type'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['is_featured'],
    },
    {
      unique: true,
      fields: ['vin'],
      where: {
        vin: {
          [Op.ne]: null,
        },
      },
    },
  ],
});

// Instance methods
Vehicle.prototype.getFullName = function() {
  return `${this.year} ${this.make} ${this.model}`;
};

Vehicle.prototype.isAvailable = function() {
  return this.status === 'available';
};

Vehicle.prototype.incrementViewCount = async function() {
  this.viewCount += 1;
  await this.save();
};

Vehicle.prototype.toJSON = function() {
  const values = { ...this.get() };
  return values;
};

// Static methods
Vehicle.findAvailable = async function(options = {}) {
  return await this.findAll({
    where: { status: 'available' },
    ...options,
  });
};

Vehicle.findByDealer = async function(dealerId, options = {}) {
  return await this.findAll({
    where: { dealerId },
    ...options,
  });
};

Vehicle.findFeatured = async function(options = {}) {
  return await this.findAll({
    where: { 
      isFeatured: true,
      status: 'available',
    },
    ...options,
  });
};

Vehicle.searchVehicles = async function(searchParams = {}) {
  const where = { status: 'available' };
  
  if (searchParams.make) {
    where.make = { [Op.iLike]: `%${searchParams.make}%` };
  }
  
  if (searchParams.model) {
    where.model = { [Op.iLike]: `%${searchParams.model}%` };
  }
  
  if (searchParams.minYear) {
    where.year = { [Op.gte]: searchParams.minYear };
  }
  
  if (searchParams.maxYear) {
    where.year = { ...where.year, [Op.lte]: searchParams.maxYear };
  }
  
  if (searchParams.minPrice) {
    where.price = { [Op.gte]: searchParams.minPrice };
  }
  
  if (searchParams.maxPrice) {
    where.price = { ...where.price, [Op.lte]: searchParams.maxPrice };
  }
  
  // Mileage filters
  if (searchParams.minMileage !== undefined) {
    where.mileage = { [Op.gte]: searchParams.minMileage };
  }
  
  if (searchParams.maxMileage !== undefined) {
    where.mileage = { ...where.mileage, [Op.lte]: searchParams.maxMileage };
  }
  
  if (searchParams.condition) {
    where.condition = searchParams.condition;
  }
  
  if (searchParams.fuelType) {
    where.fuelType = searchParams.fuelType;
  }
  
  // Transmission filter
  if (searchParams.transmission) {
    where.transmission = searchParams.transmission.toLowerCase();
  }
  
  if (searchParams.bodyType) {
    where.bodyType = searchParams.bodyType;
  }
  
  // Color filter
  if (searchParams.color) {
    where.color = { [Op.iLike]: `%${searchParams.color}%` };
  }
  
  return await this.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: searchParams.limit || 20,
    offset: searchParams.offset || 0,
  });
};

export default Vehicle;