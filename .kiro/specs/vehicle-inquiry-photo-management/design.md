# Design Document: Vehicle Inquiry/Lead Management and Photo Upload System

## Overview

This document outlines the technical design for implementing a comprehensive vehicle inquiry/lead management system and photo upload functionality for the AutoSphere platform. The system enables potential buyers to submit inquiries about vehicles through contact forms, automatically creates conversations in the existing messaging system for seamless dealer-customer communication, and provides dealers with robust photo management capabilities for their vehicle listings.

The design integrates with existing User, Vehicle, Conversation, and Message models while introducing new Lead and VehiclePhoto models. The system emphasizes security, performance, and user experience through features like image optimization, rate limiting, and real-time notifications.

### Key Features

- Vehicle inquiry form with validation and pre-population for authenticated users
- Automatic lead creation and conversation initiation
- Multi-photo upload with drag-and-drop support
- Image optimization and multiple size generation (thumbnail, display, original)
- Photo gallery management with reordering and primary photo designation
- Lead management dashboard for dealers with filtering and analytics
- Email and real-time notifications for new inquiries
- Rate limiting to prevent spam
- Mobile-responsive photo upload from camera or gallery

## Architecture

### System Components

The system follows a three-tier architecture:

1. **Presentation Layer (Frontend)**
   - VehicleInquiryForm: Contact form component on vehicle detail pages
   - PhotoUploadComponent: Multi-file upload interface with preview
   - PhotoGallery: Image display and management interface
   - LeadsDashboard: Dealer lead management interface

2. **Application Layer (Backend)**
   - Lead Management Service: Handles inquiry submission and lead creation
   - Conversation Integration Service: Creates/updates conversations and messages
   - Image Processing Service: Optimizes and resizes uploaded images
   - Notification Service: Sends email and real-time notifications
   - Photo Management Service: Handles photo CRUD operations

3. **Data Layer**
   - PostgreSQL database with new Lead and VehiclePhoto tables
   - File system or cloud storage for image files
   - Redis for rate limiting

### Integration Points

```mermaid
graph TD
    A[Vehicle Detail Page] -->|Submit Inquiry| B[Lead Management API]
    B -->|Create Lead| C[Lead Model]
    B -->|Create/Update| D[Conversation Model]
    D -->|Add Message| E[Message Model]
    B -->|Send Notification| F[Notification Service]
    F -->|Email| G[Dealer Email]
    F -->|Real-time| H[Socket.io]
    
    I[Vehicle Form] -->|Upload Photos| J[Photo Upload API]
    J -->|Process Images| K[Image Optimizer]
    K -->|Store Files| L[File Storage]
    J -->|Save Metadata| M[VehiclePhoto Model]
    M -->|Associate| N[Vehicle Model]
```

### Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **File Upload**: Multer middleware
- **Image Processing**: Sharp library
- **Storage**: Local file system (with cloud storage option)
- **Real-time**: Socket.io
- **Email**: Nodemailer
- **Rate Limiting**: Express-rate-limit with Redis

## Components and Interfaces

### Database Models

#### Lead Model

```javascript
{
  id: INTEGER (Primary Key, Auto-increment),
  vehicleId: INTEGER (Foreign Key -> vehicles.id, NOT NULL),
  dealerId: INTEGER (Foreign Key -> users.id, NOT NULL),
  customerId: INTEGER (Foreign Key -> users.id, NULLABLE),
  customerName: STRING(100) (NOT NULL),
  customerEmail: STRING(255) (NOT NULL),
  customerPhone: STRING(20) (NULLABLE),
  message: TEXT (NOT NULL),
  status: ENUM('new', 'contacted', 'converted', 'closed') (DEFAULT 'new'),
  conversationId: INTEGER (Foreign Key -> conversations.id, NULLABLE),
  source: STRING(50) (DEFAULT 'web_form'),
  metadata: JSON (NULLABLE),
  createdAt: TIMESTAMP (NOT NULL),
  updatedAt: TIMESTAMP (NOT NULL)
}
```

**Indexes:**
- `dealer_id` (for dealer lead queries)
- `vehicle_id` (for vehicle inquiry tracking)
- `customer_id` (for customer inquiry history)
- `status` (for filtering by lead status)
- `created_at` (for sorting by date)

**Relationships:**
- `belongsTo` Vehicle
- `belongsTo` User (as dealer)
- `belongsTo` User (as customer, optional)
- `belongsTo` Conversation (optional)

#### VehiclePhoto Model

```javascript
{
  id: INTEGER (Primary Key, Auto-increment),
  vehicleId: INTEGER (Foreign Key -> vehicles.id, NOT NULL),
  uploadedBy: INTEGER (Foreign Key -> users.id, NOT NULL),
  originalFilename: STRING(255) (NOT NULL),
  originalPath: STRING(500) (NOT NULL),
  thumbnailPath: STRING(500) (NOT NULL),
  displayPath: STRING(500) (NOT NULL),
  fileSize: INTEGER (NOT NULL, in bytes),
  mimeType: STRING(50) (NOT NULL),
  width: INTEGER (NOT NULL),
  height: INTEGER (NOT NULL),
  isPrimary: BOOLEAN (DEFAULT false),
  displayOrder: INTEGER (DEFAULT 0),
  metadata: JSON (NULLABLE),
  createdAt: TIMESTAMP (NOT NULL),
  updatedAt: TIMESTAMP (NOT NULL)
}
```

**Indexes:**
- `vehicle_id` (for fetching vehicle photos)
- `uploaded_by` (for tracking uploader)
- `is_primary` (for quick primary photo lookup)
- `display_order` (for ordering photos)
- Composite index on `(vehicle_id, display_order)` for efficient ordering

**Relationships:**
- `belongsTo` Vehicle
- `belongsTo` User (as uploader)

### API Endpoints

#### Lead/Inquiry Endpoints

