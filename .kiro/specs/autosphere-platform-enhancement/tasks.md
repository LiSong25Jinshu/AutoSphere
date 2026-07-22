# Implementation Plan: AutoSphere Platform Enhancement

## Overview

This plan converts all ten requirements and eighteen correctness properties into incremental coding tasks. Tasks are ordered so each step builds on the previous, starting with shared utilities and data foundations, then feature areas, and finishing with integration wiring. Property-based tests use Vitest + fast-check (minimum 100 iterations each). Tasks marked `*` are optional and can be skipped for a faster MVP.

---

## Tasks

- [ ] 1. Set up shared utilities, test infrastructure, and run migrations
  - Install `fast-check` as a dev dependency in the frontend: `npm install -D fast-check`
  - Create `frontend/src/utils/categoryUtils.js` with `formatCategoryLabel()` as specified in the design
  - Create a Sequelize migration `20250602-add-category-bookingCount-to-service-offerings.js` adding `category` ENUM and `bookingCount` INTEGER to `ServiceOffering`
  - Run the migration in the dev environment
  - _Requirements: 2.1, 2.2, 6.3, 6.4_

  - [ ]* 1.1 Write property test for `formatCategoryLabel`
    - **Property 1: `formatCategoryLabel` produces clean human-readable output**
    - For any snake_case string, assert: every word is title-cased, no underscores remain, no leading/trailing whitespace, no leading/trailing hyphen
    - **Validates: Requirements 2.1, 2.2, 2.5, 2.6**


- [ ] 2. Merge prototype assets into main frontend (Requirement 1)
  - [x] 2.1 Diff and merge `autosphere-prototype/src/pages/AICarFinder.js` into `frontend/src/pages/AICarFinder.jsx`
    - Keep the main file's AI/API integration as the authoritative implementation
    - Extract any unique CSS class patterns (filter layout, `.car-card` grid) and apply to `frontend/src/pages/AICarFinder.css` if not already present
    - Discard the prototype's static `carData` array and `handleSearch` function — superseded by live API
    - _Requirements: 1.1_

  - [ ] 2.2 Merge prototype CSS files additively into main frontend
    - `autosphere-prototype/src/pages/styles/LandingPage.css` → `frontend/src/pages/public/LandingPage.css`: add hero flex layout, `.feature-card` box-shadows, `.btn-tertiary` orange style, `@media (max-width: 900px)` rules
    - `autosphere-prototype/src/pages/user/BookService.css` → `frontend/src/pages/user/BookService.css`: add glass card form styles if not present
    - `autosphere-prototype/src/pages/user/Dashboard.css` → `frontend/src/pages/user/Dashboard.css`: add `.dash-card` grid layout if not present
    - _Requirements: 1.2, 1.3, 1.4_

  - [~] 2.3 Verify build passes and remove prototype directory
    - Confirm no broken imports or missing references after merge
    - Run `npm run build` in the `frontend` directory and verify zero errors
    - After build passes, delete the `autosphere-prototype` directory
    - _Requirements: 1.5, 1.6_


- [ ] 3. Implement `formatCategoryLabel` across all UI display sites (Requirement 2)
  - [~] 3.1 Apply `formatCategoryLabel` to `Services.jsx` (service provider Manage Services page)
    - Replace raw `service.category` renders with `formatCategoryLabel(service.category)` in service cards
    - Update the category filter button labels to use `formatCategoryLabel`
    - Update the Add/Edit service modal category dropdown to use human-readable labels from the extended `CATEGORIES` constant (11 categories with icon, value, label)
    - Remove any stray hyphen characters from "View Details" buttons or similar UI text
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [~] 3.2 Apply `formatCategoryLabel` to appointment and booking views
    - Update `Appointments.jsx` inline modal to render `serviceType` via `formatCategoryLabel`
    - Update `AppointmentDetails.jsx` standalone page to render `serviceType` via `formatCategoryLabel`
    - Update `BookService.jsx` booking form to show human-readable category labels
    - Update any admin views that display service type or category
    - _Requirements: 2.1, 2.2, 2.5_

  - [ ]* 3.3 Write unit tests for `formatCategoryLabel` edge cases
    - Test known inputs against expected outputs for all 11 category keys
    - Test edge cases: empty string returns `''`, single word, already-title-cased string
    - _Requirements: 2.1, 2.2_


