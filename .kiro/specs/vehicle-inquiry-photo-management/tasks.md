# Implementation Plan: Vehicle Inquiry/Lead Management and Photo Upload System

## Overview

This implementation plan breaks down the vehicle inquiry/lead management and photo upload system into discrete, manageable coding tasks. The system enables potential buyers to submit inquiries through contact forms, automatically creates conversations in the messaging system, and provides dealers with comprehensive photo management capabilities.

The implementation follows a layered approach: database setup, backend services and APIs, frontend components, testing, and deployment configuration. Each task builds incrementally on previous work, with checkpoints to ensure stability.

## Tasks

- [ ] 1. Database setup and model creation
  - [ ] 1.1 Create Lead model migration and model file
    - Create migration file for leads table with all fields (vehicleId, dealerId, customerId, customerName, customerEmail, customerPhone, message, status, conversationId, source, metadata, timestamps)
    - Add indexes for dealer_id, vehicle_id, customer_id, status, created_at
    - Create Lead model in backend/src/models/Lead.js with Sequelize schema
    - Define model associations (belongsTo Vehicle, User as dealer, User as customer, Conversation)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 1.2 Write property test for Lead model
    - **Property 1: Lead Creation Completeness**
    - **Validates: Requirements 3.1, 3.2**
  
  - [ ] 1.3 Create VehiclePhoto model migration and model file
    - Create migration file for vehicle_photos table with all fields (vehicleId, uploadedBy, originalFilename, originalPath, thumbnailPath, displayPath, fileSize, mimeType, width, height, isPrimary, displayOrder, metadata, timestamps)
    - Add indexes for vehicle_id, uploaded_by, is_primary, display_order, and composite index on (vehicle_id, display_order)
    - Create VehiclePhoto model in backend/src/models/VehiclePhoto.js with Sequelize schema
    - Define model associations (belongsTo Vehicle, User as uploader)
    - _Requirements: 9.5, 9.6, 20.1, 20.2, 20.3, 20.4_
  
  - [ ]* 1.4 Write property test for VehiclePhoto model
    - **Property 21: Photo Metadata Persistence**
    - **Validates: Requirements 9.6, 20.1, 20.2, 20.3, 20.4**
  
  - [ ] 1.5 Update model associations in index.js
    - Add Lead and VehiclePhoto imports to backend/src/models/index.js
    - Add Vehicle.hasMany(Lead) and Vehicle.hasMany(VehiclePhoto) associations
    - Add User.hasMany(Lead) for both dealer and customer relationships
    - Add User.hasMany(VehiclePhoto) for uploader relationship
    - Add Conversation.hasMany(Lead) association
    - _Requirements: 3.3, 3.4, 3.5_
  
  - [ ] 1.6 Add helper methods to Vehicle model
    - Add getInquiryCount() method to Vehicle model
    - Add getPrimaryPhoto() method to Vehicle model
    - Add findWithPhotos() static method to Vehicle model
    - _Requirements: 11.6, 12.1, 19.1_

- [ ] 2. Image processing service and file upload middleware
  - [ ] 2.1 Create image processing service
    - Create backend/src/services/imageProcessingService.js
    - Implement processImage() method to generate thumbnail (300x225), display (1200x900), and optimized original versions
    - Implement deleteImage() method to remove all versions of an image
    - Implement validateImage() method for file type and size validation
    - Implement validateDimensions() method for minimum dimension checking (800x600)
    - Use Sharp library for image processing with quality optimization
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 8.1, 8.2, 8.5_
  
  - [ ]* 2.2 Write property tests for image processing
    - **Property 15: Image Optimization File Size**
    - **Property 16: Aspect Ratio Preservation**
    - **Property 17: Thumbnail Generation**
    - **Property 18: Display Version Generation**
    - **Property 19: Multi-Version Storage**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
  
  - [ ]* 2.3 Write property test for image round-trip
    - **Property 20: Image Processing Round-Trip**
    - **Validates: Requirements 9.7**
  
  - [ ] 2.4 Create Multer upload middleware
    - Create backend/src/middleware/upload.js
    - Configure Multer with memory storage for image processing
    - Add file filter for JPEG, PNG, WebP formats
    - Set file size limit to 10MB and max 20 files per request
    - _Requirements: 7.2, 7.3, 8.1, 8.2, 8.3_
  
  - [ ] 2.5 Create photo validation middleware
    - Create backend/src/middleware/photoValidation.js
    - Implement validatePhotoUpload() middleware to check photo count limit (20 per vehicle)
    - Validate each file's type, size, and dimensions
    - Return detailed validation errors for failed files
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 2.6 Write property tests for photo validation
    - **Property 11: Image Format Validation**
    - **Property 12: Image Size Validation**
    - **Property 13: Photo Count Limit**
    - **Property 14: Image Dimension Validation**
    - **Validates: Requirements 7.3, 8.1, 8.2, 8.3, 8.4, 8.5**