**POST `/api/leads`**
- **Description**: Submit a vehicle inquiry and create a lead
- **Authentication**: Optional (supports both authenticated and guest users)
- **Rate Limit**: 5 requests/hour for unauthenticated, 20 requests/hour for authenticated
- **Request Body**:
```json
{
  "vehicleId": 123,
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1234567890",
  "message": "I'm interested in this vehicle. Is it still available?"
}
```
- **Response** (201):
```json
{
  "success": true,
  "message": "Inquiry submitted successfully",
  "data": {
    "leadId": 456,
    "conversationId": 789
  }
}
```
- **Validation**:
  - vehicleId: required, must exist and be available
  - customerName: required, 2-100 characters
  - customerEmail: required, valid email format
  - customerPhone: optional, 10-20 characters
  - message: required, 10-1000 characters

**GET `/api/leads`**
- **Description**: Get leads for authenticated dealer
- **Authentication**: Required (dealer role)
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20, max: 100)
  - `status`: Filter by status (new, contacted, converted, closed)
  - `vehicleId`: Filter by specific vehicle
  - `startDate`: Filter by date range start
  - `endDate`: Filter by date range end
- **Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "vehicleId": 123,
      "vehicle": {
        "id": 123,
        "make": "Toyota",
        "model": "Camry",
        "year": 2023
      },
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "customerPhone": "+1234567890",
      "message": "I'm interested...",
      "status": "new",
      "conversationId": 789,
      "createdAt": "2024-02-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

**GET `/api/leads/:id`**
- **Description**: Get specific lead details
- **Authentication**: Required (dealer must own the vehicle)
- **Response** (200): Single lead object with full details

**PATCH `/api/leads/:id/status`**
- **Description**: Update lead status
- **Authentication**: Required (dealer must own the vehicle)
- **Request Body**:
```json
{
  "status": "contacted",
  "notes": "Called customer, scheduled test drive"
}
```

**GET `/api/leads/analytics`**
- **Description**: Get lead analytics for dealer
- **Authentication**: Required (dealer role)
- **Query Parameters**:
  - `period`: week, month, year (default: month)
- **Response** (200):
```json
{
  "success": true,
  "data": {
    "totalLeads": 150,
    "newLeads": 25,
    "conversionRate": 0.18,
    "leadsByVehicle": [
      {
        "vehicleId": 123,
        "vehicle": "2023 Toyota Camry",
        "leadCount": 12
      }
    ],
    "leadsTrend": [
      { "date": "2024-01-01", "count": 5 },
      { "date": "2024-01-02", "count": 8 }
    ]
  }
}
```

#### Photo Management Endpoints

**POST `/api/vehicles/:vehicleId/photos`**
- **Description**: Upload photos for a vehicle
- **Authentication**: Required (dealer must own the vehicle)
- **Content-Type**: multipart/form-data
- **Request**: Form data with multiple files under "photos" field
- **Validation**:
  - Maximum 20 photos per vehicle
  - File size limit: 10MB per file
  - Allowed formats: JPEG, PNG, WebP
  - Minimum dimensions: 800x600 pixels
- **Response** (201):
```json
{
  "success": true,
  "message": "Photos uploaded successfully",
  "data": {
    "uploaded": 3,
    "photos": [
      {
        "id": 1,
        "vehicleId": 123,
        "thumbnailPath": "/uploads/vehicles/123/thumb_abc123.jpg",
        "displayPath": "/uploads/vehicles/123/display_abc123.jpg",
        "originalPath": "/uploads/vehicles/123/original_abc123.jpg",
        "isPrimary": true,
        "displayOrder": 0
      }
    ]
  }
}
```