- [ ] 4. Refactor `AppointmentDetails.jsx` to full information display (Requirement 3)
  - [~] 4.1 Replace native dialogs with controlled modal components
    - Remove all `window.alert()`, `window.confirm()`, and `window.prompt()` calls from `AppointmentDetails.jsx`
    - Implement `CancelModal`, `ReviewModal`, and `RescheduleModal` components (reuse pattern from `Appointments.jsx`)
    - Wire each modal to the appropriate action handler (`handleCancel`, `handleReview`, `handleReschedule`)
    - _Requirements: 3.10_

  - [~] 4.2 Add full detail fields to `AppointmentDetails.jsx`
    - Add `fetchAppointmentDetails()` → `GET /api/appointments/:id` if not already fetching all required fields
    - Render: confirmation number, service type (via `formatCategoryLabel`), provider full name, scheduled date/time, appointment status, estimated/actual cost, location/address, customer notes, provider notes
    - Render provider phone using `<PhoneLink phone={providerPhone} />`
    - Render provider email as a `mailto:` link
    - Display "Provider Notes" section only when provider notes exist
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.9_

  - [~] 4.3 Add conditional action buttons and review section
    - Show "Leave Review" button when `status === 'completed'` and no review submitted
    - Show star rating, review text, and "Edit Review" option when `status === 'completed'` and review exists
    - Show "Reschedule" and "Cancel" buttons when `status === 'pending'` or `status === 'confirmed'`
    - Ensure all buttons meet 44px minimum touch target requirement
    - _Requirements: 3.5, 3.6, 3.7, 3.8_

  - [ ]* 4.4 Write unit tests for `AppointmentDetails` render behavior
    - Assert `<PhoneLink>` renders for a provider with a phone number
    - Assert `mailto:` link renders for a provider with an email
    - Assert no `window.alert` or `window.prompt` calls exist in the component file
    - Assert "Leave Review" button visibility depends on status and review state
    - _Requirements: 3.1, 3.2, 3.3, 3.10_


- [ ] 5. Apply global responsive design rules (Requirement 4)
  - [x] 5.1 Add global responsive CSS rules to `frontend/src/index.css`
    - Add touch target rule: `button, a, input, select, textarea { min-height: 44px; }`
    - Add mobile modal rules: `.modal-overlay { align-items: flex-end; }` and full-width at ≤600px
    - Add grid collapse rules: `.services-grid, .vehicle-grid, .apt-list { grid-template-columns: 1fr; }` at ≤600px
    - Add admin table horizontal scroll: `.admin-table-wrap { overflow-x: auto; }` at ≤768px
    - Add form stack rule: `.form-row, .ps-grid-2 { grid-template-columns: 1fr; }` at ≤600px
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [-] 5.2 Apply component-specific responsive rules
    - `Appointments.css`: `apt-filters` horizontal scroll at ≤600px; `apt-card-top` stacks vertically at ≤600px
    - `Services.css`: `category-filter` wraps at ≤600px; modal becomes full-width with top border-radius at ≤600px
    - `ProviderSignup.css`: `ps-grid-2` collapses to single column; step labels hidden below 480px (show step number only)
    - `Admin.css`: table scroll indicator on mobile; filter buttons wrap and scroll
    - _Requirements: 4.7, 4.8, 4.9, 4.10_


- [ ] 6. Add `PhoneLink` to all required UI surfaces (Requirement 5)
  - [~] 6.1 Wire `PhoneLink` into `Profile.jsx`, `Admin/Users.jsx`, and `AppointmentDetails.jsx`
    - `frontend/src/pages/user/Profile.jsx`: in view mode, wrap the phone field with `<PhoneLink phone={user.phone} />`
    - `frontend/src/pages/admin/Users.jsx`: add a "Phone" column to the user table rendering `<PhoneLink phone={u.phone} size="sm" />`
    - `frontend/src/pages/user/AppointmentDetails.jsx`: confirm `<PhoneLink phone={providerPhone} />` is present (added in task 4.2)
    - Confirm `PhoneLink` returns `null` when phone is falsy — no render for missing numbers
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 6.2 Write property test for `PhoneLink` href construction
    - **Property 2: `PhoneLink` always constructs a valid `tel:` href**
    - For any non-empty phone string with digits, spaces, dashes, parentheses, dots, and optional leading `+`, assert the rendered `href` starts with `"tel:"` and contains no spaces, dashes, parentheses, or dots
    - **Validates: Requirements 3.2, 5.1, 5.3, 5.6**

  - [ ]* 6.3 Write unit tests for `PhoneLink` component
    - Assert returns `null` for empty string, `null`, and `undefined` phone props
    - Assert `tel:` href strips all formatting characters for common phone formats
    - Assert `e.stopPropagation()` is called on click
    - _Requirements: 5.5, 5.6, 5.7, 5.8_