- [ ] 3. Lead management service and API endpoints
  - [ ] 3.1 Create lead management service
    - Create backend/src/services/leadService.js
    - Implement createLeadWithConversation() method with transaction support
    - Implement logic to find or create conversation between customer and dealer
    - Implement formatInquiryMessage() helper to format initial message with vehicle details
    - Handle both authenticated and guest user inquiries
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ]* 3.2 Write property tests for lead service
    - **Property 2: Vehicle-Lead Association**
    - **Property 3: Authenticated Customer Association**
    - **Property 4: Conversation Creation from Lead**
    - **Property 5: Conversation Idempotence**
    - **Validates: Requirements 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5**
  
  - [ ] 3.3 Create rate limiting middleware for leads
    - Create backend/src/middleware/leadRateLimiter.js
    - Implement guestLeadLimiter (5 requests/hour per IP) using express-rate-limit with Redis
    - Implement userLeadLimiter (20 requests/hour per account)
    - Include retry-after time in rate limit error responses
    - Log rate limit violations
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_
  
  - [ ]* 3.4 Write property tests for rate limiting
    - **Property 34: Unauthenticated Rate Limiting**
    - **Property 35: Authenticated Rate Limiting**
    - **Property 36: Rate Limit Violation Logging**
    - **Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5**
  
  - [ ] 3.5 Create POST /api/leads endpoint
    - Create backend/src/routes/leads.js
    - Implement POST /api/leads endpoint with rate limiting middleware
    - Add input validation for customerName (2-100 chars), customerEmail (valid format), customerPhone (10-20 chars), message (10-1000 chars), vehicleId (must exist)
    - Sanitize user input to prevent XSS
    - Call leadService.createLeadWithConversation()
    - Return leadId and conversationId on success
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 3.6 Write property tests for inquiry validation
    - **Property 8: Required Field Validation**
    - **Property 9: Email Format Validation**
    - **Property 10: Phone Format Acceptance**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
  
  - [ ] 3.7 Create GET /api/leads endpoint
    - Implement GET /api/leads endpoint with authentication required (dealer role)
    - Add pagination support (page, limit with max 100)
    - Add filtering by status, vehicleId, startDate, endDate
    - Include vehicle details in response
    - Sort by created_at DESC (most recent first)
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [ ]* 3.8 Write property tests for lead dashboard
    - **Property 31: Lead Sorting**
    - **Property 32: Lead Filtering**
    - **Property 33: Lead Display Completeness**
    - **Validates: Requirements 15.2, 15.4, 15.3, 15.5**
  
  - [ ] 3.9 Create GET /api/leads/:id and PATCH /api/leads/:id/status endpoints
    - Implement GET /api/leads/:id with authorization check (dealer must own vehicle)
    - Implement PATCH /api/leads/:id/status to update lead status
    - Add notes field support for status updates
    - _Requirements: 15.6_
  
  - [ ] 3.10 Create GET /api/leads/analytics endpoint
    - Implement analytics endpoint with authentication required
    - Calculate totalLeads, newLeads, conversionRate
    - Group leads by vehicle with counts
    - Generate leads trend data by date
    - Support period filtering (week, month, year)
    - _Requirements: 19.1, 19.2, 19.3, 19.4_
  
  - [ ]* 3.11 Write property tests for analytics
    - **Property 37: Inquiry Count Tracking**
    - **Property 38: Conversion Rate Calculation**
    - **Validates: Requirements 19.1, 19.2, 19.3**
  
  - [ ] 3.12 Create CSV export endpoint
    - Implement GET /api/leads/export endpoint
    - Generate CSV with all lead fields
    - Apply same filtering as main leads endpoint
    - Set appropriate content-type and headers for download
    - _Requirements: 19.5_
  
  - [ ]* 3.13 Write property test for CSV export
    - **Property 39: CSV Export Completeness**
    - **Validates: Requirements 19.5**

