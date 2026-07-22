# AutoSphere Platform Enhancement — Technical Design

## Overview

AutoSphere is a full-stack automotive platform serving four user roles: **user**, **dealer**, **service_provider**, and **admin**. This enhancement covers ten requirements spanning prototype asset absorption, UI/UX fixes, a 7-step business registration wizard, real-time messaging and push notifications, and core system integrity hardening.

### Tech Stack Summary
- **Frontend**: React 18 + Vite, React Router v6, Axios, Socket.io-client, Vitest
- **Backend**: Node.js + Express, Sequelize ORM, SQLite (dev) / PostgreSQL (prod), Socket.io
- **AI Service**: Python Flask at `/ai_service`
- **Auth**: JWT + Passport.js (Google OAuth)
- **Currency**: GH₵ (Ghana Cedis)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 18 + Vite)               │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────────────┐  │
│  │  Public     │  │  User       │  │  Service Provider      │  │
│  │  Pages      │  │  Dashboard  │  │  Dashboard             │  │
│  │  (Landing,  │  │  (Appts,    │  │  (Services, Bookings,  │  │
│  │  Login,     │  │  Messages,  │  │  Availability,         │  │
│  │  Register,  │  │  Profile,   │  │  Profile)              │  │
│  │  Provider   │  │  Vehicles)  │  │                        │  │
│  │  Signup)    │  │             │  │                        │  │
│  └─────────────┘  └─────────────┘  └────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────┐  ┌─────────────────────────────────┐  │
│  │  Admin Dashboard     │  │  Shared Components              │  │
│  │  (Users, Reports,    │  │  (PhoneLink, NotificationBell,  │  │
│  │  System Settings)    │  │   DashboardLayout, Modals)      │  │
│  └──────────────────────┘  └─────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Contexts: AuthContext, NotificationContext              │   │
│  │  Hooks: useSocket, useMessaging, usePushNotifications    │   │
│  │  Services: api.js, appointmentService, vehicleService    │   │
│  │  Utils: formatCategoryLabel, currency, axiosConfig       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                     │ HTTP/REST │ Socket.io                      │
└─────────────────────┼───────────┼──────────────────────────────-┘
                       │           │
┌──────────────────────▼───────────▼──────────────────────────────┐
│                    BACKEND (Node.js + Express)                   │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────────────┐  │
│  │  Auth Routes│  │  User/Admin │  │  Service/Booking/      │  │
│  │  (register, │  │  Routes     │  │  Appointment Routes    │  │
│  │  login,     │  │  (CRUD,     │  │  (book, update,        │  │
│  │  verify,    │  │  status,    │  │  cancel, review)       │  │
│  │  oauth)     │  │  role)      │  │                        │  │
│  └─────────────┘  └─────────────┘  └────────────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Socket.io Server — messageSocket.js                    │    │
│  │  Events: message:send, message:new, typing:start/stop,  │    │
│  │  conversation:join/leave/markRead, user:online/offline,  │    │
│  │  notification:new, booking:updated                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Middleware: auth.js (JWT), rateLimiter, validation              │
│  Models: User, Vehicle, Booking, Appointment, ServiceOffering,   │
│          Conversation, Message, Notification, PushSubscription   │
│                     │                                            │
└─────────────────────┼────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│             DATABASE (SQLite dev / PostgreSQL prod)              │
└─────────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│              AI SERVICE (Python Flask /ai_service)               │
│  Endpoints: /recommend, /predict-price                           │
│  Data: CSV datasets, recommender.py, cache.py                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Components and Interfaces

### Shared Utility: `formatCategoryLabel()`

This is the single source of truth for converting snake_case category keys to human-readable labels. It lives in `frontend/src/utils/categoryUtils.js`.

```js
/**
 * Converts a snake_case category value to a human-readable Title Case label.
 * "car_wash"  → "Car Wash"
 * "oil_change" → "Oil Change"
 * Returns the original string if input is falsy.
 */
export function formatCategoryLabel(value) {
  if (!value) return '';
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
```

**All category keys across the platform:**

| Key | Display Label |
|-----|--------------|
| `car_wash` | Car Wash |
| `maintenance` | Maintenance |
| `repair` | Repair |
| `oil_change` | Oil Change |
| `tire_service` | Tire Service |
| `brake_service` | Brake Service |
| `engine_diagnostic` | Engine Diagnostic |
| `air_conditioning` | Air Conditioning |
| `battery_service` | Battery Service |
| `inspection` | Inspection |
| `other` | Other |

