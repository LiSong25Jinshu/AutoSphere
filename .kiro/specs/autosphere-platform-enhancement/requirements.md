# AutoSphere Platform Enhancement — Requirements

## Introduction

AutoSphere is a full-stack automotive platform serving users, dealers, service providers, and administrators. The system enables vehicle marketplace browsing, service booking, AI-powered car recommendations, real-time messaging, and administrative monitoring. This document captures the requirements for a comprehensive set of enhancements and fixes across the platform.

---

## Glossary

| Term | Definition |
|------|-----------|
| Service Provider | A registered business offering automotive services (car wash, maintenance, repair, etc.) |
| Dealer | A registered business listing vehicles for sale or rent |
| GH₵ | Ghana Cedis — the platform's primary currency |
| OTP | One-Time Password used for email verification |
| RBAC | Role-Based Access Control — restricts features by user role (user, dealer, service_provider, admin) |
| PhoneLink | A tap-to-call React component that renders phone numbers as `tel:` links |
| Booking / Appointment | A customer's scheduled service session with a service provider |
| Prototype | The legacy `autosphere-prototype` directory containing early CSS/JS assets to be absorbed into the main frontend |

---

## Requirement 1: Merge Prototype Assets into Main Frontend

### User Story
As a developer, I want the styles and component logic from the `autosphere-prototype` directory to be reconciled with the main frontend so that there is a single, unified codebase with no duplicated or orphaned assets.

### Acceptance Criteria

1. WHEN the developer reviews `autosphere-prototype/src/pages/AICarFinder.js`, THEN any unique logic or UI patterns not present in the main `frontend/src/pages/AICarFinder.jsx` SHALL be merged into the main file.
2. WHEN the developer reviews `autosphere-prototype/src/pages/user/BookService.css`, THEN any unique styles not present in `frontend/src/pages/user/BookService.css` SHALL be merged.
3. WHEN the developer reviews `autosphere-prototype/src/pages/user/Dashboard.css`, THEN any unique styles not present in `frontend/src/pages/user/Dashboard.css` SHALL be merged.
4. WHEN the developer reviews `autosphere-prototype/src/pages/styles/LandingPage.css`, THEN any unique styles not present in `frontend/src/pages/public/LandingPage.css` SHALL be merged.
5. AFTER merging, the `autosphere-prototype` directory SHALL be removable (all relevant content absorbed), with no broken imports or missing references in the main frontend.
6. The merged frontend SHALL build without errors (`npm run build`).

---

## Requirement 2: Fix Service Category Display (Car Wash and All Categories)

### User Story
As a user or service provider, I want service category names to display in a clean, human-readable format everywhere in the platform so that there is no confusion from raw underscore-separated values or stray hyphens.

### Acceptance Criteria

1. WHEN a service with category `car_wash` is displayed anywhere in the UI (service cards, appointment cards, booking forms, admin views), THEN it SHALL display as "Car Wash" with no underscores or hyphens.
2. WHEN any category value (`oil_change`, `brake_service`, `general_maintenance`, etc.) is rendered, THEN underscores SHALL be replaced with spaces and each word SHALL be title-cased.
3. WHEN the service provider views the Manage Services page, THEN the category filter buttons SHALL display human-readable labels (e.g., "Car Wash" not "car_wash").
4. WHEN the service provider adds or edits a service, THEN the category dropdown SHALL show human-readable labels.
5. WHEN the appointment list or detail view renders a service type, THEN the label SHALL be the human-readable version with no hyphens or underscores visible to the user.
6. IF a "View Details" button or any UI element erroneously renders a hyphen character as part of its text, THEN that hyphen SHALL be removed so the button text reads cleanly (e.g., "View Details" not "-View Details").

---

## Requirement 3: Appointment Details — Full Information Display

### User Story
As a user, I want to view the complete details of an appointment — including provider contact information, notes, and status — in a well-structured and accessible UI so that I have all the information I need about my booking.

### Acceptance Criteria