**GET `/api/vehicles/:vehicleId/photos`**
- **Description**: Get all photos for a vehicle
- **Authentication**: Not required (public endpoint)
- **Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "thumbnailPath": "/uploads/vehicles/123/thumb_abc123.jpg",
      "displayPath": "/uploads/vehicles/123/display_abc123.jpg",
      "isPrimary": true,
      "displayOrder": 0,
      "width": 1200,
      "height": 900
    }
  ]
}
```

**DELETE `/api/vehicles/:vehicleId/photos/:photoId`**
- **Description**: Delete a vehicle photo
- **Authentication**: Required (dealer must own the vehicle)
- **Response** (200):
```json
{
  "success": true,
  "message": "Photo deleted successfully"
}
```

**PATCH `/api/vehicles/:vehicleId/photos/:photoId/primary`**
- **Description**: Set a photo as primary
- **Authentication**: Required (dealer must own the vehicle)
- **Response** (200):
```json
{
  "success": true,
  "message": "Primary photo updated"
}
```

**PUT `/api/vehicles/:vehicleId/photos/reorder`**
- **Description**: Reorder vehicle photos
- **Authentication**: Required (dealer must own the vehicle)
- **Request Body**:
```json
{
  "photoIds": [3, 1, 2, 5, 4]
}
```
- **Response** (200):
```json
{
  "success": true,
  "message": "Photos reordered successfully"
}
```

### Frontend Components

#### VehicleInquiryForm Component

**Location**: `frontend/src/components/VehicleInquiryForm.jsx`

**Props**:
- `vehicleId` (required): ID of the vehicle being inquired about
- `vehicleInfo` (required): Object with make, model, year
- `onSuccess` (optional): Callback function after successful submission

**State**:
```javascript
{
  formData: {
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    message: ''
  },
  errors: {},
  isSubmitting: false,
  submitSuccess: false
}
```

**Key Methods**:
- `handleInputChange(field, value)`: Updates form data
- `validateForm()`: Client-side validation
- `handleSubmit()`: Submits inquiry to API
- `prefillUserData()`: Pre-populates form for authenticated users

**UI Elements**:
- Text input for name
- Email input with validation
- Phone input with format validation
- Textarea for message (10-1000 characters)
- Submit button with loading state
- Success/error message display
- Link to messages page after successful submission

#### PhotoUploadComponent Component

**Location**: `frontend/src/components/PhotoUploadComponent.jsx`

**Props**:
- `vehicleId` (required): ID of the vehicle
- `existingPhotos` (optional): Array of existing photos
- `maxPhotos` (optional): Maximum allowed photos (default: 20)
- `onUploadComplete` (optional): Callback after upload

**State**:
```javascript
{
  selectedFiles: [],
  previews: [],
  uploadProgress: {},
  uploading: false,
  errors: []
}
```

**Key Methods**:
- `handleFileSelect(files)`: Validates and adds files to selection
- `handleDrop(event)`: Handles drag-and-drop
- `removeFile(index)`: Removes file from selection
- `validateFile(file)`: Validates file type, size, dimensions
- `uploadPhotos()`: Uploads files with progress tracking
- `handleCameraCapture()`: Opens camera on mobile devices

**UI Elements**:
- Drag-and-drop zone
- File input button
- Camera capture button (mobile)
- Preview thumbnails with remove button
- Progress bars for each upload
- Error messages
- Upload button

#### PhotoGallery Component

**Location**: `frontend/src/components/PhotoGallery.jsx`

**Props**:
- `photos` (required): Array of photo objects
- `editable` (optional): Enable management features (default: false)
- `onPhotoClick` (optional): Callback when photo is clicked
- `onReorder` (optional): Callback after reordering
- `onDelete` (optional): Callback after deletion
- `onSetPrimary` (optional): Callback after setting primary

**State**:
```javascript
{
  photos: [],
  selectedPhoto: null,
  modalOpen: false,
  draggedItem: null
}
```

**Key Methods**:
- `openModal(photo)`: Opens full-size view
- `closeModal()`: Closes modal
- `handleKeyPress(event)`: Keyboard navigation
- `handleDragStart(photo)`: Initiates drag
- `handleDrop(targetPhoto)`: Completes reorder
- `handleDelete(photoId)`: Deletes photo with confirmation
- `handleSetPrimary(photoId)`: Sets primary photo

**UI Elements**:
- Grid of photo thumbnails
- Primary photo indicator
- Drag handles (editable mode)
- Delete button (editable mode)
- Set primary button (editable mode)
- Full-size modal with navigation
- Photo counter (e.g., "3 / 10")
- Keyboard navigation support

#### LeadsDashboard Component

**Location**: `frontend/src/components/LeadsDashboard.jsx`

**Props**:
- None (fetches data based on authenticated dealer)

**State**:
```javascript
{
  leads: [],
  filters: {
    status: 'all',
    vehicleId: null,
    startDate: null,
    endDate: null
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0
  },
  loading: false,
  analytics: null
}
```

**Key Methods**:
- `fetchLeads()`: Fetches leads with filters
- `handleFilterChange(filter, value)`: Updates filters
- `handleStatusUpdate(leadId, status)`: Updates lead status
- `handleLeadClick(leadId)`: Navigates to conversation
- `exportLeads()`: Exports leads to CSV

**UI Elements**:
- Filter controls (status, vehicle, date range)
- Leads table/list with sorting
- Status badges
- Quick actions (view conversation, update status)
- Pagination controls
- Analytics summary cards
- Export button

## Data Models

### Lead Model Schema

```sql
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  dealer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE SET NULL,
  source VARCHAR(50) DEFAULT 'web_form',
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leads_dealer_id ON leads(dealer_id);
CREATE INDEX idx_leads_vehicle_id ON leads(vehicle_id);
CREATE INDEX idx_leads_customer_id ON leads(customer_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
```

### VehiclePhoto Model Schema

```sql
CREATE TABLE vehicle_photos (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_filename VARCHAR(255) NOT NULL,
  original_path VARCHAR(500) NOT NULL,
  thumbnail_path VARCHAR(500) NOT NULL,
  display_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicle_photos_vehicle_id ON vehicle_photos(vehicle_id);
CREATE INDEX idx_vehicle_photos_uploaded_by ON vehicle_photos(uploaded_by);
CREATE INDEX idx_vehicle_photos_is_primary ON vehicle_photos(is_primary);
CREATE INDEX idx_vehicle_photos_display_order ON vehicle_photos(display_order);
CREATE INDEX idx_vehicle_photos_vehicle_order ON vehicle_photos(vehicle_id, display_order);
```

### Model Relationships

```javascript
// Lead Model Associations
Lead.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
Lead.belongsTo(User, { foreignKey: 'dealerId', as: 'dealer' });
Lead.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });
Lead.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

// VehiclePhoto Model Associations
VehiclePhoto.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
VehiclePhoto.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

// Vehicle Model Associations (additions)
Vehicle.hasMany(Lead, { foreignKey: 'vehicleId', as: 'leads' });
Vehicle.hasMany(VehiclePhoto, { foreignKey: 'vehicleId', as: 'photos' });

// User Model Associations (additions)
User.hasMany(Lead, { foreignKey: 'dealerId', as: 'dealerLeads' });
User.hasMany(Lead, { foreignKey: 'customerId', as: 'customerLeads' });
User.hasMany(VehiclePhoto, { foreignKey: 'uploadedBy', as: 'uploadedPhotos' });

// Conversation Model Associations (additions)
Conversation.hasMany(Lead, { foreignKey: 'conversationId', as: 'leads' });
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas of redundancy:

1. **Validation properties (2.1, 2.4)**: Both test that required fields must be present. Combined into a single comprehensive property.
2. **Photo upload limit properties (8.3, 8.4)**: Both test the 20-photo limit. Combined into one property.
3. **Photo display properties (11.1, 12.2)**: Both test that all photos are displayed. Combined into one property.
4. **Conversation creation properties (4.1, 4.2, 4.3)**: These test related aspects of conversation creation. Combined into a comprehensive property.
5. **Metadata recording properties (20.1-20.4)**: All test that different metadata fields are recorded. Combined into one comprehensive property.