Usage sites: `Services.jsx`, `Appointments.jsx`, `AppointmentDetails.jsx`, `BookService.jsx`, admin views.

---

### PhoneLink Component

Located at `frontend/src/components/PhoneLink.jsx` (already implemented). Key contract:

- Returns `null` when `phone` is falsy — no render for missing numbers
- Strips `[\s\-().]` from the phone string before building the `tel:` href
- `e.stopPropagation()` prevents parent card click handlers from firing
- Props: `phone`, `label` (override text), `showIcon` (default `true`), `className`, `size` (`sm` | `md`)

**Usage sites to add/confirm:**
- `frontend/src/pages/user/Profile.jsx` — view mode phone field
- `frontend/src/pages/admin/Users.jsx` — user table phone column
- `frontend/src/pages/user/Appointments.jsx` — detail modal provider phone (already present)
- `frontend/src/pages/user/AppointmentDetails.jsx` — standalone detail page

---

### Appointment Detail — Inline Modal vs Page

The platform has two surfaces for appointment details:

1. **Inline Modal** (`Appointments.jsx`) — already fully implemented with all required fields, `PhoneLink`, `mailto:` link, notes, review, and action buttons.
2. **Route Page** (`AppointmentDetails.jsx` at `/appointments/:id`) — currently uses `alert()`/`prompt()` for interactions and is missing provider contact fields.

**Design decision**: Refactor `AppointmentDetails.jsx` to match the inline modal's data richness. Replace all `window.alert()`, `window.confirm()`, and `window.prompt()` calls with controlled modal components (`CancelModal`, `ReviewModal`, `RescheduleModal` — reuse the pattern from `Appointments.jsx`).

**Component interaction diagram (AppointmentDetails.jsx):**

```
AppointmentDetails
  ├── fetchAppointmentDetails() → GET /api/appointments/:id
  ├── <StatusBanner status />
  ├── <DetailGrid>
  │     ├── confirmationNumber, serviceType (formatted), provider name
  │     ├── date, time, cost, priority, location
  │     ├── <PhoneLink phone={providerPhone} />
  │     └── <a href="mailto:..."> providerEmail </a>
  ├── <NotesSection notes={customerNotes} providerNotes={providerNotes} />
  ├── <ReviewSection rating={rating} review={review} />
  ├── <ActionBar status />
  │     ├── [pending|confirmed] → <RescheduleModal> + <CancelModal>
  │     └── [completed, no rating] → <ReviewModal>
  ├── <CancelModal open onConfirm onClose />
  ├── <RescheduleModal open date time onConfirm onClose />
  └── <ReviewModal open rating review onConfirm onClose />
```

---

### Service Provider — Enhanced Services Page

**Extended `CATEGORIES` constant** (replaces existing 4-item array in `Services.jsx`):

```js
export const CATEGORIES = [
  { value: 'car_wash',          label: 'Car Wash',           icon: '🚿' },
  { value: 'maintenance',       label: 'Maintenance',        icon: '🔧' },
  { value: 'repair',            label: 'Repair',             icon: '🛠️' },
  { value: 'oil_change',        label: 'Oil Change',         icon: '🛢️' },
  { value: 'tire_service',      label: 'Tire Service',       icon: '🔩' },
  { value: 'brake_service',     label: 'Brake Service',      icon: '🚨' },
  { value: 'engine_diagnostic', label: 'Engine Diagnostic',  icon: '🔬' },
  { value: 'air_conditioning',  label: 'Air Conditioning',   icon: '❄️' },
  { value: 'battery_service',   label: 'Battery Service',    icon: '🔋' },
  { value: 'inspection',        label: 'Inspection',         icon: '🔍' },
  { value: 'other',             label: 'Other',              icon: '⚙️' },
];
```

**Search feature**: Add a `searchQuery` state variable. The `filtered` derived value applies both category and name search:

```js
const filtered = services
  .filter((s) => selectedCategory === 'all' || s.category === selectedCategory)
  .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
```

**Validation rules** (added to `handleSubmit`):
- `name`: required, non-empty after trim
- `price`: required, `parseFloat(price) >= 0`
- `duration`: required, `parseInt(duration) >= 15`
- `category`: must be one of the 11 valid values

**Deactivate confirmation**: Wrap `toggleActive` to call `window.confirm` (or an inline modal) only when deactivating (i.e., `service.isActive === true`).