1. WHEN a user opens the appointment detail view (modal or page), THEN the following fields SHALL be displayed: confirmation number, service type (human-readable), provider full name, scheduled date, scheduled time, appointment status, estimated/actual cost, location/address, customer notes, provider notes.
2. WHEN the service provider has a phone number on record, THEN it SHALL be displayed in the appointment detail view using the `PhoneLink` component with tap-to-call functionality.
3. WHEN the service provider has an email address on record, THEN it SHALL be displayed as a `mailto:` link in the appointment detail view.
4. WHEN provider notes exist, THEN they SHALL be displayed in a clearly labelled "Provider Notes" section.
5. WHEN the appointment status is `completed` and no review has been submitted, THEN a "Leave Review" button SHALL be visible in the details view.
6. WHEN the appointment status is `completed` and a review exists, THEN the star rating and review text SHALL be displayed, with an "Edit Review" option.
7. WHEN the appointment status is `pending` or `confirmed`, THEN "Reschedule" and "Cancel" action buttons SHALL be visible in the details view.
8. WHEN the detail view is opened on a mobile device, THEN all content SHALL be readable without horizontal scrolling, and action buttons SHALL be easily tappable (minimum 44px touch target).
9. WHEN the `AppointmentDetails.jsx` page (route-based) is loaded, THEN it SHALL display the same rich information as the inline modal, including provider contact details.
10. WHERE `alert()` and `prompt()` native dialogs are used in `AppointmentDetails.jsx` for cancellation reason, review rating, and confirmations, THEN they SHALL be replaced with in-page modal dialogs or inline form components for a consistent UX.

---

## Requirement 4: Responsive Design for Desktop and Mobile

### User Story
As any user of the platform, I want every page to be fully usable on modern desktop browsers and mobile devices so that I can access all features regardless of my screen size.

### Acceptance Criteria

1. WHEN the viewport width is 768px or below, THEN navigation menus SHALL collapse into a mobile-friendly format (e.g., hamburger menu or bottom nav).
2. WHEN any data table (e.g., admin user table) is rendered on a viewport below 768px, THEN it SHALL either scroll horizontally or reflow into a card/stacked layout.
3. WHEN modals are displayed on mobile, THEN they SHALL occupy the full viewport width with appropriate padding and SHALL not overflow the screen.
4. WHEN forms are displayed on mobile, THEN form inputs SHALL stack vertically and have a minimum height of 44px for touch accessibility.
5. WHEN a grid layout (e.g., services grid, vehicle grid) is rendered on a viewport below 600px, THEN it SHALL collapse to a single-column layout.
6. ALL interactive elements (buttons, links, inputs) SHALL have a minimum touch target size of 44×44px on mobile.
7. WHEN the service provider Services page is viewed on mobile, THEN service cards SHALL display correctly in a single-column layout.
8. WHEN the appointments list is viewed on mobile, THEN appointment cards SHALL display all key info without truncation or overflow.
9. WHEN the admin user table is viewed on tablet (768–1024px), THEN all columns SHALL remain visible with appropriate wrapping.
10. THE platform SHALL function correctly on the latest versions of Chrome, Firefox, Safari, and Edge on both desktop and mobile.

---

## Requirement 5: User Phone Number Display and Tap-to-Call

### User Story
As a user, admin, or service provider, I want to see phone numbers displayed as tappable call links throughout the platform so that I can contact people directly from any device.

### Acceptance Criteria

1. WHEN a user's profile page displays their phone number, THEN it SHALL be rendered using the `PhoneLink` component with tap-to-call functionality.
2. WHEN the admin user management table displays a user's record, THEN the user's phone number (if available) SHALL be shown as a `PhoneLink`.
3. WHEN the appointment detail view shows a service provider's contact information, THEN the provider's phone number SHALL be rendered using `PhoneLink`.
4. WHEN the user profile is in view mode (not editing), THEN the phone number field SHALL render as a `PhoneLink` alongside the plain text display.
5. WHEN a phone number is not available for a user, THEN the `PhoneLink` component SHALL not render (it already returns null for empty/undefined phone).
6. THE `PhoneLink` component SHALL strip spaces, dashes, parentheses, and dots before constructing the `tel:` href so that all common phone number formats work correctly.
7. ON desktop browsers, clicking a `PhoneLink` SHALL invoke the system's default calling application (Skype, FaceTime, etc.) via the `tel:` protocol.
8. ON mobile devices, tapping a `PhoneLink` SHALL open the device's native dialer with the number pre-filled.