### Property 1: Lead Creation Completeness

*For any* valid inquiry submission, creating a lead should result in a database record containing all submitted information (customer name, email, phone, message, vehicle ID, dealer ID, customer ID if authenticated, and timestamp).

**Validates: Requirements 3.1, 3.2**

### Property 2: Vehicle-Lead Association

*For any* created lead, the associated vehicle ID should match the vehicle being inquired about, and the dealer ID should match the owner of that vehicle.

**Validates: Requirements 3.3, 3.4**

### Property 3: Authenticated Customer Association

*For any* inquiry submitted by an authenticated user, the created lead should have the customer ID field populated with the authenticated user's ID.

**Validates: Requirements 3.5**

### Property 4: Conversation Creation from Lead

*For any* created lead, a conversation should exist between the customer and dealer containing an initial message with the inquiry text and vehicle information (make, model, year), and the conversation status should be active.

**Validates: Requirements 4.1, 4.2, 4.3, 4.5**

### Property 5: Conversation Idempotence

*For any* customer-dealer-vehicle combination, creating multiple leads should reuse the existing conversation rather than creating duplicates, adding new messages to the existing conversation.

**Validates: Requirements 4.4**

### Property 6: Dealer Notification Creation

*For any* created lead, a notification should be created for the dealer containing the customer name, vehicle details, inquiry message, and a link to the conversation.

**Validates: Requirements 6.1, 6.3, 6.4**

### Property 7: Email Notification Delivery

*For any* created lead, an email notification should be sent to the dealer's registered email address.

**Validates: Requirements 6.2**

### Property 8: Required Field Validation

*For any* inquiry form submission with one or more empty required fields (name, email, or message), the submission should be rejected with field-specific error messages.

**Validates: Requirements 2.1, 2.4**

### Property 9: Email Format Validation

*For any* string that does not match valid email format patterns, the inquiry form should reject it with an email validation error.

**Validates: Requirements 2.2**

### Property 10: Phone Format Acceptance

*For any* string matching common phone number formats (with or without country codes, with various separators), the inquiry form should accept it as valid.

**Validates: Requirements 2.3**

### Property 11: Image Format Validation

*For any* file with MIME type of image/jpeg, image/png, or image/webp, the photo upload component should accept it; for any other MIME type, it should reject the file with an error message.

**Validates: Requirements 7.3, 8.1**

### Property 12: Image Size Validation

*For any* image file exceeding 10MB in size, the photo upload component should reject it with a file size error message.

**Validates: Requirements 8.2**

### Property 13: Photo Count Limit

*For any* vehicle, attempting to upload photos when the vehicle already has 20 or more photos should be rejected with a limit exceeded message.

**Validates: Requirements 8.3, 8.4**

### Property 14: Image Dimension Validation

*For any* image with width less than 800 pixels or height less than 600 pixels, the photo upload component should reject it with a dimension error message.

**Validates: Requirements 8.5**

### Property 15: Image Optimization File Size

*For any* uploaded image, after optimization, the file size should be less than or equal to the original file size.

**Validates: Requirements 9.1**

### Property 16: Aspect Ratio Preservation

*For any* uploaded image, the aspect ratio (width/height) of the optimized versions should match the original aspect ratio within a tolerance of 1%.

**Validates: Requirements 9.2**

### Property 17: Thumbnail Generation

*For any* uploaded image, a thumbnail version should be generated with dimensions of 300x225 pixels (or proportionally scaled to fit within these bounds while maintaining aspect ratio).

**Validates: Requirements 9.3**

### Property 18: Display Version Generation

*For any* uploaded image, a display version should be generated with maximum dimensions of 1200x900 pixels (scaled proportionally if larger).

**Validates: Requirements 9.4**

### Property 19: Multi-Version Storage

*For any* uploaded image, three versions (original, thumbnail, display) should be stored with unique file paths.

**Validates: Requirements 9.5**

### Property 20: Image Processing Round-Trip

*For any* uploaded image, the sequence of optimizing, storing, and retrieving should produce an image that is visually equivalent to the original (measured by structural similarity index > 0.95).

**Validates: Requirements 9.7**

### Property 21: Photo Metadata Persistence

*For any* uploaded photo, the database record should contain all metadata fields: upload timestamp, uploader user ID, original filename, file size, dimensions (width, height), and MIME type.

**Validates: Requirements 9.6, 20.1, 20.2, 20.3, 20.4**

### Property 22: Photo Deletion Authorization

*For any* photo deletion request, if the authenticated user is not the owner of the vehicle associated with the photo, the request should be rejected with an authorization error.

**Validates: Requirements 16.3**

### Property 23: Photo Upload Authorization

*For any* photo upload request, if the authenticated user is not the owner of the vehicle, the request should be rejected with an authorization error.

**Validates: Requirements 16.2**

### Property 24: Upload Authentication Requirement

*For any* photo upload request without valid authentication credentials, the request should be rejected with an authentication error.

**Validates: Requirements 16.1**

### Property 25: Primary Photo Assignment

*For any* photo in a vehicle's photo collection, setting it as primary should result in that photo having isPrimary=true and all other photos for that vehicle having isPrimary=false.

**Validates: Requirements 11.5**

### Property 26: Default Primary Photo

*For any* vehicle with photos but no explicitly designated primary photo, the photo with the lowest display_order (first photo) should be treated as the primary photo.

**Validates: Requirements 11.6**

### Property 27: Photo Display Completeness

*For any* vehicle with N photos, querying the photos should return all N photos ordered by display_order.

**Validates: Requirements 11.1, 12.2, 12.3**

### Property 28: Primary Photo Display

*For any* vehicle with photos, the vehicle listing card should display the photo marked as primary (or the first photo if no primary is designated).

**Validates: Requirements 12.1**