- [ ] 4. Notification service integration
  - [ ] 4.1 Create email notification service
    - Create backend/src/services/emailService.js (or extend existing)
    - Implement sendLeadNotification() function using Nodemailer
    - Create HTML email template with vehicle details, customer info, inquiry message, and conversation link
    - Configure SMTP settings from environment variables
    - _Requirements: 6.2, 6.3, 6.4_
  
  - [ ]* 4.2 Write property test for email notifications
    - **Property 7: Email Notification Delivery**
    - **Validates: Requirements 6.2**
  
  - [ ] 4.3 Create real-time notification service
    - Create backend/src/services/notificationService.js (or extend existing)
    - Implement sendRealtimeNotification() using Socket.io
    - Implement notifyDealerOfLead() to send notification when lead is created
    - Check if dealer is online before sending real-time notification
    - _Requirements: 6.5_
  
  - [ ] 4.4 Integrate notifications into lead creation flow
    - Update leadService.createLeadWithConversation() to call notification services
    - Send email notification after successful lead creation
    - Send real-time notification if dealer is online
    - Handle notification failures gracefully without blocking lead creation
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 4.5 Write property test for notification creation
    - **Property 6: Dealer Notification Creation**
    - **Validates: Requirements 6.1, 6.3, 6.4**

- [ ] 5. Photo management API endpoints
  - [ ] 5.1 Create photo authorization middleware
    - Create backend/src/middleware/photoAuth.js
    - Implement requireVehicleOwnership() middleware to verify user owns the vehicle
    - Return 403 Forbidden if user is not vehicle owner
    - Return 404 if vehicle not found
    - _Requirements: 16.2, 16.3_
  
  - [ ]* 5.2 Write property tests for photo authorization
    - **Property 22: Photo Deletion Authorization**
    - **Property 23: Photo Upload Authorization**
    - **Property 24: Upload Authentication Requirement**
    - **Validates: Requirements 16.1, 16.2, 16.3**
  
  - [ ] 5.3 Create POST /api/vehicles/:vehicleId/photos endpoint
    - Implement photo upload endpoint with authentication, authorization, and validation middleware
    - Use Multer to parse multipart/form-data
    - Process each uploaded file using imageProcessingService
    - Save photo metadata to database with auto-incrementing displayOrder
    - Set first photo as primary if no primary exists
    - Return uploaded photo data with paths
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [ ] 5.4 Create GET /api/vehicles/:vehicleId/photos endpoint
    - Implement public endpoint to fetch all photos for a vehicle
    - Order photos by displayOrder ASC
    - Include photo metadata (dimensions, paths, isPrimary, displayOrder)
    - No authentication required
    - _Requirements: 11.1, 12.2, 12.3_
  
  - [ ]* 5.5 Write property tests for photo display
    - **Property 27: Photo Display Completeness**
    - **Property 28: Primary Photo Display**
    - **Validates: Requirements 11.1, 12.1, 12.2, 12.3**
  
  - [ ] 5.6 Create DELETE /api/vehicles/:vehicleId/photos/:photoId endpoint
    - Implement photo deletion with authentication and authorization
    - Delete all three versions of the image file using imageProcessingService
    - Delete database record
    - If deleted photo was primary, set next photo as primary
    - _Requirements: 11.3, 11.4, 16.3_
  
  - [ ] 5.7 Create PATCH /api/vehicles/:vehicleId/photos/:photoId/primary endpoint
    - Implement set primary photo endpoint with authentication and authorization
    - Set isPrimary=true for specified photo
    - Set isPrimary=false for all other photos of the vehicle
    - _Requirements: 11.5_
  
  - [ ]* 5.8 Write property tests for primary photo logic
    - **Property 25: Primary Photo Assignment**
    - **Property 26: Default Primary Photo**
    - **Validates: Requirements 11.5, 11.6**
  
  - [ ] 5.9 Create PUT /api/vehicles/:vehicleId/photos/reorder endpoint
    - Implement photo reordering endpoint with authentication and authorization
    - Accept array of photoIds in desired order
    - Update displayOrder for each photo based on array position
    - _Requirements: 11.2_
  
  - [ ] 5.10 Configure static file serving for uploads
    - Add Express static middleware to serve /uploads directory
    - Set cache headers (7 days) for image files
    - Enable ETag and Last-Modified headers
    - _Requirements: 14.1, 14.4_
  
  - [ ]* 5.11 Write property tests for image loading
    - **Property 29: Thumbnail Loading in Listings**
    - **Property 30: Image Caching**
    - **Validates: Requirements 14.1, 14.4**