---

### Admin Users Page — Enhancements

**Status filter**: Add a `statusFilter` state alongside `roleFilter`. Values: `'all'`, `'active'`, `'inactive'`. Pass as `isActive` query param to `GET /api/users`.

**Confirmation dialogs**:
- `toggleStatus` deactivation path: show `ConfirmModal` before API call; activation proceeds immediately.
- `changeRole`: replace `window.confirm` with `ConfirmModal`.

**PhoneLink column**: Add a `Phone` column to the admin table rendering `<PhoneLink phone={u.phone} size="sm" />`.

**Component interaction:**

```
AdminUsers
  ├── fetchUsers(page) → GET /api/users?page&role&search&isActive
  ├── <SearchInput value={search} />
  ├── <RoleFilterButtons roleFilter />
  ├── <StatusFilterButtons statusFilter />   ← NEW
  ├── <UserTable users>
  │     └── rows: Name | Email | Phone (PhoneLink) | Role | Status | Joined | Actions
  ├── toggleStatus(user) → confirm if deactivating → PATCH /api/users/:id/status
  ├── changeRole(user, role) → <ConfirmModal> → PATCH /api/users/:id/role
  ├── <ConfirmModal open message onConfirm onClose />   ← NEW
  └── <Pagination pages />
```

---

### 7-Step Business Registration Wizard

The existing `ProviderSignup.jsx` already implements a multi-step form, but the step content does not precisely match the specified 7 steps in Requirement 7. The component needs to be refactored to align with the new step structure.

**Wizard State Machine:**

```
States: 0 → 1 → 2 → 3 → 4 → 5 → 6 → SUBMITTED
         ↑   ↑   ↑   ↑   ↑   ↑   ↑
       BACK navigates left; data preserved in each slice of state
       NEXT validates current step before advancing
       SUBMIT (step 6) calls POST /api/auth/register-provider

Step 0: Role Selection
  Data: { role: 'service_provider' | 'dealer' }
  Required: role

Step 1: Personal Information
  Data: { firstName, lastName, email, phone, password }
  Required: all fields; email format; phone ≥10 digits; password ≥8 chars, ≥1 uppercase, ≥1 digit

Step 2: Business Information
  Data: { businessName, businessType, description }
  Required: businessName, businessType

Step 3: Business Address
  Data: { streetAddress, city, region, postalCode, country }
  Required: streetAddress, city, region

Step 4: Service Categories / Inventory
  Data (service_provider): { selectedCategories: string[] }   ← checkboxes from CATEGORIES list
  Data (dealer): { inventoryTypes: string[] }                 ← e.g., ['new', 'used', 'rental']
  Required: at least one selection

Step 5: Business Hours
  Data: { availability: { [day]: { open: bool, openTime: string, closeTime: string } } }
  Days: Monday–Sunday
  Required: at least one day enabled; openTime < closeTime

Step 6: Document Upload
  Data: { businessRegDoc: File | null, govIdDoc: File | null, selfieFile: File | null }
  Required: businessRegDoc, govIdDoc

Step 7 (Review, index 6): Summary + Submit
  Renders all collected data read-only; Submit button calls handleSubmit()
  Required: All previous steps valid (re-validate on submit)
```

**State shape** (React `useState` slices):

```js
const [wizardStep, setWizardStep] = useState(0);
const [role, setRole] = useState('');
const [personal, setPersonal] = useState({ firstName, lastName, email, phone, password, confirmPassword });
const [business, setBusiness] = useState({ businessName, businessType, description });
const [address, setAddress] = useState({ streetAddress, city, region, postalCode, country: 'Ghana' });
const [categories, setCategories] = useState({ selected: [] });
const [hours, setHours] = useState({ /* day: { open, openTime, closeTime } */ });
const [documents, setDocuments] = useState({ businessRegDoc: null, govIdDoc: null, selfieFile: null });
```

**Navigation guards:**

```
goNext():
  1. validate(wizardStep)  → returns bool
  2. if valid: setWizardStep(s => s + 1)
  3. if invalid: setErrors(newErrors), do NOT advance

goBack():
  setWizardStep(s => s - 1)
  // No validation; all state slices already held in memory
```

**Password strength meter** (already in existing component, keep):
Score 0–5 based on length, uppercase, digit, symbol rules → label + color bar.

---

### Prototype Asset Merge

**`AICarFinder.js` → `AICarFinder.jsx`**