### Property 29: Thumbnail Loading in Listings

*For any* vehicle photo displayed in a listing view, the thumbnail version of the image should be loaded rather than the full-size version.

**Validates: Requirements 14.1**

### Property 30: Image Caching

*For any* image URL, requesting it multiple times should result in only one network request, with subsequent requests served from cache.

**Validates: Requirements 14.4**

### Property 31: Lead Sorting

*For any* set of leads retrieved for a dealer, they should be ordered by creation timestamp in descending order (most recent first).

**Validates: Requirements 15.2**

### Property 32: Lead Filtering

*For any* lead query with filters (status, vehicle ID, date range), only leads matching all specified filter criteria should be returned.

**Validates: Requirements 15.4**

### Property 33: Lead Display Completeness

*For any* lead displayed in the dashboard, it should include customer name, email, phone, inquiry message, vehicle information, and status.

**Validates: Requirements 15.3, 15.5**

### Property 34: Unauthenticated Rate Limiting

*For any* IP address, after submitting 5 inquiries within a 60-minute window, subsequent inquiry requests from that IP should be rejected with a rate limit error containing the time until reset.

**Validates: Requirements 17.1, 17.3, 17.4**

### Property 35: Authenticated Rate Limiting

*For any* authenticated user account, after submitting 20 inquiries within a 60-minute window, subsequent inquiry requests should be rejected with a rate limit error containing the time until reset.

**Validates: Requirements 17.2, 17.3, 17.4**

### Property 36: Rate Limit Violation Logging

*For any* inquiry request that is rejected due to rate limiting, a log entry should be created recording the violation.

**Validates: Requirements 17.5**

### Property 37: Inquiry Count Tracking

*For any* vehicle, the number of associated leads in the database should equal the inquiry count displayed in analytics.

**Validates: Requirements 19.1, 19.2**

### Property 38: Conversion Rate Calculation

*For any* set of leads, the conversion rate should equal (number of leads with status='converted') / (total number of leads).

**Validates: Requirements 19.3**

### Property 39: CSV Export Completeness

*For any* set of leads exported to CSV, the CSV should contain all lead records with all fields (ID, customer info, vehicle info, message, status, timestamps).

**Validates: Requirements 19.5**

### Property 40: Path Traversal Prevention

*For any* file path input containing directory traversal patterns (../, ..\, etc.), the system should reject the request and not access files outside the designated upload directory.

**Validates: Requirements 16.5**

## Error Handling

### Error Categories

1. **Validation Errors**
   - Invalid email format
   - Missing required fields
   - Invalid phone format
   - File type not supported
   - File size exceeds limit
   - Image dimensions too small
   - Photo count limit exceeded

2. **Authentication/Authorization Errors**
   - User not authenticated
   - User not authorized to upload photos for vehicle
   - User not authorized to delete photos
   - User not authorized to view leads

3. **Rate Limiting Errors**
   - Too many inquiry requests from IP
   - Too many inquiry requests from account
   - Include retry-after time in response

4. **Resource Errors**
   - Vehicle not found
   - Lead not found
   - Photo not found
   - Conversation not found

5. **System Errors**
   - Database connection failure
   - File system write failure
   - Image processing failure
   - Email delivery failure
   - External service unavailable

