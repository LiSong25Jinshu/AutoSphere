# AutoSphere Backend API Documentation

## Overview

The AutoSphere backend provides a comprehensive REST API for managing vehicles, bookings, messaging, and user authentication in an automotive marketplace and service platform.

**Base URL:** `http://localhost:5001/api`

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Authentication (`/api/auth`)

#### POST `/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "user" // optional: "user", "dealer", "service_provider"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": { /* user object */ },
  "token": "jwt-token"
}
```

#### POST `/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET `/auth/me`
Get current user information (requires authentication).

#### POST `/auth/refresh`
Refresh JWT token (requires authentication).

#### POST `/auth/logout`
Logout user (requires authentication).

---

### Users (`/api/users`)

#### GET `/users/profile`
Get current user's profile (requires authentication).

#### PUT `/users/profile`
Update current user's profile (requires authentication).

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "email": "newemail@example.com"
}
```

#### PATCH `/users/change-password`
Change user password (requires authentication).

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

#### GET `/users` (Admin only)
Get all users with pagination and filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `role`: Filter by role
- `search`: Search by name or email

#### GET `/users/service-providers/list`
Get list of service providers (public endpoint).

---

### Vehicles (`/api/vehicles`)

#### GET `/vehicles`
Get vehicles with search and filtering.

**Query Parameters:**
- `page`, `limit`: Pagination
- `make`, `model`: Vehicle make/model
- `minYear`, `maxYear`: Year range
- `minPrice`, `maxPrice`: Price range
- `condition`: "new", "used", "certified_pre_owned"
- `fuelType`: "gasoline", "diesel", "hybrid", "electric", "plug_in_hybrid"
- `bodyType`: "sedan", "suv", "hatchback", etc.
- `featured`: "true" for featured vehicles only

#### GET `/vehicles/:id`
Get vehicle details by ID.

#### POST `/vehicles` (Dealers only)
Create a new vehicle listing.

**Request Body:**
```json
{
  "make": "Toyota",
  "model": "Camry",
  "year": 2023,
  "price": 25000.00,
  "condition": "new",
  "fuelType": "gasoline",
  "transmission": "automatic",
  "bodyType": "sedan",
  "mileage": 0,
  "color": "Silver",
  "vin": "1HGBH41JXMN109186",
  "description": "Brand new Toyota Camry...",
  "features": ["GPS", "Bluetooth", "Backup Camera"],
  "images": ["image1.jpg", "image2.jpg"]
}
```

#### PUT `/vehicles/:id` (Vehicle owner only)
Update vehicle information.

#### DELETE `/vehicles/:id` (Vehicle owner only)
Delete vehicle listing.

#### GET `/vehicles/dealer/:dealerId`
Get vehicles by specific dealer.

---

### Bookings (`/api/bookings`)

#### GET `/bookings`
Get bookings for authenticated user.

**Query Parameters:**
- `status`: Filter by booking status
- `page`, `limit`: Pagination

#### GET `/bookings/:id`
Get booking details by ID.

#### POST `/bookings`
Create a new service booking.

**Request Body:**
```json
{
  "serviceProviderId": 123,
  "serviceType": "oil_change",
  "title": "Oil Change Service",
  "description": "Regular oil change and filter replacement",
  "scheduledDate": "2024-02-15",
  "scheduledTime": "10:00",
  "vehicleId": 456,
  "estimatedDuration": 60,
  "customerNotes": "Please use synthetic oil"
}
```

#### PATCH `/bookings/:id/status`
Update booking status.

**Request Body:**
```json
{
  "status": "confirmed",
  "providerNotes": "Confirmed for tomorrow",
  "actualCost": 75.00
}
```

#### PATCH `/bookings/:id/review`
Add rating and review to completed booking.

**Request Body:**
```json
{
  "rating": 5,
  "review": "Excellent service!"
}
```

#### PATCH `/bookings/:id/reschedule`
Reschedule a booking.

**Request Body:**
```json
{
  "scheduledDate": "2024-02-16",
  "scheduledTime": "14:00"
}
```

---

### Messages (`/api/messages`)

#### GET `/messages/conversations`
Get user's conversations.

**Query Parameters:**
- `page`, `limit`: Pagination

#### GET `/messages/conversations/:conversationId/messages`
Get messages in a conversation.

#### POST `/messages/conversations/:conversationId/messages`
Send a message in a conversation.

**Request Body:**
```json
{
  "content": "Hello, I'm interested in your vehicle.",
  "messageType": "text",
  "replyToId": 123 // optional
}
```

#### POST `/messages/conversations`
Start a new conversation.

**Request Body:**
```json
{
  "participantId": 456,
  "initialMessage": "Hi, I'd like to inquire about your service.",
  "conversationType": "direct",
  "relatedVehicleId": 789 // optional
}
```

#### PATCH `/messages/messages/:messageId`
Edit a message (sender only).

---

## Data Models

### User
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "user", // "user", "dealer", "service_provider", "admin"
  "isVerified": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Vehicle
```json
{
  "id": 1,
  "dealerId": 123,
  "make": "Toyota",
  "model": "Camry",
  "year": 2023,
  "price": 25000.00,
  "mileage": 15000,
  "condition": "used",
  "fuelType": "gasoline",
  "transmission": "automatic",
  "bodyType": "sedan",
  "color": "Silver",
  "vin": "1HGBH41JXMN109186",
  "description": "Well-maintained vehicle...",
  "features": ["GPS", "Bluetooth"],
  "images": ["image1.jpg", "image2.jpg"],
  "status": "available",
  "viewCount": 45,
  "isFeatured": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Booking
```json
{
  "id": 1,
  "userId": 123,
  "serviceProviderId": 456,
  "vehicleId": 789,
  "serviceType": "oil_change",
  "title": "Oil Change Service",
  "description": "Regular maintenance",
  "scheduledDate": "2024-02-15",
  "scheduledTime": "10:00:00",
  "estimatedDuration": 60,
  "estimatedCost": 75.00,
  "actualCost": 75.00,
  "status": "completed",
  "priority": "normal",
  "rating": 5,
  "review": "Great service!",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [/* validation errors if applicable */]
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Rate Limiting

API requests are rate-limited to 100 requests per 15-minute window per IP address.

## Pagination

Paginated endpoints return data in this format:

```json
{
  "success": true,
  "data": [/* array of items */],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```