---

## Requirement 6: Service Provider — Enhanced Manage Services

### User Story
As a service provider, I want a fully-featured service management page where I can add, edit, search, filter, activate/deactivate, and delete services with clear feedback so that managing my service catalogue is efficient and error-free.

### Acceptance Criteria

1. WHEN the service provider visits the Manage Services page, THEN they SHALL see a search input to filter services by name in real time (client-side filtering).
2. WHEN the service provider filters by name, THEN the service grid SHALL update immediately without a server request.
3. THE category list SHALL include at minimum: Car Wash, Maintenance, Repair, Oil Change, Tire Service, Brake Service, Engine Diagnostic, Air Conditioning, Battery Service, General Inspection, Other.
4. WHEN a service card is displayed, THEN it SHALL show: service name, category (human-readable), price (GH₵), duration (minutes), active/inactive status badge, and total booking count.
5. WHEN a service provider clicks "Add New Service", THEN a modal form SHALL open with fields for: name, description, category (dropdown with all categories), price, duration, and active toggle.
6. WHEN a service provider submits the add/edit form with invalid data (e.g., negative price, duration below 15 minutes, empty name), THEN inline validation errors SHALL be shown without closing the modal.
7. WHEN a service is successfully added or updated, THEN a toast notification SHALL confirm the action and the grid SHALL reflect the change immediately.
8. WHEN a service provider clicks "Deactivate" on an active service, THEN a confirmation SHALL be requested before the status is toggled.
9. WHEN a service provider clicks "Delete", THEN a confirmation dialog SHALL appear before the deletion is committed.
10. WHEN there are no services matching the current search or category filter, THEN a descriptive empty state message and an "Add Service" CTA SHALL be shown.
11. WHEN the page is viewed on mobile, THEN the services grid SHALL render as a single-column list and the modal SHALL be full-width.

---

## Requirement 7: Business Registration — 7-Step Onboarding Flow

### User Story
As a prospective service provider or dealer, I want to register my business through a clear, guided multi-step process so that I can complete all required information accurately and understand my progress at each stage.

### Acceptance Criteria

1. WHEN a user selects "Business Signup" or navigates to the provider/dealer registration page, THEN they SHALL be presented with a 7-step registration wizard.
2. THE seven steps SHALL be:
   - Step 1: Personal information (first name, last name, email, phone, password)
   - Step 2: Business information (business name, business type: service provider or dealer, description)
   - Step 3: Business address (street address, city, region/state, postal code)
   - Step 4: Service categories (for service providers) or vehicle inventory type (for dealers)
   - Step 5: Business hours / availability (days of week, opening and closing times)
   - Step 6: Document upload (business registration certificate, government-issued ID)
   - Step 7: Review and confirm (summary of all entered information)
3. WHEN the user is on any step, THEN a step progress indicator SHALL show the current step number, total steps, and step title.
4. WHEN the user clicks "Next" on a step with missing required fields, THEN validation errors SHALL be shown inline and navigation to the next step SHALL be blocked.
5. WHEN the user clicks "Back", THEN they SHALL return to the previous step with their previously entered data preserved.
6. WHEN the user reaches Step 7 (Review), THEN all data entered in previous steps SHALL be summarised for final confirmation.
7. WHEN the user submits the form on Step 7, THEN an account creation request SHALL be sent to the backend with all business registration data.
8. AFTER successful submission, THEN the system SHALL send a verification email with an OTP or verification link, and the user SHALL be directed to an email verification page.
9. WHEN the user verifies their email, THEN their account status SHALL become active and they SHALL be redirected to their role-appropriate dashboard.
10. WHEN the registration form is viewed on mobile, THEN all steps SHALL be fully usable with touch-friendly inputs and the step indicator SHALL be visible without scrolling.

---

## Requirement 8: Admin — User Account Activate/Deactivate

### User Story
As an admin, I want to activate or deactivate any user account from the admin user management page so that I can control platform access and respond to policy violations or support requests.