### Error Response Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Specific field error if applicable"
    }
  }
}
```

### Error Handling Strategies

1. **Validation Errors**: Return 400 Bad Request with detailed field-level errors
2. **Authentication Errors**: Return 401 Unauthorized with clear message
3. **Authorization Errors**: Return 403 Forbidden with explanation
4. **Rate Limiting**: Return 429 Too Many Requests with Retry-After header
5. **Not Found**: Return 404 Not Found with resource type
6. **Server Errors**: Return 500 Internal Server Error, log details, show generic message to user

### Frontend Error Handling

- Display validation errors inline next to form fields
- Show toast notifications for successful operations
- Display modal dialogs for critical errors
- Provide retry mechanisms for failed uploads
- Show loading states during async operations
- Implement exponential backoff for retries
- Cache failed requests for offline support

### Image Processing Error Handling

- Validate file before processing
- Catch and log image processing exceptions
- Clean up partial files on failure
- Rollback database records if file operations fail
- Provide meaningful error messages (e.g., "corrupted image file")

### Transaction Management

- Use database transactions for lead creation + conversation creation
- Rollback on any failure in the chain
- Ensure atomic operations for photo uploads (file + database)
- Implement compensating transactions for distributed operations

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, error conditions, and integration points
- **Property-Based Tests**: Verify universal properties across randomized inputs

### Property-Based Testing Configuration

**Library Selection**: 
- Backend: `fast-check` for JavaScript/Node.js
- Frontend: `fast-check` for React component testing

**Test Configuration**:
- Minimum 100 iterations per property test
- Each property test references its design document property
- Tag format: `Feature: vehicle-inquiry-photo-management, Property {number}: {property_text}`

### Unit Testing Focus Areas

1. **API Endpoint Tests**
   - Test each endpoint with valid inputs
   - Test authentication and authorization
   - Test error responses
   - Test pagination and filtering

2. **Model Tests**
   - Test model creation with valid data
   - Test model associations
   - Test model methods
   - Test validation rules

3. **Service Layer Tests**
   - Test lead creation service
   - Test conversation integration
   - Test image processing service
   - Test notification service

4. **Component Tests**
   - Test form rendering and interaction
   - Test photo upload UI
   - Test photo gallery display
   - Test leads dashboard

5. **Integration Tests**
   - Test complete inquiry submission flow
   - Test complete photo upload flow
   - Test lead-to-conversation creation
   - Test notification delivery

### Property-Based Testing Focus Areas

Each correctness property should be implemented as a property-based test:

1. **Lead Management Properties** (Properties 1-10)
   - Generate random valid/invalid inquiry data
   - Test lead creation completeness
   - Test validation rules
   - Test associations

2. **Photo Upload Properties** (Properties 11-21)
   - Generate random image files
   - Test validation rules
   - Test image processing
   - Test multi-version generation

3. **Authorization Properties** (Properties 22-24)
   - Generate random user/vehicle combinations
   - Test authorization checks
   - Test authentication requirements

4. **Photo Management Properties** (Properties 25-30)
   - Generate random photo collections
   - Test primary photo logic
   - Test ordering and display
   - Test caching behavior

5. **Lead Dashboard Properties** (Properties 31-33)
   - Generate random lead datasets
   - Test sorting and filtering
   - Test display completeness

6. **Rate Limiting Properties** (Properties 34-36)
   - Generate request sequences
   - Test rate limit enforcement
   - Test logging

7. **Analytics Properties** (Properties 37-39)
   - Generate random lead data
   - Test calculation accuracy
   - Test export completeness

8. **Security Properties** (Property 40)
   - Generate malicious path inputs
   - Test path traversal prevention

### Test Data Generation

**For Property-Based Tests**:
- Use `fast-check` arbitraries to generate:
  - Random user data (names, emails, phones)
  - Random vehicle data
  - Random image files (various formats, sizes, dimensions)
  - Random timestamps and date ranges
  - Random valid/invalid inputs

**For Unit Tests**:
- Use factory functions for consistent test data
- Use fixtures for image files
- Mock external services (email, storage)

### Testing Tools

- **Backend Testing**: Vitest, Supertest, fast-check
- **Frontend Testing**: Vitest, React Testing Library, fast-check
- **E2E Testing**: Playwright or Cypress
- **API Testing**: Supertest
- **Database Testing**: In-memory PostgreSQL or test database

### Coverage Goals

- Unit test coverage: > 80%
- Property test coverage: All 40 properties implemented
- Integration test coverage: All critical user flows
- E2E test coverage: Happy paths and critical error scenarios

### Continuous Integration

- Run all tests on every commit
- Run property tests with increased iterations (1000+) on main branch
- Generate coverage reports
- Fail build on test failures or coverage drops


## Integration Points

### Messaging System Integration

The lead management system integrates with the existing messaging infrastructure:

**Conversation Creation Flow**:
```javascript
// When a lead is created
async function createLeadWithConversation(leadData) {
  const transaction = await sequelize.transaction();
  
  try {
    // 1. Create the lead
    const lead = await Lead.create(leadData, { transaction });
    
    // 2. Find or create conversation
    const conversation = await Conversation.findOrCreateByParticipants(
      leadData.customerId || null,
      leadData.dealerId,
      {
        conversationType: 'direct',
        relatedVehicleId: leadData.vehicleId,
        title: `Inquiry: ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`
      },
      { transaction }
    );
    
    // 3. Create initial message
    const message = await Message.create({
      conversationId: conversation.id,
      senderId: leadData.customerId || null, // System message if guest
      content: formatInquiryMessage(leadData, vehicleInfo),
      messageType: 'text'
    }, { transaction });
    
    // 4. Update conversation with last message
    await conversation.updateLastMessage(message.id, { transaction });
    
    // 5. Update lead with conversation reference
    lead.conversationId = conversation.id;
    await lead.save({ transaction });
    
    await transaction.commit();
    return { lead, conversation, message };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

**Message Formatting**:
```javascript
function formatInquiryMessage(leadData, vehicleInfo) {
  return `
New inquiry from ${leadData.customerName}

Vehicle: ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}
Price: $${vehicleInfo.price}

Customer Contact:
Email: ${leadData.customerEmail}
Phone: ${leadData.customerPhone || 'Not provided'}

Message:
${leadData.message}
  `.trim();
}
```

### Email Notification Integration

**Email Service Configuration**:
```javascript
// backend/src/services/emailService.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendLeadNotification(lead, dealer, vehicle) {
  const conversationUrl = `${process.env.FRONTEND_URL}/messages/${lead.conversationId}`;
  
  const emailHtml = `
    <h2>New Vehicle Inquiry</h2>
    <p>You have received a new inquiry for your vehicle listing.</p>
    
    <h3>Vehicle Details</h3>
    <p><strong>${vehicle.year} ${vehicle.make} ${vehicle.model}</strong></p>
    <p>Price: $${vehicle.price}</p>
    
    <h3>Customer Information</h3>
    <p>Name: ${lead.customerName}</p>
    <p>Email: ${lead.customerEmail}</p>
    <p>Phone: ${lead.customerPhone || 'Not provided'}</p>
    
    <h3>Inquiry Message</h3>
    <p>${lead.message}</p>
    
    <p><a href="${conversationUrl}">View and Respond to Inquiry</a></p>
  `;
  
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: dealer.email,
    subject: `New Inquiry: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    html: emailHtml
  });
}
```

### Real-Time Notification Integration

**Socket.io Integration**:
```javascript
// backend/src/services/notificationService.js
import { io } from '../server.js';

async function sendRealtimeNotification(userId, notification) {
  // Check if user is connected
  const userSockets = await io.in(`user:${userId}`).fetchSockets();
  
  if (userSockets.length > 0) {
    io.to(`user:${userId}`).emit('notification', {
      type: 'new_lead',
      data: notification,
      timestamp: new Date()
    });
  }
}

