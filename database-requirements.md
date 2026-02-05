# AutoSphere Database Requirements Document

## 1. Database System Requirements

### 1.1 Database Technology
- **Database Type**: PostgreSQL 13.0 or higher
- **Character Set**: UTF-8
- **Timezone**: UTC
- **Connection Pool**: Minimum 10 connections, Maximum 100 connections

### 1.2 Performance Requirements
- **Query Response Time**: < 200ms for standard queries
- **Concurrent Users**: Support up to 1000 concurrent users
- **Data Backup**: Daily automated backups with 30-day retention
- **Uptime**: 99.9% availability

## 2. Data Storage Requirements

### 2.1 Users Table Requirements
**Purpose**: Store all user accounts and authentication data

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User login email |
| password_hash | VARCHAR(255) | NOT NULL | Encrypted password |
| first_name | VARCHAR(100) | NOT NULL | User's first name |
| last_name | VARCHAR(100) | NOT NULL | User's last name |
| phone | VARCHAR(20) | NULLABLE | Contact phone number |
| role | ENUM | NOT NULL, DEFAULT 'user' | User role: user, dealer, service_provider, admin |
| is_verified | BOOLEAN | DEFAULT FALSE | Email verification status |
| verification_token | VARCHAR(255) | NULLABLE | Email verification token |
| reset_password_token | VARCHAR(255) | NULLABLE | Password reset token |
| reset_password_expires | TIMESTAMP | NULLABLE | Token expiration time |
| google_id | VARCHAR(255) | NULLABLE | Google OAuth ID |
| profile_picture | VARCHAR(500) | NULLABLE | Profile image URL |
| address | TEXT | NULLABLE | User address |
| city | VARCHAR(100) | NULLABLE | User city |
| state | VARCHAR(50) | NULLABLE | User state |
| zip_code | VARCHAR(10) | NULLABLE | User zip code |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Business Rules**:
- Email must be unique across all users
- Password must be hashed using bcrypt with salt rounds ≥ 10
- Role must be one of: 'user', 'dealer', 'service_provider', 'admin'
- Verification tokens expire after 24 hours
- Password reset tokens expire after 1 hour

### 2.2 Vehicles Table Requirements
**Purpose**: Store vehicle inventory and listings

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PRIMARY KEY, AUTO_INCREMENT | Unique vehicle identifier |
| user_id | INTEGER | FOREIGN KEY → users(id), NOT NULL | Vehicle owner (dealer) |
| make | VARCHAR(50) | NOT NULL | Vehicle manufacturer |
| model | VARCHAR(50) | NOT NULL | Vehicle model |
| year | INTEGER | NOT NULL, CHECK (year >= 1900 AND year <= CURRENT_YEAR + 1) | Manufacturing year |
| vin | VARCHAR(17) | UNIQUE, NULLABLE | Vehicle identification number |
| license_plate | VARCHAR(20) | NULLABLE | License plate number |
| color | VARCHAR(30) | NULLABLE | Vehicle color |
| mileage | INTEGER | CHECK (mileage >= 0) | Vehicle mileage |
| engine_type | VARCHAR(50) | NULLABLE | Engine specification |
| transmission | VARCHAR(20) | NULLABLE | Transmission type |
| fuel_type | VARCHAR(20) | NULLABLE | Fuel type |
| price | DECIMAL(10,2) | CHECK (price >= 0) | Vehicle price |
| status | ENUM | DEFAULT 'available' | Vehicle status: available, sold, pending |
| description | TEXT | NULLABLE | Vehicle description |
| images | JSON | NULLABLE | Array of image URLs |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Business Rules**:
- Only users with role 'dealer' can own vehicles
- VIN must be unique if provided
- Price must be non-negative
- Status must be one of: 'available', 'sold', 'pending'
- Images must be valid JSON array of URLs