- [ ] 6. Security utilities and path validation
  - [ ] 6.1 Create path security utilities
    - Create backend/src/utils/pathSecurity.js
    - Implement sanitizeFilePath() to prevent directory traversal
    - Implement validateFileName() to remove path separators and check for suspicious patterns
    - Use in image processing service to validate all file paths
    - _Requirements: 16.5_
  
  - [ ]* 6.2 Write property test for path traversal prevention
    - **Property 40: Path Traversal Prevention**
    - **Validates: Requirements 16.5**
  
  - [ ] 6.3 Create input sanitization utilities
    - Create backend/src/utils/sanitization.js
    - Implement sanitizeLeadInput() to escape and trim user input
    - Use validator library for email normalization and string escaping
    - Apply sanitization in lead creation endpoint
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 7. Checkpoint - Backend API testing
  - Ensure all backend tests pass
  - Test lead creation flow end-to-end
  - Test photo upload flow end-to-end
  - Verify rate limiting works correctly
  - Ask the user if questions arise

- [ ] 8. Frontend - VehicleInquiryForm component
  - [ ] 8.1 Create VehicleInquiryForm component
    - Create frontend/src/components/VehicleInquiryForm.jsx
    - Add form fields for customerName, customerEmail, customerPhone, message
    - Display vehicle make, model, year prominently
    - Implement client-side validation for required fields and email format
    - Pre-populate name and email for authenticated users
    - Show loading state during submission
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ] 8.2 Implement form submission and feedback
    - Implement handleSubmit() to POST to /api/leads
    - Display success message after successful submission
    - Show link to Messages page for authenticated users
    - Display error messages for validation failures or server errors
    - Disable submit button during submission
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ] 8.3 Add VehicleInquiryForm styling
    - Create CSS file for VehicleInquiryForm component
    - Style form fields, buttons, error messages, and success messages
    - Ensure mobile responsiveness
    - _Requirements: 1.1, 5.1_
  
  - [ ]* 8.4 Write unit tests for VehicleInquiryForm
    - Test form rendering with vehicle info
    - Test validation error display
    - Test form submission success and error handling
    - Test pre-population for authenticated users
    - _Requirements: 1.1, 1.4, 2.1, 5.1_

- [ ] 9. Frontend - PhotoUploadComponent
  - [ ] 9.1 Create PhotoUploadComponent
    - Create frontend/src/components/PhotoUploadComponent.jsx
    - Implement drag-and-drop zone for file selection
    - Add file input button for traditional file selection
    - Add camera capture button for mobile devices
    - Display preview thumbnails for selected files
    - Show remove button for each preview
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 18.2, 18.3_
  
  - [ ] 9.2 Implement file validation and upload
    - Implement client-side validation for file type, size, and count
    - Display validation errors for rejected files
    - Implement uploadPhotos() to POST files to /api/vehicles/:vehicleId/photos
    - Show progress bar for each uploading file
    - Display success indicator when upload completes
    - Display error message with retry option for failed uploads
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 9.3 Add mobile-specific features
    - Detect mobile devices and show camera capture option
    - Optimize UI for touch interfaces
    - Adjust layout for smaller screens
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_
  
  - [ ] 9.4 Add PhotoUploadComponent styling
    - Create CSS file for PhotoUploadComponent
    - Style drag-and-drop zone, preview grid, progress bars
    - Ensure mobile responsiveness
    - _Requirements: 7.1, 18.1_
  
  - [ ]* 9.5 Write unit tests for PhotoUploadComponent
    - Test file selection and preview display
    - Test drag-and-drop functionality
    - Test validation error display
    - Test upload progress and completion
    - _Requirements: 7.2, 7.4, 8.1, 10.1_

