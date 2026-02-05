# AutoSphere Database Schema

This document outlines the database structure needed for the AutoSphere application.

## Database: PostgreSQL

## Tables

### 1. Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'user', 'dealer', 'service_provider', 'admin'
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    google_id VARCHAR(255),
    profile_picture VARCHAR(500),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Vehicles Table
```sql
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    vin VARCHAR(17) UNIQUE,
    license_plate VARCHAR(20),
    color VARCHAR(30),
    mileage INTEGER,
    engine_type VARCHAR(50),
    transmission VARCHAR(20),
    fuel_type VARCHAR(20),
    price DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'sold', 'pending'
    description TEXT,
    images JSON, -- Array of image URLs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Bookings Table
```sql
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    service_provider_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
    service_type VARCHAR(50) NOT NULL, -- 'oil_change', 'brake_service', etc.
    title VARCHAR(200) NOT NULL,
    description TEXT,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    estimated_duration INTEGER, -- in minutes
    estimated_cost DECIMAL(8,2),
    actual_cost DECIMAL(8,2),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
    priority VARCHAR(10) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    customer_notes TEXT,
    provider_notes TEXT,
    cancellation_reason TEXT,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Conversations Table
```sql
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    participant_1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    participant_2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(participant_1_id, participant_2_id)
);
```

### 5. Messages Table
```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'file'
    attachment_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Sample Data

### Users
```sql
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_verified) VALUES
('admin@autosphere.com', '$2b$10$hashedpassword1', 'Admin', 'User', '+1234567890', 'admin', TRUE),
('dealer@autosphere.com', '$2b$10$hashedpassword2', 'John', 'Dealer', '+1234567891', 'dealer', TRUE),
('service@autosphere.com', '$2b$10$hashedpassword3', 'Mike', 'Mechanic', '+1234567892', 'service_provider', TRUE),
('user@autosphere.com', '$2b$10$hashedpassword4', 'Jane', 'Customer', '+1234567893', 'user', TRUE);
```

### Vehicles
```sql
INSERT INTO vehicles (user_id, make, model, year, vin, color, mileage, price, status) VALUES
(4, 'Toyota', 'Camry', 2023, '1HGBH41JXMN109186', 'Silver', 15000, 25000.00, 'available'),
(4, 'Honda', 'Civic', 2022, '2HGFC2F59NH123456', 'Blue', 22000, 22000.00, 'available'),
(2, 'Ford', 'F-150', 2024, '1FTFW1ET5DFC12345', 'Black', 5000, 45000.00, 'available');
```

### Bookings
```sql
INSERT INTO bookings (user_id, service_provider_id, vehicle_id, service_type, title, description, scheduled_date, scheduled_time, status, priority) VALUES
(4, 3, 1, 'oil_change', 'Regular Oil Change', 'Routine oil change and filter replacement', '2026-02-15', '10:00', 'confirmed', 'normal'),
(4, 3, NULL, 'brake_service', 'Brake Inspection', 'Complete brake system inspection', '2026-02-20', '14:00', 'pending', 'high');
```

### Conversations
```sql
INSERT INTO conversations (participant_1_id, participant_2_id) VALUES
(4, 3), -- Customer and Service Provider
(4, 2); -- Customer and Dealer
```

### Messages
```sql
INSERT INTO messages (conversation_id, sender_id, content) VALUES
(1, 4, 'Hi, I need to schedule a service appointment'),
(1, 3, 'Sure! What type of service do you need?'),
(2, 4, 'I am interested in the Toyota Camry you have listed'),
(2, 2, 'Great! Would you like to schedule a test drive?');
```

## Indexes for Performance

```sql
-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_verification_token ON users(verification_token);

-- Vehicle indexes
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_make_model ON vehicles(make, model);

-- Booking indexes
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_service_provider_id ON bookings(service_provider_id);
CREATE INDEX idx_bookings_scheduled_date ON bookings(scheduled_date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Message indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Conversation indexes
CREATE INDEX idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX idx_conversations_participant_2 ON conversations(participant_2_id);
```

## Environment Variables Needed

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=autosphere_db
DB_USER=postgres
DB_PASSWORD=your_password
```

## Setup Instructions

1. **Install PostgreSQL** on your system
2. **Create Database**: `CREATE DATABASE autosphere_db;`
3. **Run the table creation scripts** above
4. **Insert sample data** (optional)
5. **Update your .env file** with correct database credentials
6. **Restart your backend server**

The application will automatically connect to the database and stop using mock data once the connection is established.