import { DataTypes, Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      len: [1, 255],
    },
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash',
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'first_name',
    validate: {
      len: [2, 100],
      is: /^[a-zA-Z\s'-]+$/,
    },
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'last_name',
    validate: {
      len: [2, 100],
      is: /^[a-zA-Z\s'-]+$/,
    },
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: [10, 20],
    },
  },
  role: {
    type: DataTypes.ENUM('user', 'dealer', 'service_provider', 'admin'),
    allowNull: false,
    defaultValue: 'user',
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_verified',
  },
  emailVerificationToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'email_verification_token',
  },
  emailVerificationExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'email_verification_expires',
  },
  passwordResetToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'password_reset_token',
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'password_reset_expires',
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login_at',
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
  tableName: 'users',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    {
      unique: true,
      fields: ['email'],
    },
    {
      fields: ['role'],
    },
    {
      fields: ['is_verified'],
    },
    {
      fields: ['email_verification_token'],
    },
    {
      fields: ['password_reset_token'],
    },
  ],
});

// Instance methods
User.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

User.prototype.hasRole = function(role) {
  return this.role === role;
};

User.prototype.hasAnyRole = function(roles) {
  return roles.includes(this.role);
};

User.prototype.isAdmin = function() {
  return this.role === 'admin';
};

User.prototype.isDealer = function() {
  return this.role === 'dealer';
};

User.prototype.isServiceProvider = function() {
  return this.role === 'service_provider';
};

User.prototype.isProvider = function() {
  return this.role === 'dealer' || this.role === 'service_provider';
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  // Remove sensitive fields from JSON output
  delete values.passwordHash;
  delete values.emailVerificationToken;
  delete values.passwordResetToken;
  return values;
};

// Static methods
User.findByEmail = async function(email) {
  return await this.findOne({
    where: { email: email.toLowerCase() },
  });
};

User.findByVerificationToken = async function(token) {
  return await this.findOne({
    where: {
      emailVerificationToken: token,
      emailVerificationExpires: {
        [Op.gt]: new Date(),
      },
    },
  });
};

User.findByPasswordResetToken = async function(token) {
  return await this.findOne({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
        [Op.gt]: new Date(),
      },
    },
  });
};

// Hooks
User.beforeCreate(async (user) => {
  if (user.email) {
    user.email = user.email.toLowerCase();
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('email')) {
    user.email = user.email.toLowerCase();
  }
});

// Helper methods for password operations
User.prototype.setPassword = async function(password) {
  this.passwordHash = await hashPassword(password);
};

User.prototype.validatePassword = async function(password) {
  return await comparePassword(password, this.passwordHash);
};

User.prototype.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = token;
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token;
};

User.prototype.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = token;
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return token;
};

User.prototype.clearEmailVerificationToken = function() {
  this.emailVerificationToken = null;
  this.emailVerificationExpires = null;
  this.isVerified = true;
};

User.prototype.clearPasswordResetToken = function() {
  this.passwordResetToken = null;
  this.passwordResetExpires = null;
};

export default User;