The prototype version uses static local data, client-side search, and a basic grid. The main frontend version connects to the AI service and backend. Merge plan:
- Keep the main file's AI/API integration as the authoritative implementation.
- Extract and apply any CSS class patterns from the prototype's `AICarFinder.css` (filter layout, `.car-card` grid structure) into the main `AICarFinder.css` if not already present.
- The prototype's static `carData` array and `handleSearch` function are superseded by the live API.

**CSS files to merge (additive, no-overwrite):**
- `autosphere-prototype/src/pages/styles/LandingPage.css` → `frontend/src/pages/public/LandingPage.css`: hero section flex layout, `.feature-card` box shadows, `.btn-tertiary` orange style, responsive `@media (max-width: 900px)` rules.
- `autosphere-prototype/src/pages/user/BookService.css` → `frontend/src/pages/user/BookService.css`: glass card form styles if not present.
- `autosphere-prototype/src/pages/user/Dashboard.css` → `frontend/src/pages/user/Dashboard.css`: `.dash-card` grid layout if not present.

After merging, `autosphere-prototype/` can be removed. The build must pass (`npm run build`).

---

## Data Models

### User (existing — relevant fields)

```
User {
  id: INTEGER PK
  email: STRING(255) UNIQUE NOT NULL
  firstName: STRING(100) NOT NULL
  lastName: STRING(100) NOT NULL
  passwordHash: STRING(255) NOT NULL
  phone: STRING(20) nullable
  role: ENUM('user','dealer','service_provider','admin') DEFAULT 'user'
  isActive: BOOLEAN DEFAULT true
  emailVerified: BOOLEAN DEFAULT false
  createdAt, updatedAt
}
```

### ServiceOffering (needs `category` column)

Current model is missing `category`. Migration required:

```
ServiceOffering {
  id: INTEGER PK
  providerId: INTEGER FK → User
  name: STRING(255) NOT NULL
  description: TEXT nullable
  category: ENUM(11 values) NOT NULL DEFAULT 'other'  ← ADD
  price: DECIMAL(10,2)
  duration: INTEGER (minutes)
  isActive: BOOLEAN DEFAULT true
  bookingCount: INTEGER DEFAULT 0                      ← ADD (or computed)
  createdAt, updatedAt
}
```

### Booking / Appointment (relevant fields)

```
Booking {
  id: INTEGER PK
  userId: INTEGER FK → User
  serviceProviderId: INTEGER FK → User
  serviceOfferingId: INTEGER FK → ServiceOffering
  serviceType: STRING  (snake_case category key)
  status: ENUM('pending','confirmed','in_progress','completed','cancelled','no_show')
  scheduledDate: DATEONLY
  scheduledTime: TIME
  estimatedCost: DECIMAL(10,2)
  actualCost: DECIMAL(10,2)
  customerNotes: TEXT
  providerNotes: TEXT
  priority: ENUM('normal','high','urgent') DEFAULT 'normal'
  rating: INTEGER (1–5) nullable
  review: TEXT nullable
  location: JSON { address: string }
  createdAt, updatedAt, completedAt
}
```

### Notification

```
Notification {
  id: INTEGER PK
  userId: INTEGER FK → User
  type: ENUM('message','booking','system','payment')
  title: STRING NOT NULL
  message: TEXT
  isRead: BOOLEAN DEFAULT false
  linkType: STRING nullable   ('conversation'|'booking'|'appointment')
  linkId: INTEGER nullable
  url: STRING nullable
  createdAt, updatedAt
}
```

### Conversation

```
Conversation {
  id: INTEGER PK
  participant1: INTEGER FK → User
  participant2: INTEGER FK → User
  lastMessageId: INTEGER FK → Message nullable
  lastMessageAt: DATE
  unreadCount1: INTEGER DEFAULT 0
  unreadCount2: INTEGER DEFAULT 0
  createdAt, updatedAt
}
```

### Message

```
Message {
  id: INTEGER PK
  conversationId: INTEGER FK → Conversation
  senderId: INTEGER FK → User
  content: TEXT NOT NULL
  messageType: ENUM('text','image','file') DEFAULT 'text'
  attachments: JSON DEFAULT []
  isRead: BOOLEAN DEFAULT false
  readAt: DATE nullable
  createdAt, updatedAt
}
```

### PushSubscription