### Acceptance Criteria

1. WHEN the admin views the user management table, THEN each user row SHALL display a clear Active or Inactive status badge.
2. WHEN the admin clicks "Deactivate" for an active user, THEN a confirmation dialog SHALL appear asking the admin to confirm the action before proceeding.
3. WHEN the admin clicks "Activate" for an inactive user, THEN the status SHALL be updated immediately without requiring a confirmation dialog.
4. WHEN the status toggle request succeeds, THEN the user's status badge in the table SHALL update immediately without a full page reload.
5. WHEN the status toggle request fails, THEN a descriptive error message SHALL be displayed and the badge SHALL revert to its previous state.
6. THE admin SHALL be able to filter users by status (All, Active, Inactive) in addition to the existing role filter.
7. WHEN an admin deactivates a user account, THEN the deactivated user's subsequent API requests SHALL receive an authentication error (401 or 403) until reactivated.
8. WHEN the admin searches for a user by name or email, THEN the results SHALL include the user's current active/inactive status.
9. THE admin user management page SHALL display the user's phone number (using `PhoneLink`) alongside their email address.
10. WHEN the admin changes a user's role using the role dropdown, THEN a confirmation dialog SHALL appear before the change is committed.

---

## Requirement 9: Real-Time Messaging and Notifications

### User Story
As a user or service provider, I want to send and receive messages in real time and receive instant notifications about booking updates, new messages, and system events so that communication is immediate and I never miss an important update.

### Acceptance Criteria

1. WHEN a user sends a message in a conversation, THEN the recipient SHALL receive the message in real time via Socket.io without needing to refresh the page.
2. WHEN a new message arrives, THEN the `NotificationBell` component SHALL update its unread count badge immediately.
3. WHEN a service provider updates a booking status (e.g., confirms, marks in-progress, completes), THEN the customer SHALL receive a real-time notification.
4. WHEN a user has unread notifications, THEN the notification bell SHALL display a numeric badge showing the unread count.
5. WHEN the user opens the notification panel, THEN all recent notifications SHALL be listed with timestamp, type icon, and message text.
6. WHEN the user clicks a notification, THEN they SHALL be navigated to the relevant resource (appointment, message, etc.).
7. WHEN the user is on the messages page, THEN new incoming messages SHALL appear in the conversation in real time without manual refresh.
8. WHEN a user is offline and receives a message or booking update, THEN a push notification SHALL be delivered via the browser's Push API (service worker already exists).
9. WHEN the user grants push notification permission, THEN the push subscription SHALL be stored and associated with their account.
10. ALL socket connections SHALL be authenticated — unauthenticated connections SHALL be rejected.

---

## Requirement 10: Core System Integrity

### User Story
As any user of AutoSphere, I want all core platform features to work reliably so that I can register, authenticate, book services, search vehicles, and manage my account without errors.

### Acceptance Criteria

1. WHEN a new user registers, THEN they SHALL receive an OTP or verification email, and SHALL not be able to log in until their email is verified.
2. WHEN an authenticated user makes an API request, THEN the JWT token SHALL be validated server-side and role-based permissions SHALL be enforced.
3. WHEN a user attempts to access a route reserved for another role (e.g., a regular user accessing `/service-provider/*`), THEN they SHALL be redirected to their appropriate dashboard.
4. WHEN a vehicle is listed by a dealer, THEN it SHALL be searchable and filterable by make, model, year, price range, and category.
5. WHEN a user requests AI vehicle recommendations, THEN the AI service SHALL return ranked suggestions based on user preferences and interaction history.
6. WHEN a user books a service, THEN the booking SHALL be recorded with status `pending`, and the service provider SHALL receive a real-time notification.
7. WHEN a service provider updates a booking status, THEN the change SHALL be persisted and the customer SHALL be notified.
8. THE admin dashboard SHALL display platform-wide statistics: total users, active bookings, total vehicles listed, and recent activity.
9. ALL passwords SHALL be hashed (bcrypt) before storage and SHALL never be returned in API responses.
10. ALL API endpoints that modify data SHALL require a valid JWT and SHALL validate the request body before processing.