- [ ] 7. Enhanced Manage Services page for service providers (Requirement 6)
  - [~] 7.1 Extend the `CATEGORIES` constant and add search state to `Services.jsx`
    - Replace the existing 4-item array with the full 11-category `CATEGORIES` constant (value, label, icon) as defined in the design
    - Add `searchQuery` state; compute `filtered` as a combination of category filter and case-insensitive name substring match
    - Render the search input above the services grid, updating results on every keystroke (no server request)
    - Show descriptive empty state message and "Add Service" CTA when `filtered` is empty
    - _Requirements: 6.1, 6.2, 6.3, 6.10_

  - [~] 7.2 Update service card to show all required fields
    - Service card must display: service name, `formatCategoryLabel(category)`, price with GH₵ symbol, duration in minutes, active/inactive status badge, and total booking count
    - _Requirements: 6.4_

  - [~] 7.3 Add inline validation to the Add/Edit service modal
    - Validate on submit: `name` is non-empty after trim; `price >= 0`; `duration >= 15`; `category` is one of the 11 valid values
    - Show per-field inline error messages without closing the modal
    - On success, show a toast notification and update the grid immediately
    - _Requirements: 6.5, 6.6, 6.7_

  - [~] 7.4 Add confirmation guards for deactivate and delete actions
    - Wrap `toggleActive` to show a confirmation dialog only when deactivating (i.e., `service.isActive === true`); proceed immediately when activating
    - Wrap `deleteService` to show a confirmation dialog before committing the deletion
    - _Requirements: 6.8, 6.9_

  - [ ]* 7.5 Write property test for service name search filter
    - **Property 3: Service name search filter is exhaustive and correct**
    - For any array of service objects and any query string, assert the filtered result contains exactly those services whose `name` includes the query as a case-insensitive substring, and no others
    - **Validates: Requirements 6.1, 6.2**

  - [ ]* 7.6 Write property test for service form validation
    - **Property 4: Service form validation catches all invalid inputs**
    - For any form state where name is empty/whitespace, price is negative, or duration < 15, assert `validate()` returns `false` and `errors` has a non-empty entry for every invalid field
    - **Validates: Requirements 6.6**

  - [ ]* 7.7 Write property test for service card data rendering
    - **Property 5: Service card renders all required data fields**
    - For any valid service object with `name`, `category`, `price`, `duration`, `isActive`, `bookingCount`, assert the rendered card displays all six data points with correct formatting (GH₵ symbol, `formatCategoryLabel`, status badge)
    - **Validates: Requirements 6.4, 2.1**


- [~] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement 7-step business registration wizard (Requirement 7)
  - [~] 9.1 Refactor `ProviderSignup.jsx` state shape and step structure
    - Replace existing step logic with the 8-slice state shape: `wizardStep`, `role`, `personal`, `business`, `address`, `categories`, `hours`, `documents`
    - Implement the 7 steps (index 0–6) as defined in the design: Role Selection, Personal Info, Business Info, Business Address, Service Categories/Inventory, Business Hours, Document Upload, plus Review at index 7 (Submit)
    - Implement `goNext()` with per-step validation guard and `goBack()` with no-validation data preservation
    - _Requirements: 7.1, 7.2, 7.4, 7.5_

  - [~] 9.2 Implement per-step validation functions
    - Step 1: all fields required; email format; phone ≥10 digits; password ≥8 chars, ≥1 uppercase, ≥1 digit
    - Step 2: `businessName` and `businessType` required
    - Step 3: `streetAddress`, `city`, `region` required
    - Step 4: at least one category/inventory type selected
    - Step 5: at least one day enabled; `openTime < closeTime` for each enabled day
    - Step 6: `businessRegDoc` and `govIdDoc` required
    - Show per-field inline errors on "Next" click without advancing step
    - _Requirements: 7.4_

  - [~] 9.3 Implement the step progress indicator component
    - Show current step number, total steps (7), and step title
    - Highlight current step as active; mark previous steps with a checkmark; mark future steps as upcoming
    - Hide step labels below 480px (show step number only) per responsive design rules
    - _Requirements: 7.3, 7.10_

  - [~] 9.4 Implement the Review step (step 6/index 6) and form submission
    - Render all collected data from all previous steps read-only for final confirmation
    - "Submit" button calls `handleSubmit()` → `POST /api/auth/register-provider` (multipart/form-data with all wizard fields)
    - After successful submission, redirect user to email verification page
    - _Requirements: 7.6, 7.7, 7.8_

  - [~] 9.5 Handle email verification and post-verification redirect
    - After OTP verification via `POST /api/auth/verify-email`, set `emailVerified = true` and redirect user to their role-appropriate dashboard
    - _Requirements: 7.8, 7.9_

  - [ ]* 9.6 Write property test for wizard step progress indicator
    - **Property 6: Wizard step progress indicator reflects current step**
    - For any step index `n` in 0–6, assert: step `n` is active, steps 0..n-1 show checkmark (complete), steps n+1..6 are upcoming
    - **Validates: Requirements 7.3**

  - [ ]* 9.7 Write property test for wizard validation blocking advancement
    - **Property 7: Wizard validation blocks advancement on any missing required field**
    - For any step and any form state with at least one required field empty/invalid, assert `validate(step)` returns `false`, `errors` has at least one entry, and `wizardStep` does not increment
    - **Validates: Requirements 7.4**

  - [ ]* 9.8 Write property test for wizard Back preserving data
    - **Property 8: Wizard Back preserves all entered data**
    - For any sequence of valid step completions followed by Back navigations, assert each step's state slice equals its value before the Back call
    - **Validates: Requirements 7.5**

  - [ ]* 9.9 Write property test for wizard Review step rendering all entered data
    - **Property 9: Wizard Review step renders all non-empty entered data**
    - For any wizard state where steps 0–5 contain at least one non-empty value, assert the Review step renders every non-empty field value from all previous steps
    - **Validates: Requirements 7.6**