### 2.3 Bookings Table Requirements
**Purpose**: Store service appointments and vehicle bookings

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PRIMARY KEY, AUTO_INCREMENT | Unique booking identifier |
| user_id | INTEGER | FOREIGN KEY → users(id), NOT NULL | Customer making booking |
| service_provider_id | INTEGER | FOREIGN KEY → users(id), NOT NULL | Service provider |
| vehicle_id | INTEGER | FOREIGN KEY → vehicles(id), NULLABLE | Vehicle being serviced |
| service_type | ENUM | NOT NULL | Type of service requested |
| title | VARCHAR(200) | NOT NULL, LENGTH >= 5 | Booking title |
| description | TEXT | NULLABLE | Detailed description |
| scheduled_date | DATE | NOT NULL | Service date |
| scheduled_time | TIME | NOT NULL | Service time |
| estimated_duration | INTEGER | CHECK (estimated_duration > 0) | Duration in minutes |
| estimated_cost | DECIMAL(8,2) | CHECK (estimated_cost >= 0) | Estimated cost |
| actual_cost | DECIMAL(8,2) | CHECK (actual_cost >= 0) | Final cost |
| status | ENUM | DEFAULT 'pending' | Booking status |
| priority | ENUM | DEFAULT 'normal' | Booking priority |
| customer_notes | TEXT | NULLABLE | Customer notes |
| provider_notes | TEXT | NULLABLE | Service provider notes |
| cancellation_reason | TEXT | NULLABLE | Reason for cancellation |
| completed_at | TIMESTAMP | NULLABLE | Completion timestamp |
| cancelled_at | TIMESTAMP | NULLABLE | Cancellation timestamp |
| rating | INTEGER | CHECK (rating >= 1 AND rating <= 5) | Service rating |
| review | TEXT | NULLABLE | Service review |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Business Rules**:
- service_provider_id must reference a user with role 'service_provider'
- service_type must be one of: 'oil_change', 'brake_service', 'tire_service', 'engine_diagnostic', 'transmission_service', 'air_conditioning', 'battery_service', 'general_maintenance', 'inspection', 'repair', 'other'
- status must be one of: 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
- priority must be one of: 'low', 'normal', 'high', 'urgent'
- scheduled_date must be in the future when created
- title must be between 5 and 200 characters
- rating can only be set when status is 'completed'