- [ ] 10. Frontend - PhotoGallery component
  - [ ] 10.1 Create PhotoGallery component
    - Create frontend/src/components/PhotoGallery.jsx
    - Display grid of photo thumbnails ordered by displayOrder
    - Show primary photo indicator badge
    - Implement click handler to open full-size modal view
    - Add placeholder image for vehicles with no photos
    - _Requirements: 11.1, 12.1, 12.2, 12.3, 12.6_
  
  - [ ] 10.2 Implement full-size modal view
    - Create modal overlay to display full-size images
    - Add previous/next navigation buttons
    - Implement keyboard navigation (arrow keys, escape)
    - Display photo counter (e.g., "3 / 10")
    - Close modal on outside click or escape key
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  
  - [ ] 10.3 Add management features for dealers
    - Show drag handles when editable prop is true
    - Implement drag-and-drop reordering with visual feedback
    - Add delete button with confirmation dialog
    - Add "Set as Primary" button
    - Call onReorder, onDelete, onSetPrimary callbacks
    - _Requirements: 11.2, 11.3, 11.4, 11.5_
  
  - [ ] 10.4 Implement lazy loading and performance optimizations
    - Use Intersection Observer to lazy load images as they enter viewport
    - Display loading placeholder while images are fetching
    - Show error placeholder with retry option for failed loads
    - Load thumbnail versions in gallery view
    - _Requirements: 14.2, 14.3, 14.5_
  
  - [ ] 10.5 Add PhotoGallery styling
    - Create CSS file for PhotoGallery component
    - Style thumbnail grid, modal overlay, navigation controls
    - Add drag-and-drop visual feedback
    - Ensure mobile responsiveness
    - _Requirements: 12.1, 13.1_
  
  - [ ]* 10.6 Write unit tests for PhotoGallery
    - Test photo display and ordering
    - Test modal open/close and navigation
    - Test drag-and-drop reordering
    - Test delete confirmation
    - Test primary photo setting
    - _Requirements: 11.1, 11.2, 11.3, 11.5, 13.1_

- [ ] 11. Frontend - LeadsDashboard component
  - [ ] 11.1 Create LeadsDashboard component
    - Create frontend/src/components/LeadsDashboard.jsx
    - Fetch leads from GET /api/leads with pagination
    - Display leads in table/list format with customer info, vehicle details, message, status, and date
    - Show status badges with color coding
    - Implement pagination controls
    - _Requirements: 15.1, 15.2, 15.3, 15.5_
  
  - [ ] 11.2 Implement filtering and sorting
    - Add filter controls for status, vehicle, and date range
    - Update leads query when filters change
    - Maintain filter state in component
    - _Requirements: 15.4_
  
  - [ ] 11.3 Add lead actions
    - Add "View Conversation" button that navigates to /messages/:conversationId
    - Add status update dropdown for each lead
    - Implement handleStatusUpdate() to PATCH /api/leads/:id/status
    - _Requirements: 15.6_
  
  - [ ] 11.4 Add analytics summary cards
    - Fetch analytics from GET /api/leads/analytics
    - Display summary cards for total leads, new leads, conversion rate
    - Show leads by vehicle chart/list
    - Display leads trend graph
    - _Requirements: 19.1, 19.2, 19.3, 19.4_
  
  - [ ] 11.5 Add CSV export functionality
    - Add "Export to CSV" button
    - Call GET /api/leads/export with current filters
    - Trigger browser download of CSV file
    - _Requirements: 19.5_
  
  - [ ] 11.6 Add LeadsDashboard styling
    - Create CSS file for LeadsDashboard component
    - Style table, filters, status badges, analytics cards
    - Ensure mobile responsiveness
    - _Requirements: 15.1_
  
  - [ ]* 11.7 Write unit tests for LeadsDashboard
    - Test leads display and pagination
    - Test filtering functionality
    - Test status update
    - Test navigation to conversation
    - _Requirements: 15.2, 15.4, 15.6_