// When lead is created
async function notifyDealerOfLead(lead, dealer, vehicle) {
  const notification = {
    id: lead.id,
    title: 'New Vehicle Inquiry',
    message: `${lead.customerName} inquired about your ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    conversationId: lead.conversationId,
    vehicleId: vehicle.id,
    createdAt: lead.createdAt
  };
  
  await sendRealtimeNotification(dealer.id, notification);
}
```

### Vehicle Model Integration

**Update Vehicle Model**:
```javascript
// Add to backend/src/models/Vehicle.js

// Method to get inquiry count
Vehicle.prototype.getInquiryCount = async function() {
  const Lead = require('./Lead').default;
  return await Lead.count({ where: { vehicleId: this.id } });
};

// Method to get primary photo
Vehicle.prototype.getPrimaryPhoto = async function() {
  const VehiclePhoto = require('./VehiclePhoto').default;
  let photo = await VehiclePhoto.findOne({
    where: { vehicleId: this.id, isPrimary: true }
  });
  
  if (!photo) {
    photo = await VehiclePhoto.findOne({
      where: { vehicleId: this.id },
      order: [['displayOrder', 'ASC']]
    });
  }
  
  return photo;
};

// Include photos in vehicle queries
Vehicle.findWithPhotos = async function(vehicleId) {
  const VehiclePhoto = require('./VehiclePhoto').default;
  return await this.findByPk(vehicleId, {
    include: [{
      model: VehiclePhoto,
      as: 'photos',
      order: [['displayOrder', 'ASC']]
    }]
  });
};
```

## Image Processing Pipeline

### Upload Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Multer
    participant Validator
    participant Processor
    participant Storage
    participant Database
    
    Client->>API: POST /vehicles/:id/photos
    API->>Multer: Parse multipart/form-data
    Multer->>Validator: Validate files
    Validator->>Validator: Check format, size, dimensions
    alt Validation fails
        Validator->>Client: 400 Bad Request
    else Validation passes
        Validator->>Processor: Process images
        Processor->>Processor: Generate thumbnail
        Processor->>Processor: Generate display version
        Processor->>Processor: Optimize original
        Processor->>Storage: Save all versions
        Storage->>Database: Save metadata
        Database->>Client: 201 Created with photo data
    end
```

### Image Processing Service

**Location**: `backend/src/services/imageProcessingService.js`

```javascript
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads/vehicles';
const THUMBNAIL_SIZE = { width: 300, height: 225 };
const DISPLAY_SIZE = { width: 1200, height: 900 };

class ImageProcessingService {
  /**
   * Process uploaded image and generate multiple versions
   */
  async processImage(file, vehicleId) {
    const fileId = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    const vehicleDir = path.join(UPLOAD_DIR, vehicleId.toString());
    
    // Ensure directory exists
    await fs.mkdir(vehicleDir, { recursive: true });
    
    // Read original image
    const image = sharp(file.buffer);
    const metadata = await image.metadata();
    
    // Generate paths
    const paths = {
      original: path.join(vehicleDir, `original_${fileId}${ext}`),
      thumbnail: path.join(vehicleDir, `thumb_${fileId}.jpg`),
      display: path.join(vehicleDir, `display_${fileId}.jpg`)
    };
    
    // Process and save original (optimized)
    await image
      .jpeg({ quality: 90, progressive: true })
      .toFile(paths.original);
    
    // Generate thumbnail
    await sharp(file.buffer)
      .resize(THUMBNAIL_SIZE.width, THUMBNAIL_SIZE.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toFile(paths.thumbnail);
    
    // Generate display version
    await sharp(file.buffer)
      .resize(DISPLAY_SIZE.width, DISPLAY_SIZE.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toFile(paths.display);
    
    // Get file sizes
    const [originalStats, thumbStats, displayStats] = await Promise.all([
      fs.stat(paths.original),
      fs.stat(paths.thumbnail),
      fs.stat(paths.display)
    ]);
    
    return {
      originalPath: paths.original,
      thumbnailPath: paths.thumbnail,
      displayPath: paths.display,
      originalFilename: file.originalname,
      fileSize: originalStats.size,
      mimeType: file.mimetype,
      width: metadata.width,
      height: metadata.height
    };
  }
  
  /**
   * Delete all versions of an image
   */
  async deleteImage(photo) {
    await Promise.all([
      fs.unlink(photo.originalPath).catch(() => {}),
      fs.unlink(photo.thumbnailPath).catch(() => {}),
      fs.unlink(photo.displayPath).catch(() => {})
    ]);
  }
  
  /**
   * Validate image file
   */
  validateImage(file) {
    const errors = [];
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
    }
    
    // Check file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('File size exceeds 10MB limit.');
    }
    
    return errors;
  }
  
  /**
   * Validate image dimensions
   */
  async validateDimensions(buffer) {
    const metadata = await sharp(buffer).metadata();
    const minWidth = 800;
    const minHeight = 600;
    
    if (metadata.width < minWidth || metadata.height < minHeight) {
      return `Image dimensions must be at least ${minWidth}x${minHeight} pixels.`;
    }
    
    return null;
  }
}

export default new ImageProcessingService();
```

### Multer Configuration

**Location**: `backend/src/middleware/upload.js`

```javascript
import multer from 'multer';

// Use memory storage for processing
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
  }
};

// Configure multer
export const uploadPhotos = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 20 // Max 20 files per request
  }
});
```

### Storage Strategy

**Local File System** (Default):
- Store files in `uploads/vehicles/{vehicleId}/` directory
- Organize by vehicle ID for easy management
- Serve static files through Express static middleware
- Implement cleanup on vehicle deletion

**Cloud Storage** (Optional - Future Enhancement):
- AWS S3 or Google Cloud Storage
- Use signed URLs for secure access
- Implement CDN for faster delivery
- Automatic backup and redundancy

**Static File Serving**:
```javascript
// backend/src/server.js
import express from 'express';
import path from 'path';

const app = express();

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '7d', // Cache for 7 days
  etag: true,
  lastModified: true
}));
```

## Security Considerations

### Authentication and Authorization

**Middleware Implementation**:
```javascript
// backend/src/middleware/photoAuth.js
import Vehicle from '../models/Vehicle.js';