### 2.4 Conversations Table Requirements
**Purpose**: Store chat conversations between users

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PRIMARY KEY, AUTO_INCREMENT | Unique conversation identifier |
| participant_1_id | INTEGER | FOREIGN KEY → users(id), NOT NULL | First participant |
| participant_2_id | INTEGER | FOREIGN KEY → users(id), NOT NULL | Second participant |
| last_message_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last message timestamp |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Conversation start time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Business Rules**:
- participant_1_id and participant_2_id must be different
- Unique constraint on (participant_1_id, participant_2_id) to prevent duplicate conversations
- Conversations are bidirectional (order of participants doesn't matter)

### 2.5 Messages Table Requirements
**Purpose**: Store individual messages within conversations

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | SERIAL | PRIMARY KEY, AUTO_INCREMENT | Unique message identifier |
| conversation_id | INTEGER | FOREIGN KEY → conversations(id), NOT NULL | Parent conversation |
| sender_id | INTEGER | FOREIGN KEY → users(id), NOT NULL | Message sender |
| content | TEXT | NOT NULL | Message content |
| message_type | ENUM | DEFAULT 'text' | Message type |
| attachment_url | VARCHAR(500) | NULLABLE | File attachment URL |
| is_read | BOOLEAN | DEFAULT FALSE | Read status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Message timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Business Rules**:
- sender_id must be one of the conversation participants
- message_type must be one of: 'text', 'image', 'file'
- content cannot be empty for text messages
- attachment_url required for 'image' and 'file' message types

## 3. Data Relationships Requirements

### 3.1 Foreign Key Relationships
- **users → vehicles**: One-to-many (dealer can own multiple vehicles)
- **users → bookings**: One-to-many (user can make multiple bookings)
- **users → bookings**: One-to-many (service provider can handle multiple bookings)
- **vehicles → bookings**: One-to-many (vehicle can have multiple service bookings)
- **users → conversations**: Many-to-many (users can have multiple conversations)
- **conversations → messages**: One-to-many (conversation contains multiple messages)
- **users → messages**: One-to-many (user can send multiple messages)

### 3.2 Cascade Rules
- **ON DELETE CASCADE**: messages when conversation is deleted
- **ON DELETE CASCADE**: bookings when user is deleted
- **ON DELETE CASCADE**: vehicles when dealer is deleted
- **ON DELETE SET NULL**: booking.vehicle_id when vehicle is deleted

## 4. Index Requirements

### 4.1 Primary Indexes
- All tables must have PRIMARY KEY indexes on id columns

### 4.2 Unique Indexes
- users.email (unique constraint)
- vehicles.vin (unique constraint)
- conversations(participant_1_id, participant_2_id) (unique constraint)

### 4.3 Performance Indexes
- users(role) - for role-based queries
- vehicles(user_id) - for dealer vehicle listings
- vehicles(status) - for available vehicle searches
- vehicles(make, model) - for vehicle searches
- bookings(user_id) - for user booking history
- bookings(service_provider_id) - for provider schedules
- bookings(scheduled_date) - for date-based queries
- bookings(status) - for status filtering
- messages(conversation_id) - for conversation messages
- messages(sender_id) - for user message history
- messages(created_at) - for chronological ordering

## 5. Data Validation Requirements

### 5.1 Application-Level Validation
- Email format validation using regex
- Password strength requirements (minimum 8 characters, mixed case, numbers)
- Phone number format validation
- VIN format validation (17 characters, alphanumeric)
- URL validation for images and attachments
- Date validation (no past dates for bookings)
- Time format validation (HH:MM)

### 5.2 Database-Level Constraints
- CHECK constraints for numeric ranges
- NOT NULL constraints for required fields
- UNIQUE constraints for unique fields
- FOREIGN KEY constraints for relationships
- ENUM constraints for predefined values

## 6. Security Requirements

### 6.1 Data Protection
- All passwords must be hashed using bcrypt
- Sensitive data encryption at rest
- SSL/TLS encryption for data in transit
- Regular security audits and vulnerability assessments

### 6.2 Access Control
- Role-based access control (RBAC)
- User can only access their own data
- Dealers can only manage their own vehicles
- Service providers can only access assigned bookings
- Admins have full system access

## 7. Backup and Recovery Requirements

### 7.1 Backup Strategy
- Daily full database backups
- Hourly incremental backups during business hours
- 30-day backup retention policy
- Offsite backup storage
- Backup integrity verification

### 7.2 Recovery Requirements
- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 1 hour
- Disaster recovery plan with documented procedures
- Regular recovery testing

## 8. Sample Data Requirements

### 8.1 Test Data
- Minimum 4 test users (one for each role)
- Minimum 10 test vehicles
- Minimum 5 test bookings
- Minimum 2 test conversations with messages

### 8.2 Production Seeding
- Admin user account
- Default service types
- System configuration data
- Initial dealer accounts (if applicable)

## 9. Environment Configuration

### 9.1 Database Connection
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=autosphere_db
DB_USER=autosphere_user
DB_PASSWORD=secure_password
DB_SSL=require (for production)
DB_POOL_MIN=5
DB_POOL_MAX=20
```

### 9.2 Migration Requirements
- Database migration scripts for schema changes
- Version control for database schema
- Rollback procedures for failed migrations
- Data migration scripts for production updates

## 10. Monitoring and Maintenance

### 10.1 Performance Monitoring
- Query performance monitoring
- Connection pool monitoring
- Database size monitoring
- Index usage analysis

### 10.2 Maintenance Tasks
- Regular VACUUM and ANALYZE operations
- Index maintenance and optimization
- Statistics updates
- Log rotation and cleanup