```
PushSubscription {
  id: INTEGER PK
  userId: INTEGER FK → User
  endpoint: TEXT NOT NULL
  keys: JSON { p256dh, auth }
  userAgent: STRING nullable
  createdAt, updatedAt
}
```

---

## API Endpoints Design

All authenticated endpoints require `Authorization: Bearer <jwt>` header. All mutation endpoints validate the request body before processing.

### Auth

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| POST | `/api/auth/register` | None | `{ firstName, lastName, email, phone, password }` | Regular user registration |
| POST | `/api/auth/register-provider` | None | `multipart/form-data` (all wizard fields) | Provider/dealer registration |
| POST | `/api/auth/login` | None | `{ email, password }` | Returns JWT |
| POST | `/api/auth/verify-email` | None | `{ email, otp }` | Verify OTP, activate account |
| POST | `/api/auth/resend-otp` | None | `{ email }` | Resend verification OTP |
| POST | `/api/auth/forgot-password` | None | `{ email }` | Send reset link |
| POST | `/api/auth/reset-password` | None | `{ token, newPassword }` | Reset password |
| GET | `/api/auth/google` | None | — | Google OAuth redirect |
| GET | `/api/auth/google/callback` | None | — | Google OAuth callback |

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/profile` | User+ | Get own profile |
| PUT | `/api/users/profile` | User+ | Update own profile |
| PATCH | `/api/users/change-password` | User+ | Change password |
| GET | `/api/users` | Admin | List users (params: `page`, `limit`, `search`, `role`, `isActive`) |
| GET | `/api/users/:id` | Admin | Get user by ID |
| PATCH | `/api/users/:id/status` | Admin | `{ isActive: bool }` — activate/deactivate |
| PATCH | `/api/users/:id/role` | Admin | `{ role: string }` — change role |
| GET | `/api/users/service-providers/list` | User+ | List active service providers |

### Services (Service Provider)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/services` | SP | Get own services |
| POST | `/api/services` | SP | Create service `{ name, description, category, price, duration, isActive }` |
| PUT | `/api/services/:id` | SP | Update service |
| DELETE | `/api/services/:id` | SP | Delete service |
| GET | `/api/services/provider/:id` | User+ | Get services by provider ID |
| GET | `/api/services/by-type` | User+ | Filter by `?serviceType=` |

### Appointments/Bookings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/appointments` | User+ | Get user's appointments |
| GET | `/api/appointments/:id` | User+ | Get appointment details |
| POST | `/api/appointments` | User | Book service |
| PATCH | `/api/appointments/:id/status` | SP/Admin | `{ status }` |
| PATCH | `/api/appointments/:id/reschedule` | User | `{ scheduledDate, scheduledTime }` |
| PATCH | `/api/appointments/:id/cancel` | User | `{ reason? }` |
| PATCH | `/api/appointments/:id/review` | User | `{ rating, review }` |
| GET | `/api/bookings/provider/stats` | SP | Provider booking statistics |

### Messages

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/messages/conversations` | User+ | List conversations |
| POST | `/api/messages/conversations` | User+ | Start conversation `{ participantId, initialMessage }` |
| GET | `/api/messages/conversations/:id/messages` | User+ | Get messages in conversation |
| POST | `/api/messages/conversations/:id/messages` | User+ | Send message (REST fallback) |

### Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/notifications` | User+ | Get recent notifications |
| PATCH | `/api/notifications/:id/read` | User+ | Mark as read |
| PATCH | `/api/notifications/read-all` | User+ | Mark all as read |

### Push

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/push/subscribe` | User+ | `{ endpoint, keys }` — register push subscription |
| DELETE | `/api/push/unsubscribe` | User+ | Remove push subscription |

### Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/stats` | Admin | Platform-wide statistics |
| GET | `/api/admin/analytics` | Admin | Analytics by `?days=` |

---

## State Management Approach

The frontend uses **React Context + local component state** — no external state library.

**Global contexts:**

```
AuthContext
  ├── user: User | null
  ├── token: string | null
  ├── isAuthenticated: bool
  ├── login(email, password) → Promise
  ├── logout()
  └── updateUser(partial) → merges into user object

NotificationContext
  ├── notifications: Notification[]
  ├── unreadCount: number
  ├── markRead(id)
  ├── markAllRead()
  └── addNotification(n) ← called by socket listener in provider
```

**Local state patterns:**