- [ ] 12. Integration with existing pages
  - [ ] 12.1 Add VehicleInquiryForm to vehicle detail page
    - Import VehicleInquiryForm into vehicle detail page component
    - Pass vehicleId and vehicleInfo props
    - Position form prominently on the page (sidebar or below details)
    - Handle onSuccess callback to show confirmation
    - _Requirements: 1.1_
  
  - [ ] 12.2 Add PhotoUploadComponent to vehicle form/edit page
    - Import PhotoUploadComponent into dealer vehicle form page
    - Show component when creating or editing vehicles
    - Pass vehicleId and existingPhotos props
    - Handle onUploadComplete callback to refresh photo list
    - _Requirements: 7.1_
  
  - [ ] 12.3 Add PhotoGallery to vehicle detail page
    - Import PhotoGallery into vehicle detail page component
    - Fetch photos from GET /api/vehicles/:vehicleId/photos
    - Pass photos array to PhotoGallery
    - Enable editable mode for vehicle owner
    - Implement onReorder, onDelete, onSetPrimary callbacks
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ] 12.4 Update vehicle listing cards to show primary photo
    - Modify vehicle card component to display primary photo thumbnail
    - Fetch primary photo from vehicle.photos array or use getPrimaryPhoto()
    - Show placeholder if no photos exist
    - _Requirements: 12.1, 12.6_
  
  - [ ] 12.5 Add LeadsDashboard to dealer dashboard
    - Create new route /dealer/leads for LeadsDashboard
    - Add navigation link in dealer menu
    - Restrict access to dealer role
    - _Requirements: 15.1_
  
  - [ ]* 12.6 Write integration tests for complete flows
    - Test complete inquiry submission flow from vehicle page to conversation creation
    - Test complete photo upload flow from vehicle form to gallery display
    - Test lead notification delivery to dealer
    - _Requirements: 1.1, 3.1, 4.1, 6.1, 7.1, 9.1_

- [ ] 13. Checkpoint - Frontend integration testing
  - Ensure all frontend tests pass
  - Test inquiry form on vehicle detail pages
  - Test photo upload on vehicle form pages
  - Test photo gallery display and management
  - Test leads dashboard with filtering and analytics
  - Ask the user if questions arise

- [ ] 14. Environment configuration and deployment setup
  - [ ] 14.1 Update environment variables
    - Add UPLOAD_DIR to .env and .env.example
    - Add MAX_FILE_SIZE to .env and .env.example
    - Add SMTP configuration variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM)
    - Add FRONTEND_URL to .env and .env.example
    - Add REDIS_URL to .env and .env.example
    - _Requirements: All_
  
  - [ ] 14.2 Create uploads directory structure
    - Create uploads/vehicles directory with appropriate permissions
    - Add .gitkeep file to preserve directory structure
    - Add uploads/ to .gitignore to exclude uploaded files from version control
    - _Requirements: 9.5_
  
  - [ ] 14.3 Update API documentation
    - Add lead management endpoints to backend/API_DOCUMENTATION.md
    - Add photo management endpoints to backend/API_DOCUMENTATION.md
    - Document request/response formats, authentication requirements, and error codes
    - _Requirements: All_
  
  - [ ] 14.4 Add database migration script
    - Create script to run new migrations for Lead and VehiclePhoto tables
    - Update setup-dev-db.js to include new tables
    - Test migration on clean database
    - _Requirements: 3.1, 9.5_

- [ ] 15. Final checkpoint and verification
  - Run all unit tests and property-based tests
  - Verify all 40 correctness properties pass
  - Test complete user flows end-to-end
  - Verify rate limiting works correctly
  - Test email and real-time notifications
  - Verify image optimization and storage
  - Check mobile responsiveness
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- Property tests validate universal correctness properties across randomized inputs
- Unit tests validate specific examples, edge cases, and integration points
- All 40 correctness properties from the design document are covered in property test tasks
- The implementation uses JavaScript/Node.js for backend and React/JSX for frontend as specified in the design