export async function requireVehicleOwnership(req, res, next) {
  try {
    const vehicleId = req.params.vehicleId;
    const userId = req.user.id;
    
    const vehicle = await Vehicle.findByPk(vehicleId);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'VEHICLE_NOT_FOUND',
          message: 'Vehicle not found'
        }
      });
    }
    
    if (vehicle.dealerId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You do not have permission to manage photos for this vehicle'
        }
      });
    }
    
    req.vehicle = vehicle;
    next();
  } catch (error) {
    next(error);
  }
}
```

### Rate Limiting

**Lead Submission Rate Limiter**:
```javascript
// backend/src/middleware/leadRateLimiter.js
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis.js';

// Unauthenticated users: 5 per hour per IP
export const guestLeadLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:lead:guest:'
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many inquiries. Please try again later.',
      retryAfter: null // Will be populated by middleware
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.user !== undefined, // Skip for authenticated users
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many inquiries. Please try again later.',
        retryAfter
      }
    });
  }
});

// Authenticated users: 20 per hour per account
export const userLeadLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:lead:user:'
  }),
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.id?.toString() || req.ip,
  skip: (req) => req.user === undefined,
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many inquiries. Please try again later.',
        retryAfter
      }
    });
  }
});
```

### File Upload Validation

**Comprehensive Validation**:
```javascript
// backend/src/middleware/photoValidation.js
import VehiclePhoto from '../models/VehiclePhoto.js';
import imageProcessingService from '../services/imageProcessingService.js';

export async function validatePhotoUpload(req, res, next) {
  try {
    const vehicleId = req.params.vehicleId;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILES',
          message: 'No files provided'
        }
      });
    }
    
    // Check photo count limit
    const existingCount = await VehiclePhoto.count({ where: { vehicleId } });
    if (existingCount + files.length > 20) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PHOTO_LIMIT_EXCEEDED',
          message: `Cannot upload ${files.length} photos. Vehicle already has ${existingCount} photos. Maximum is 20.`
        }
      });
    }
    
    // Validate each file
    const validationErrors = [];
    for (const file of files) {
      // Basic validation
      const errors = imageProcessingService.validateImage(file);
      if (errors.length > 0) {
        validationErrors.push({
          filename: file.originalname,
          errors
        });
        continue;
      }
      
      // Dimension validation
      const dimensionError = await imageProcessingService.validateDimensions(file.buffer);
      if (dimensionError) {
        validationErrors.push({
          filename: file.originalname,
          errors: [dimensionError]
        });
      }
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Some files failed validation',
          details: validationErrors
        }
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
}
```

### Path Traversal Prevention

**Secure File Path Handling**:
```javascript
// backend/src/utils/pathSecurity.js
import path from 'path';

export function sanitizeFilePath(filePath, baseDir) {
  // Resolve the absolute path
  const resolvedPath = path.resolve(baseDir, filePath);
  const resolvedBase = path.resolve(baseDir);
  
  // Check if the resolved path is within the base directory
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error('Invalid file path: Path traversal detected');
  }
  
  return resolvedPath;
}

export function validateFileName(filename) {
  // Remove any path separators
  const sanitized = filename.replace(/[/\\]/g, '');
  
  // Check for suspicious patterns
  if (sanitized.includes('..') || sanitized.startsWith('.')) {
    throw new Error('Invalid filename');
  }
  
  return sanitized;
}
```

### CORS Configuration

**Secure CORS Setup**:
```javascript
// backend/src/config/cors.js
export const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

### Input Sanitization

**Sanitize User Input**:
```javascript
// backend/src/utils/sanitization.js
import validator from 'validator';

export function sanitizeLeadInput(data) {
  return {
    customerName: validator.escape(validator.trim(data.customerName)),
    customerEmail: validator.normalizeEmail(data.customerEmail),
    customerPhone: validator.trim(data.customerPhone || ''),
    message: validator.escape(validator.trim(data.message)),
    vehicleId: parseInt(data.vehicleId, 10)
  };
}
```

### SQL Injection Prevention

- Use Sequelize ORM with parameterized queries
- Never concatenate user input into SQL queries
- Use prepared statements for all database operations
- Validate and sanitize all input before database operations

### XSS Prevention

- Escape all user-generated content before rendering
- Use Content Security Policy headers
- Sanitize HTML in rich text fields
- Use React's built-in XSS protection

### CSRF Protection

- Use CSRF tokens for state-changing operations
- Validate origin headers
- Use SameSite cookie attribute
- Implement double-submit cookie pattern

## Performance Considerations

### Image Optimization

- Use Sharp library for fast image processing
- Process images asynchronously
- Implement queue system for batch uploads
- Cache processed images

### Database Optimization

- Index frequently queried fields
- Use composite indexes for common query patterns
- Implement pagination for large result sets
- Use database connection pooling

### Caching Strategy

- Cache vehicle photos in browser (7-day cache)
- Use Redis for rate limiting
- Cache lead analytics calculations
- Implement CDN for static assets

### Lazy Loading

- Lazy load images in photo gallery
- Implement infinite scroll for leads dashboard
- Load thumbnails first, full images on demand
- Use intersection observer for viewport detection

## Deployment Considerations

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/autosphere

# File Storage
UPLOAD_DIR=/var/www/autosphere/uploads
MAX_FILE_SIZE=10485760

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@autosphere.com
SMTP_PASS=secret
SMTP_FROM=AutoSphere <noreply@autosphere.com>

# Frontend URL
FRONTEND_URL=https://autosphere.com

# Redis
REDIS_URL=redis://localhost:6379
```

### File System Permissions

- Ensure upload directory is writable by application
- Set appropriate file permissions (644 for files, 755 for directories)
- Implement disk space monitoring
- Set up automated cleanup for orphaned files

### Backup Strategy

- Regular database backups including photo metadata
- Backup uploaded files to separate storage
- Implement point-in-time recovery
- Test restore procedures regularly

### Monitoring

- Monitor disk space usage
- Track image processing performance
- Monitor rate limit violations
- Alert on email delivery failures
- Track lead conversion metrics