- **Page components** own their data fetch state (`loading`, `error`, `data`) and any action states (`cancelling`, `saving`).
- **Modal state**: Each modal is driven by a local state variable (`null` = closed, object/id = open with context).
- **Forms**: Controlled inputs with per-field error state; validation runs on "Next"/"Submit" click.
- **Wizard**: One state slice per step; `wizardStep` integer drives which section renders.

**Socket integration:**

The `useSocket` hook returns a stable `{socket, connected, emit}` triple. Socket listeners for `notification:new` and `message:new` are registered in `NotificationContext`'s provider component so they remain active across page navigation. Conversation-level listeners (`message:new` within a thread) are registered in the messaging page/component and cleaned up on unmount.

---

## Real-Time Communication Design

### Socket.io Event Catalogue

**Client → Server:**

| Event | Payload | Description |
|-------|---------|-------------|
| `conversation:join` | `conversationId` | Join room for a conversation |
| `conversation:leave` | `conversationId` | Leave conversation room |
| `conversation:markRead` | `{ conversationId }` | Mark messages as read |
| `message:send` | `{ conversationId, content, attachments? }` | Send a new message |
| `typing:start` | `{ conversationId }` | Broadcast typing indicator |
| `typing:stop` | `{ conversationId }` | Clear typing indicator |

**Server → Client:**

| Event | Payload | Description |
|-------|---------|-------------|
| `message:new` | Full `Message` object with sender | New message in a conversation |
| `typing:user` | `{ conversationId, userId, isTyping }` | Typing indicator update |
| `conversation:read` | `{ conversationId, readBy }` | Conversation marked as read |
| `user:online` | `{ userId }` | User came online |
| `user:offline` | `{ userId }` | User went offline |
| `notification:new` | `Notification` object | New notification for a user |
| `booking:updated` | `{ bookingId, status, userId }` | Booking status changed |
| `error` | `{ message }` | Server-side error |

### Authentication Flow

All socket connections pass the JWT in `socket.handshake.auth.token`. The server middleware (`io.use(...)`) verifies the token on connect. Invalid/missing tokens receive `new Error('Authentication token required')` and the connection is rejected before any event handlers fire.

### Notification Delivery Flow

```
1. Event occurs (new message, booking update)
2. Server calls createNotification({ userId, type, title, message, linkType, linkId, url, io })
3. createNotification():
   a. Persists Notification row to DB
   b. io.to('user:{userId}').emit('notification:new', notification)
   c. If user has push subscriptions: sends web push via webpush.sendNotification()
4. Client NotificationContext listener receives 'notification:new'
5. addNotification(n) called → notifications state updated → unreadCount incremented
6. NotificationBell re-renders with new badge count
```

### Message Flow

```
1. User types → typing:start emitted
2. User submits → message:send emitted with { conversationId, content }
3. Server validates participant, creates Message row, updates Conversation
4. Server emits message:new to conversation:{conversationId} room
5. Both sender and recipient receive message:new
6. Recipient's useMessaging hook appends message to local messages state
7. Sender's optimistic update confirmed (or falls back to server version)
8. createNotification called for recipient → notification:new + optional web push
```

---

## Responsive Design Strategy

### Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | ≤ 600px | Single-column grids, full-width modals, stacked forms |
| Tablet | 601px – 768px | Two-column grids, collapsible sidebar |
| Desktop | > 768px | Full layout, side-by-side panels |

### Global Rules (add to `frontend/src/index.css`)

```css
/* Touch targets */
button, a, input, select, textarea {
  min-height: 44px;
}

/* Modal — mobile full-width */
@media (max-width: 600px) {
  .modal-overlay { align-items: flex-end; }
  .modal-content, .apt-modal { width: 100%; border-radius: 16px 16px 0 0; }
}

/* Grids → single column */
@media (max-width: 600px) {
  .services-grid,
  .vehicle-grid,
  .apt-list { grid-template-columns: 1fr; }
}

/* Admin table — horizontal scroll on mobile */
@media (max-width: 768px) {
  .admin-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
}

/* Forms — stack on mobile */
@media (max-width: 600px) {
  .form-row, .ps-grid-2 { grid-template-columns: 1fr; }
}
```

### Component-Specific Rules

- **`Appointments.css`**: `apt-filters` scrolls horizontally at ≤600px; `apt-card-top` stacks vertically.
- **`Services.css`**: `category-filter` wraps at ≤600px; modal becomes `width: 100%; border-radius: 16px 16px 0 0`.
- **`ProviderSignup.css`**: `ps-grid-2` collapses to single column; step labels hidden below 480px (show only step number).
- **`Admin.css`**: Table shows scroll indicator on mobile; filter buttons wrap and scroll.

