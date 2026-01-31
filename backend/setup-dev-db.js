import { sequelize, User, Vehicle, Booking, Conversation, Message } from './src/models/index.js';
import { hashPassword } from './src/utils/password.js';

async function setupDevDatabase() {
  try {
    console.log('🔄 Setting up development database...');

    // Force sync database (recreate tables)
    await sequelize.sync({ force: true });
    console.log('✅ Database tables created');

    // Create sample users
    const users = await Promise.all([
      User.create({
        email: 'admin@autosphere.com',
        passwordHash: await hashPassword('admin123'),
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isVerified: true,
      }),
      User.create({
        email: 'dealer@autosphere.com',
        passwordHash: await hashPassword('dealer123'),
        firstName: 'John',
        lastName: 'Dealer',
        phone: '+1234567890',
        role: 'dealer',
        isVerified: true,
      }),
      User.create({
        email: 'service@autosphere.com',
        passwordHash: await hashPassword('service123'),
        firstName: 'Mike',
        lastName: 'Mechanic',
        phone: '+1234567891',
        role: 'service_provider',
        isVerified: true,
      }),
      User.create({
        email: 'user@autosphere.com',
        passwordHash: await hashPassword('user123'),
        firstName: 'Jane',
        lastName: 'Customer',
        phone: '+1234567892',
        role: 'user',
        isVerified: true,
      }),
    ]);

    console.log('✅ Sample users created');

    // Create sample vehicles
    const vehicles = await Promise.all([
      Vehicle.create({
        dealerId: users[1].id, // John Dealer
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
        description: 'Well-maintained Toyota Camry with excellent fuel economy. Perfect for daily commuting.',
        features: ['GPS Navigation', 'Bluetooth', 'Backup Camera', 'Cruise Control'],
        images: ['camry1.jpg', 'camry2.jpg'],
        status: 'available',
        isFeatured: true,
      }),
      Vehicle.create({
        dealerId: users[1].id,
        make: 'Honda',
        model: 'Civic',
        year: 2022,
        price: 24900.00,
        mileage: 22000,
        condition: 'used',
        fuelType: 'gasoline',
        transmission: 'manual',
        bodyType: 'sedan',
        color: 'Blue',
        vin: '2HGFC2F59NH123456',
        description: 'Sporty Honda Civic with manual transmission. Great for enthusiasts.',
        features: ['Sport Mode', 'Manual Transmission', 'Sunroof'],
        images: ['civic1.jpg', 'civic2.jpg'],
        status: 'available',
      }),
      Vehicle.create({
        dealerId: users[1].id,
        make: 'Tesla',
        model: 'Model 3',
        year: 2024,
        price: 42000.00,
        mileage: 5000,
        condition: 'used',
        fuelType: 'electric',
        transmission: 'automatic',
        bodyType: 'sedan',
        color: 'White',
        vin: '5YJ3E1EA4KF123789',
        description: 'Nearly new Tesla Model 3 with autopilot and premium interior.',
        features: ['Autopilot', 'Premium Audio', 'Glass Roof', 'Supercharging'],
        images: ['tesla1.jpg', 'tesla2.jpg'],
        status: 'available',
        isFeatured: true,
      }),
    ]);

    console.log('✅ Sample vehicles created');

    // Create sample bookings
    const bookings = await Promise.all([
      Booking.create({
        userId: users[3].id, // Jane Customer
        serviceProviderId: users[2].id, // Mike Mechanic
        vehicleId: vehicles[0].id,
        serviceType: 'oil_change',
        title: 'Regular Oil Change',
        description: 'Routine oil change and filter replacement',
        scheduledDate: new Date('2024-02-15'),
        scheduledTime: '10:00',
        estimatedDuration: 60,
        estimatedCost: 75.00,
        status: 'confirmed',
        priority: 'normal',
        customerNotes: 'Please use synthetic oil',
      }),
      Booking.create({
        userId: users[3].id,
        serviceProviderId: users[2].id,
        serviceType: 'brake_service',
        title: 'Brake Inspection',
        description: 'Complete brake system inspection and service',
        scheduledDate: new Date('2024-02-20'),
        scheduledTime: '14:00',
        estimatedDuration: 120,
        estimatedCost: 150.00,
        status: 'pending',
        priority: 'high',
        customerNotes: 'Hearing squeaking noise when braking',
      }),
    ]);

    console.log('✅ Sample bookings created');

    // Create sample conversation and messages
    const conversation = await Conversation.create({
      participant1: users[3].id, // Jane Customer
      participant2: users[1].id, // John Dealer
      conversationType: 'direct',
      relatedVehicleId: vehicles[0].id,
    });

    const messages = await Promise.all([
      Message.create({
        conversationId: conversation.id,
        senderId: users[3].id,
        content: 'Hi, I\'m interested in the Toyota Camry you have listed. Is it still available?',
        messageType: 'text',
      }),
      Message.create({
        conversationId: conversation.id,
        senderId: users[1].id,
        content: 'Yes, it\'s still available! Would you like to schedule a test drive?',
        messageType: 'text',
      }),
      Message.create({
        conversationId: conversation.id,
        senderId: users[3].id,
        content: 'That would be great! What times do you have available this week?',
        messageType: 'text',
      }),
    ]);

    // Update conversation with last message
    await conversation.updateLastMessage(messages[messages.length - 1].id);

    console.log('✅ Sample conversation and messages created');

    console.log('\n🎉 Development database setup complete!');
    console.log('\n📋 Sample accounts created:');
    console.log('👤 Admin: admin@autosphere.com / admin123');
    console.log('🏪 Dealer: dealer@autosphere.com / dealer123');
    console.log('🔧 Service Provider: service@autosphere.com / service123');
    console.log('👥 Customer: user@autosphere.com / user123');
    console.log('\n🚗 Sample vehicles, bookings, and messages have been created');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    await sequelize.close();
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDevDatabase();
}

export default setupDevDatabase;