- [ ] 10. Admin user management enhancements (Requirement 8)
  - [~] 10.1 Add status filter and PhoneLink column to AdminUsers page
    - Add `statusFilter` state (`'all'` | `'active'` | `'inactive'`) to `frontend/src/pages/admin/Users.jsx`
    - Pass `isActive` query param to `GET /api/users` when status filter is not `'all'`
    - Add "Phone" column to the admin user table rendering `<PhoneLink phone={u.phone} size="sm" />`
    - Add status filter buttons row below the role filter row
    - _Requirements: 8.1, 8.6, 8.8, 8.9_

  - [~] 10.2 Add confirmation dialog for deactivate and role-change actions
    - Replace `window.confirm` in `toggleStatus` with an inline `ConfirmModal` component — confirmation only required when deactivating (isActive → false); activation proceeds immediately
    - Replace `window.confirm` in `changeRole` with the same `ConfirmModal`
    - Show descriptive error banner (not `alert()`) on API failure; revert optimistic state update
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.10_

  - [x] 10.3 Ensure backend enforces deactivated-user rejection
    - Verify `backend/src/middleware/auth.js` checks `user.isActive` after JWT decode; returns 403 `{ message: 'Account deactivated' }` for inactive users
    - Verify `PATCH /api/users/:id/status` endpoint exists and is admin-only
    - _Requirements: 8.7_


- [ ] 11. Real-time messaging and notifications (Requirement 9)
  - [~] 11.1 Verify and harden Socket.io authentication middleware
    - Confirm `backend/src/sockets/` auth middleware reads `socket.handshake.auth.token`, verifies JWT, and rejects unauthenticated connections with `new Error('Authentication token required')`
    - Confirm `io.use(authMiddleware)` is applied before any event handlers
    - _Requirements: 9.10_

  - [~] 11.2 Ensure real-time message delivery and NotificationBell update
    - Confirm `useSocket` hook in `frontend/src/hooks/useSocket.js` connects with `auth: { token }` from `AuthContext`
    - Confirm `NotificationContext` registers `notification:new` socket listener and calls `addNotification(n)` to update `unreadCount`
    - Confirm `NotificationBell` re-renders when `unreadCount` changes
    - _Requirements: 9.1, 9.2, 9.4_

  - [~] 11.3 Wire booking status change notifications to customers
    - Confirm that when a service provider updates booking status via `PATCH /api/appointments/:id/status`, the server calls `createNotification` for the customer and emits `booking:updated` via socket
    - Confirm customer receives real-time notification and `NotificationBell` badge updates
    - _Requirements: 9.3_

  - [~] 11.4 Verify notification panel and click-through navigation
    - Confirm notification panel lists recent notifications with timestamp, type icon, and message text
    - Confirm clicking a notification navigates to `notification.url` or the relevant resource (appointment, message)
    - Ensure `PATCH /api/notifications/:id/read` is called on click
    - _Requirements: 9.5, 9.6_

  - [~] 11.5 Verify push notification subscription and delivery
    - Confirm `usePushNotifications` hook calls `POST /api/push/subscribe` after user grants permission
    - Confirm `PushSubscription` row is persisted in the database
    - Confirm backend sends web push via `webpush.sendNotification()` when a notification is created for an offline user
    - _Requirements: 9.7, 9.8, 9.9_

  - [~] 11.6 Verify real-time message display on messages page
    - Confirm that while the user is on the messages page, new `message:new` events append to the current conversation without a page refresh
    - _Requirements: 9.7_