---

## Error Handling

### Frontend

- **API errors**: All Axios calls are wrapped in try/catch. Errors are stored in local `error` state and displayed as inline alert banners (not native `alert()`). Network errors show a "Retry" button.
- **Form validation**: Per-field inline errors set on submit attempt; errors clear when the user edits the field.
- **Socket errors**: The `error` event from the server is logged to console; critical errors (auth failure) trigger logout via `AuthContext`.
- **Async action states**: Each action (cancel, reschedule, submit) has its own loading boolean to prevent double-submission and provide visual feedback.
- **404 routes**: React Router catch-all redirects to role-appropriate dashboard or a 404 page.

### Backend

- **Auth failures**: 401 for missing/invalid JWT; 403 for valid token but insufficient role.
- **Validation errors**: 422 Unprocessable Entity with `{ success: false, errors: [...] }` response shape.
- **Not found**: 404 with `{ success: false, message: 'Resource not found' }`.
- **Server errors**: 500 with generic message; full error logged server-side, never exposed to client.
- **Deactivated user**: Middleware checks `user.isActive`; returns 403 `{ message: 'Account deactivated' }` for any authenticated request from an inactive account.
- **Rate limiting**: `rateLimiter` middleware applies stricter limits to auth endpoints (login, register, verify).

### Socket Errors

- Authentication failure: `next(new Error('Authentication token required'))` — client receives `connect_error`.
- Unauthorized room join: `socket.emit('error', { message: 'Not authorized' })`.
- DB errors on message:send: `socket.emit('error', { message: 'Failed to send message' })`.

---

## Testing Strategy

### Unit Tests (Vitest)

Focus on pure functions and component logic. Avoid excessive unit tests where property-based tests provide better coverage.

**Priority unit tests:**
- `formatCategoryLabel()`: known inputs → expected outputs; edge cases (empty string, single word, already-formatted).
- `PhoneLink` component: renders `null` for empty phone; renders correct `tel:` href; strips formatting chars.
- `passwordStrength()`: score-to-label mapping for boundary inputs.
- `NotificationContext`: `addNotification` increments `unreadCount`; `markAllRead` sets count to 0.
- Wizard `validate()` per step: required field detection returns correct error map.
- `AppointmentDetails` render: provider phone/email display; no `window.alert`/`window.prompt` calls.

### Property-Based Tests (Vitest + fast-check)

