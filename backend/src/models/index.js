import { sequelize } from '../config/database.js';
import User from './User.js';
import Vehicle from './Vehicle.js';
import Booking from './Booking.js';
import Conversation from './Conversation.js';
import Message from './Message.js';
import UserVehicleInteraction from '.../UserVehicleInteraction.js';
import SavedSearch from './SavedSearch.js';

// Define associations
const defineAssociations = () => {
  // User associations
  User.hasMany(Vehicle, { foreignKey: 'dealerId', as: 'vehicles' });
  Vehicle.belongsTo(User, { foreignKey: 'dealerId', as: 'dealer' });
  
  // Booking associations
  User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
  User.hasMany(Booking, { foreignKey: 'serviceProviderId', as: 'serviceBookings' });
  Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Booking.belongsTo(User, { foreignKey: 'serviceProviderId', as: 'serviceProvider' });
  Booking.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
  Vehicle.hasMany(Booking, { foreignKey: 'vehicleId', as: 'bookings' });
  
  // Conversation associations
  User.hasMany(Conversation, { foreignKey: 'participant1', as: 'conversationsAsParticipant1' });
  User.hasMany(Conversation, { foreignKey: 'participant2', as: 'conversationsAsParticipant2' });
  Conversation.belongsTo(User, { foreignKey: 'participant1', as: 'firstParticipant' });
  Conversation.belongsTo(User, { foreignKey: 'participant2', as: 'secondParticipant' });
  Conversation.belongsTo(Booking, { foreignKey: 'relatedBookingId', as: 'relatedBooking' });
  Conversation.belongsTo(Vehicle, { foreignKey: 'relatedVehicleId', as: 'relatedVehicle' });
  
  // Message associations
  User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
  Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
  Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
  Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
  Message.belongsTo(Message, { foreignKey: 'replyToId', as: 'replyTo' });
  Message.hasMany(Message, { foreignKey: 'replyToId', as: 'replies' });
  
  // Update conversation last message reference
  Conversation.belongsTo(Message, { foreignKey: 'lastMessageId', as: 'lastMessage' });

  // User Vehicle Interactions associations
  User.hasMany(UserVehicleInteraction, { foreignKey: 'userId', as: 'interactions' });
  UserVehicleInteraction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  Vehicle.hasMany(UserVehicleInteraction, { foreignKey: 'vehicleId', as: 'interactions' });
  UserVehicleInteraction.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
  
  // SavedSearch associations
  User.hasMany(SavedSearch, { foreignKey: 'userId', as: 'savedSearches' });
  SavedSearch.belongsTo(User, { foreignKey: 'userId', as: 'user' });
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
  Vehicle,
  Booking,
  Conversation,
  Message,
  UserVehicleInteraction,
  SavedSearch,
  syncDatabase,
};

export default {
  sequelize,
  User,
  Vehicle,
  Booking,
  Conversation,
  Message,
  UserVehicleInteraction,
  SavedSearch,
  syncDatabase,
};