import { sequelize } from '../config/database.js';
import User from './User.js';

// Import other models here as they are created
// import Vehicle from './Vehicle.js';
// import Booking from './Booking.js';
// import Conversation from './Conversation.js';
// import Message from './Message.js';
// import UserPreferences from './UserPreferences.js';

// Define associations here
const defineAssociations = () => {
  // User associations will be defined here when other models are created
  
  // Example associations (uncomment when models are created):
  // User.hasMany(Vehicle, { foreignKey: 'dealerId', as: 'vehicles' });
  // Vehicle.belongsTo(User, { foreignKey: 'dealerId', as: 'dealer' });
  
  // User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
  // User.hasMany(Booking, { foreignKey: 'serviceProviderId', as: 'serviceBookings' });
  // Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  // Booking.belongsTo(User, { foreignKey: 'serviceProviderId', as: 'serviceProvider' });
  
  // User.hasOne(UserPreferences, { foreignKey: 'userId', as: 'preferences' });
  // UserPreferences.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  
  // Conversation associations
  // User.belongsToMany(User, {
  //   through: Conversation,
  //   as: 'conversations',
  //   foreignKey: 'participant1',
  //   otherKey: 'participant2'
  // });
  
  // Message associations
  // User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
  // Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
  // Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
  // Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
};

// Initialize associations
defineAssociations();

// Sync database (only in development)
const syncDatabase = async () => {
  if (process.env.NODE_ENV === 'development') {
    try {
      await sequelize.sync({ alter: true });
      console.log('Database synchronized successfully');
    } catch (error) {
      console.error('Database synchronization failed:', error);
    }
  }
};

export {
  sequelize,
  User,
  syncDatabase,
  // Export other models here as they are created
};

export default {
  sequelize,
  User,
  syncDatabase,
};