- [ ] 12. Core system integrity verification and fixes (Requirement 10)
  - [~] 12.1 Verify OTP email verification blocks login until verified
    - Confirm `POST /api/auth/login` returns 403 with `{ message: 'Please verify your email' }` when `emailVerified === false`
    - Confirm `POST /api/auth/verify-email` sets `emailVerified = true` on success
    - _Requirements: 10.1_

  - [~] 12.2 Verify JWT validation and RBAC enforcement on all protected routes
    - Confirm `backend/src/middleware/auth.js` validates JWT signature and expiry on every protected route
    - Confirm role-check middleware (`requireRole`) is applied to admin, service-provider, and dealer routes
    - _Requirements: 10.2_

  - [~] 12.3 Verify frontend route protection and role-based redirects
    - Confirm `ProtectedRoute` and `RoleBasedRoute` components in the frontend redirect unauthenticated users to `/login` and wrong-role users to their correct dashboard
    - Confirm the main app router (not the stub `App.jsx`) covers all role-based routes
    - _Requirements: 10.3_

  - [~] 12.4 Verify vehicle search and filter functionality
    - Confirm `GET /api/vehicles` accepts `?make&model&year&minPrice&maxPrice&category` query params
    - Confirm the frontend vehicle search/filter UI passes these params to the API
    - _Requirements: 10.4_

  - [~] 12.5 Verify AI recommendation endpoint integration
    - Confirm `GET /api/recommendations` (or equivalent) proxies to the Python AI service at `/ai_service`
    - Confirm the frontend `AICarFinder.jsx` calls this endpoint and displays ranked results
    - _Requirements: 10.5_

  - [~] 12.6 Verify booking creation triggers provider notification
    - Confirm `POST /api/appointments` creates booking with `status: 'pending'` and emits `booking:updated` / creates notification for the service provider
    - _Requirements: 10.6_

  - [~] 12.7 Verify admin dashboard statistics endpoint
    - Confirm `GET /api/admin/stats` returns `{ totalUsers, activeBookings, totalVehicles, recentActivity }`
    - Confirm the admin dashboard renders these stats
    - _Requirements: 10.8_

  - [~] 12.8 Security audit — passwords and API validation
    - Confirm no API response includes `passwordHash` or `password` fields
    - Confirm all mutation endpoints (`POST`, `PUT`, `PATCH`) call request body validation middleware before processing
    - _Requirements: 10.9, 10.10_


- [~] 13. Final integration — wire the main App.jsx router
  - Replace the stub `frontend/src/App.jsx` (currently only has `/login` and `/admin/users`) with the full router that covers all role-based routes: public pages, user dashboard, service-provider dashboard, dealer dashboard, and admin dashboard
  - Ensure `AuthContext`, `NotificationContext`, and `ProtectedRoute`/`RoleBasedRoute` wrappers are applied correctly
  - Run `npm run build` in the `frontend` directory and confirm zero errors
  - Run `npm test` in both `frontend` and `backend` directories and confirm all tests pass
  - _Requirements: 4.1, 10.2, 10.3_


## Task Dependency Graph

```
1 (utilities + migration)
└── 2 (prototype merge)
    └── 3 (formatCategoryLabel across UI)
        ├── 4 (AppointmentDetails refactor)
        │   └── 6 (PhoneLink surfaces)
        ├── 5 (global responsive CSS)
        └── 7 (enhanced Manage Services)
            └── 8 (checkpoint — all tests pass)
                └── 9 (7-step business registration wizard)
                    └── 10 (admin user management enhancements)
                        └── 11 (real-time messaging + notifications)
                            └── 12 (core system integrity)
                                └── 13 (final integration — full router wiring)
```

## Notes

- Tasks marked `*` are optional property-based tests. They validate correctness properties but are not required for the MVP. They can be run after the corresponding feature task completes.
- All currency values use GH₵ (Ghana Cedis) via the `CURRENCY_SYMBOL` constant from `utils/currency.js`.
- The `PhoneLink` component at `frontend/src/components/PhoneLink.jsx` is already implemented — tasks 4, 6, and 10 only need to wire it into new surfaces.
- The `autosphere-prototype` directory is a legacy artifact. After task 2.3 completes and the build passes, it can be safely deleted.
- The stub `frontend/src/App.jsx` (only `/login` and `/admin/users` routes) is NOT the real application router. The full router exists elsewhere in the codebase. Task 13 resolves this by wiring up the complete router.
- Backend runs on port 5001 (from `VITE_API_URL` env var); AI service on a separate port configured in `.env`.