Use [fast-check](https://fast-check.io/) for property-based testing. Each test runs a minimum of **100 iterations**.

Tag format: `// Feature: autosphere-platform-enhancement, Property {N}: {text}`

See Correctness Properties section below for the full property list.

### Integration Tests

- Socket authentication rejection (invalid token → `connect_error`).
- Booking creation → status `pending` + `booking:updated` event emitted.
- User deactivation → subsequent authenticated requests return 403.
- Push subscription stored per user.
- Admin stats endpoint returns expected shape.
- Role-restricted routes return 403 for wrong role.

### Build Verification

- `npm run build` passes with zero errors after prototype merge (smoke test for Requirement 1).
- No `window.alert` / `window.prompt` calls in `AppointmentDetails.jsx` after refactor.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: `formatCategoryLabel` produces clean human-readable output

*For any* snake_case category string (one or more words joined by underscores), `formatCategoryLabel(value)` shall return a string where every word is title-cased, no underscores remain, the result does not start or end with whitespace, and the result does not start or end with a hyphen.

**Validates: Requirements 2.1, 2.2, 2.5, 2.6**

### Property 2: `PhoneLink` always constructs a valid `tel:` href

*For any* non-empty phone string (containing any mix of digits, spaces, dashes, parentheses, dots, and an optional leading `+`), the `PhoneLink` component shall render an anchor element whose `href` attribute starts with `"tel:"` and contains no spaces, dashes, parentheses, or dots — only digits and an optional leading `+`.

**Validates: Requirements 3.2, 5.1, 5.3, 5.6**

### Property 3: Service name search filter is exhaustive and correct

*For any* list of service objects and *any* search query string, the client-side filtered result shall contain exactly those services whose `name` contains the query as a case-insensitive substring, and no others.

**Validates: Requirements 6.1, 6.2**

### Property 4: Service form validation catches all invalid inputs

*For any* service form submission where at least one of the following is true — name is empty/whitespace, price is negative, duration is below 15 — the validation function shall return `false` and the returned errors object shall have a non-empty string entry for every invalid field.

**Validates: Requirements 6.6**

### Property 5: Service card renders all required data fields

*For any* valid service object containing `name`, `category`, `price`, `duration`, `isActive`, and `bookingCount`, the rendered service card shall display all six data points — the category rendered via `formatCategoryLabel`, price formatted with the GH₵ symbol, duration in minutes, and an active/inactive status badge.

**Validates: Requirements 6.4, 2.1**

### Property 6: Wizard step progress indicator reflects current step

*For any* wizard step index `n` in the range 0–6, the rendered step progress indicator shall highlight step `n` as active, mark steps 0 through `n-1` as complete (showing a checkmark), and mark steps `n+1` through 6 as upcoming.

**Validates: Requirements 7.3**

### Property 7: Wizard validation blocks advancement on any missing required field

*For any* wizard step and *any* form state where at least one required field for that step is empty or invalid, calling `validate(step)` shall return `false` and `errors` shall contain at least one entry. Calling `goNext()` shall not increment `wizardStep`.

**Validates: Requirements 7.4**

### Property 8: Wizard Back preserves all entered data

*For any* sequence of valid step submissions followed by any number of Back navigations, all data entered in every previously completed step shall be unchanged (the state slice for each step shall equal its value before the Back navigation).

**Validates: Requirements 7.5**

### Property 9: Wizard Review step renders all non-empty entered data

*For any* wizard state where steps 0–5 contain at least one non-empty value, the Review step (step 6) shall render every non-empty field value entered across all previous steps.

**Validates: Requirements 7.6**

### Property 10: Admin status badge accurately reflects `isActive`

*For any* user object, the rendered admin table row shall display a badge with the text `"Active"` when `isActive` is `true`, and `"Inactive"` when `isActive` is `false`. No other value shall appear in the status cell.

**Validates: Requirements 8.1, 8.4**

### Property 11: Admin status filter returns only matching users

*For any* list of user objects and *any* status filter value (`"active"`, `"inactive"`, or `"all"`), the filtered display shall contain exactly those users whose `isActive` value matches the filter (all users for `"all"`), and no others.

**Validates: Requirements 8.6**

### Property 12: Notification badge count reflects unread notifications

*For any* sequence of `addNotification` calls on `NotificationContext` where each notification has `isRead: false`, the `unreadCount` value shall equal the number of unread notifications added, and the `NotificationBell` shall render a badge displaying that count when it is greater than zero.

**Validates: Requirements 9.2, 9.4**

### Property 13: Notifications render all required display fields

*For any* notification object containing `type`, `title`, `message`, and `createdAt`, the rendered notification list item shall include the type icon, the title/message text, and the formatted timestamp.

**Validates: Requirements 9.5**

### Property 14: Socket connections without a valid JWT are rejected

*For any* socket connection attempt that either omits `auth.token` or supplies an expired/malformed JWT, the server shall reject the connection with an error before any event handlers are invoked, and the client shall receive a `connect_error` event.

**Validates: Requirements 9.10, 10.2**

### Property 15: Protected routes reject wrong-role users

*For any* route protected by `RoleBasedRoute` with an `allowedRoles` list, and *any* authenticated user whose `role` is not in `allowedRoles`, the component shall redirect the user to their role-appropriate dashboard rather than rendering the protected content.

**Validates: Requirements 10.3**

### Property 16: Vehicle search filter returns only matching vehicles

*For any* vehicle list and *any* filter object specifying one or more of `make`, `model`, `year`, `minPrice`, `maxPrice`, or `category`, every vehicle in the filtered result shall satisfy all provided filter criteria simultaneously.

**Validates: Requirements 10.4**

### Property 17: API responses never expose password data

*For any* API response that includes user data (profile, admin user list, booking with provider info), the response body shall not contain any field named `password`, `passwordHash`, or `password_hash`.

**Validates: Requirements 10.9**

### Property 18: Protected API endpoints require a valid JWT

*For any* data-mutating API endpoint (POST, PUT, PATCH, DELETE) under `/api/users`, `/api/services`, `/api/appointments`, `/api/admin`, a request made without a valid `Authorization: Bearer <token>` header shall receive a 401 or 403 HTTP response and shall not modify any database state.

**Validates: Requirements 10.10**
