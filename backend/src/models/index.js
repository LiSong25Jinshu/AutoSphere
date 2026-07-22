import { sequelize } from '../config/database.js';
import User from './User.js';
import Vehicle from './Vehicle.js';
import Booking from './Booking.js';
import Conversation from './Conversation.js';
import Message from './Message.js';
import UserVehicleInteraction from './UserVehicleInteraction.js';
import SavedSearch from './SavedSearch.js';
import Notification from './Notification.js';
import PushSubscription from './PushSubscription.js';
import ServiceOffering from './ServiceOffering.js';
import ProviderSchedule from './ProviderSchedule.js';

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

  // Notification associations
  User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
  Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // PushSubscription associations
  User.hasMany(PushSubscription, { foreignKey: 'userId', as: 'pushSubscriptions' });
  PushSubscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // ServiceOffering associations
  User.hasMany(ServiceOffering, { foreignKey: 'providerId', as: 'serviceOfferings' });
  ServiceOffering.belongsTo(User, { foreignKey: 'providerId', as: 'provider' });

  // ProviderSchedule associations
  User.hasOne(ProviderSchedule, { foreignKey: 'providerId', as: 'schedule' });
  ProviderSchedule.belongsTo(User, { foreignKey: 'providerId', as: 'provider' });
};

// Initialize associations
defineAssociations();

// Sync database. Historically this ran sequelize.sync({alter:true}) in development,
// but connectDB() (config/database.js) now owns schema synchronization there via a
// fresh SQLite file. Re-running sync({alter:true}) on the existing file re-enters
// Sequelize's infinite ALTER-TABLE loop on the `users` table under SQLite, which
// prevented the server from ever binding its port. Production and test environments
// manage their own schema, so this is intentionally a no-op.
const syncDatabase = async () => {
  // No-op: schema sync is handled by connectDB() in development; production and
  // tests manage their own database setup.
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
  Notification,
  PushSubscription,
  ServiceOffering,
  ProviderSchedule,
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
  ServiceOffering,
  ProviderSchedule,
  syncDatabase,
};