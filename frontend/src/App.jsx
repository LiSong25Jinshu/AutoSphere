import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import './styles/auto-theme.css';

// Always-loaded layout components (needed on every render)
import Footer from './components/Footer';
import UserDropdown from './components/UserDropdown';
import DashboardLayout from './components/DashboardLayout';
import CookieConsent from './components/CookieConsent';

// Page-level lazy imports — each becomes its own JS chunk
// Public pages
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const About = lazy(() => import('./pages/public/About'));
const Contact = lazy(() => import('./pages/public/Contact'));
const Login = lazy(() => import('./pages/public/Login'));
const Register = lazy(() => import('./pages/public/Register'));
const PrivacyPolicy = lazy(() => import('./pages/public/PrivacyPolicy'));
const VehiclesPage = lazy(() => import("./pages/public/VehiclesPage"));

const ProviderSignup = lazy(() => import('./pages/public/ProviderSignup'));
const AccountSuspended = lazy(() => import('./pages/public/AccountSuspended'));
const BusinessSignup = lazy(() => import('./pages/public/BusinessSignup'));

// Auth utility pages
const GoogleAuthCallback = lazy(() => import('./components/GoogleAuthCallback'));
const ForgotPasswordForm = lazy(() => import('./components/ForgotPasswordForm'));
const ResetPasswordForm = lazy(() => import('./components/ResetPasswordForm'));
const EmailVerificationForm = lazy(() => import('./components/EmailVerificationForm'));

// User pages
const UserDashboardPage = lazy(() => import('./pages/user/Dashboard'));
const UserProfile = lazy(() => import('./pages/user/Profile'));
const UserAppointments = lazy(() => import('./pages/user/Appointments'));
const UserAppointmentDetails = lazy(() => import('./pages/user/AppointmentDetails'));
const UserMessages = lazy(() => import('./pages/user/Messages'));
const UserNotifications = lazy(() => import('./pages/user/Notifications'));
const UserInventory = lazy(() => import('./pages/user/Inventory'));
const VehicleInsights = lazy(() => import('./pages/user/VehicleInsights'));
const UserSettings = lazy(() => import('./pages/user/Settings'));
const BookService = lazy(() => import('./pages/user/BookService'));
const VehicleRent = lazy(() => import('./pages/user/VehicleRent'));
const AICarFinder = lazy(() => import('./pages/AICarFinder'));

// Admin pages
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboard'));
//const AdminJobs = lazy(() => import('./pages/admin/Jobs'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminDealers = lazy(() => import('./pages/admin/Dealers'));
const AdminServices = lazy(() => import('./pages/admin/Services'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const AdminLogs = lazy(() => import('./pages/admin/Logs'));
const AdminSystemSettings = lazy(() => import('./pages/admin/SystemSettings'));

// Dealer pages
const DealerDashboardPage = lazy(() => import('./pages/dealer/Dashboard'));
const DealerInventory = lazy(() => import('./pages/dealer/Inventory'));
const DealerManageListings = lazy(() => import('./pages/dealer/ManageListings'));
const DealerMessages = lazy(() => import('./pages/dealer/Messages'));
const DealerProfile = lazy(() => import('./pages/dealer/Profile'));
const DealerSales = lazy(() => import('./pages/dealer/Sales'));

// Service provider pages
const ServiceProviderDashboardPage = lazy(() => import('./pages/service-provider/Dashboard'));
const ServiceProviderBookings = lazy(() => import('./pages/service-provider/Bookings'));
const ServiceProviderServices = lazy(() => import('./pages/service-provider/Services'));
const ServiceProviderMessages = lazy(() => import('./pages/service-provider/Messages'));
const ServiceProviderAvailability = lazy(() => import('./pages/service-provider/Availability'));
const ServiceProviderProfilePage = lazy(() => import('./pages/service-provider/ProfilePage'));

// Fallback shown while a lazy chunk is loading
const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
    <div style={{ width: 40, height: 40, border: '4px solid #e0e0e0', borderTop: '4px solid #1976d2', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <p style={{ color: '#666', margin: 0 }}>Loading...</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── Route guards ──────────────────────────────────────────────────────────────

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();


  if (isLoading) {
    return <div style={{ padding: '40px 20px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    const roleHome = {
      user: '/dashboard',
      dealer: '/dealer-dashboard',
      service_provider: '/service-provider-dashboard',
      admin: '/admin-dashboard',
    };
    return <Navigate to={roleHome[user?.role] || '/dashboard'} replace />;
  }

  return children;
};

// Helper — decide if the current path uses the dashboard layout
const isDashboardRoute = (path) => {
  const dashboardPrefixes = [
    '/dashboard',
    '/admin-dashboard',
    '/dealer-dashboard',
    '/service-provider-dashboard',
    '/appointments',
    '/inventory',
    '/user-messages',
    '/notifications',
    '/profile',
    '/settings',
    // '/jobs',
    '/vehicle-insights',
    '/book-service',
    '/rent-vehicle',
    '/ai-car-finder',
    '/messages',
    '/bookings',
    '/dealer/',
    '/service-provider/',
    '/admin/',
  ];
  return dashboardPrefixes.some(prefix =>
    path === prefix || path.startsWith(prefix)
  );
};

// Wrapper: protect + wrap in sidebar layout
const DashboardRoute = ({ children, requiredRole }) => (
  <ProtectedRoute requiredRole={requiredRole}>
    <DashboardLayout>
      {children}
    </DashboardLayout>
  </ProtectedRoute>
);

// ── Public navigation bar (hidden on dashboard routes) ───────────────────────

function Navigation() {
  const { user } = useAuth();
  const location = useLocation();

  if (isDashboardRoute(location.pathname)) return null;

  return (
    <nav className="auto-nav">
      <div className="auto-nav-content">
        <div className="auto-nav-brand">
          <Link to="/" className="auto-logo">AutoSphere</Link>
        </div>

        <div className="auto-nav-links">
          <Link to="/" className="auto-nav-link">Home</Link>
          <Link to="/vehicles" className="auto-nav-link">Vehicles</Link>
          <Link to="/about" className="auto-nav-link">About</Link>
          <Link to="/contact" className="auto-nav-link">Contact</Link>
        </div>

        <div className="auto-nav-utils">
          {!user ? (
            <>
              <Link to="/login" className="auto-nav-util">Login</Link>
              <Link to="/register" className="auto-nav-util auto-nav-util-primary">Sign Up</Link>
            </>
          ) : (
            <>
              <Link
                to={
                  user.role === 'dealer' ? '/dealer-dashboard' :
                  user.role === 'service_provider' ? '/service-provider-dashboard' :
                  user.role === 'admin' ? '/admin-dashboard' :
                  '/dashboard'
                }
                className="auto-nav-util auto-nav-util-primary"
              >
                Dashboard
              </Link>
              <Link to="/notifications" className="auto-nav-util" title="Notifications">Notifications</Link>
              <UserDropdown />
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// ── App content ───────────────────────────────────────────────────────────────

function AppContent() {
  const location = useLocation();
  const showFooter = !isDashboardRoute(location.pathname);
  const isDashboard = isDashboardRoute(location.pathname);

  return (
    <div className={`App ${isDashboard ? 'dashboard-app' : ''}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navigation />
      <main style={{ flex: 1 }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register-provider" element={<ProviderSignup />} />
            <Route path="/account-suspended" element={<AccountSuspended />} />
            <Route path="/business-signup" element={<BusinessSignup />} />
            <Route path="/forgot-password" element={<ForgotPasswordForm />} />
            <Route path="/reset-password" element={<ResetPasswordForm />} />
            <Route path="/verify-email" element={<EmailVerificationForm />} />

            {/* Google OAuth callback routes */}
            <Route path="/auth/callback" element={<GoogleAuthCallback />} />
            <Route path="/auth/google/success" element={<GoogleAuthCallback />} />
            <Route path="/auth/google/error" element={<GoogleAuthCallback />} />

            {/* ── User routes ── */}
            <Route path="/dashboard" element={<DashboardRoute><UserDashboardPage /></DashboardRoute>} />
            <Route path="/profile" element={<DashboardRoute><UserProfile /></DashboardRoute>} />
            <Route path="/appointments" element={<DashboardRoute><UserAppointments /></DashboardRoute>} />
            <Route path="/appointments/:id" element={<DashboardRoute><UserAppointmentDetails /></DashboardRoute>} />
            <Route path="/user-messages" element={<DashboardRoute><UserMessages /></DashboardRoute>} />
            <Route path="/notifications" element={<DashboardRoute><UserNotifications /></DashboardRoute>} />
            <Route path="/inventory" element={<DashboardRoute><UserInventory /></DashboardRoute>} />
            <Route path="/ai-car-finder" element={<DashboardRoute><AICarFinder /></DashboardRoute>} />
            <Route path="/vehicle-insights" element={<DashboardRoute><VehicleInsights /></DashboardRoute>} />
            <Route path="/settings" element={<DashboardRoute><UserSettings /></DashboardRoute>} />
            <Route path="/book-service" element={<DashboardRoute><BookService /></DashboardRoute>} />
            <Route path="/rent-vehicle" element={<DashboardRoute><VehicleRent /></DashboardRoute>} />
            <Route path="/messages" element={<DashboardRoute><UserMessages /></DashboardRoute>} />
            <Route path="/bookings" element={<DashboardRoute><UserAppointments /></DashboardRoute>} />

            {/* ── Admin routes ── */}
            <Route path="/admin-dashboard" element={<DashboardRoute requiredRole="admin"><AdminDashboardPage /></DashboardRoute>} />
            {/* <Route path="/jobs" element={<DashboardRoute requiredRole="admin"><AdminJobs /></DashboardRoute>} /> */}
            <Route path="/admin/users" element={<DashboardRoute requiredRole="admin"><AdminUsers /></DashboardRoute>} />
            <Route path="/admin/dealers" element={<DashboardRoute requiredRole="admin"><AdminDealers /></DashboardRoute>} />
            <Route path="/admin/services" element={<DashboardRoute requiredRole="admin"><AdminServices /></DashboardRoute>} />
            <Route path="/admin/reports" element={<DashboardRoute requiredRole="admin"><AdminReports /></DashboardRoute>} />
            <Route path="/admin/logs" element={<DashboardRoute requiredRole="admin"><AdminLogs /></DashboardRoute>} />
            <Route path="/admin/system-settings" element={<DashboardRoute requiredRole="admin"><AdminSystemSettings /></DashboardRoute>} />
            <Route path="/admin/messages" element={<DashboardRoute requiredRole="admin"><AdminDashboardPage /></DashboardRoute>} />
            <Route path="/admin/profile" element={<DashboardRoute requiredRole="admin"><AdminDashboardPage /></DashboardRoute>} />

            {/* ── Dealer routes ── */}
            <Route path="/dealer-dashboard" element={<DashboardRoute requiredRole="dealer"><DealerDashboardPage /></DashboardRoute>} />
            <Route path="/dealer/my-vehicles" element={<DashboardRoute requiredRole="dealer"><DealerInventory /></DashboardRoute>} />
            <Route path="/dealer/inventory" element={<DashboardRoute requiredRole="dealer"><DealerInventory /></DashboardRoute>} />
            <Route path="/dealer/sales" element={<DashboardRoute requiredRole="dealer"><DealerSales /></DashboardRoute>} />
            <Route path="/dealer/messages" element={<DashboardRoute requiredRole="dealer"><DealerMessages /></DashboardRoute>} />
            <Route path="/dealer/profile" element={<DashboardRoute requiredRole="dealer"><DealerProfile /></DashboardRoute>} />
            <Route path="/dealer/manage-listings" element={<DashboardRoute requiredRole="dealer"><DealerManageListings /></DashboardRoute>} />

            {/* ── Service provider routes ── */}
            <Route path="/service-provider-dashboard" element={<DashboardRoute requiredRole="service_provider"><ServiceProviderDashboardPage /></DashboardRoute>} />
            <Route path="/service-provider/appointments" element={<DashboardRoute requiredRole="service_provider"><ServiceProviderBookings /></DashboardRoute>} />
            <Route path="/service-provider/bookings" element={<DashboardRoute requiredRole="service_provider"><ServiceProviderBookings /></DashboardRoute>} />
            <Route path="/service-provider/services" element={<DashboardRoute requiredRole="service_provider"><ServiceProviderServices /></DashboardRoute>} />
            <Route path="/service-provider/messages" element={<DashboardRoute requiredRole="service_provider"><ServiceProviderMessages /></DashboardRoute>} />
            <Route path="/service-provider/profile" element={<DashboardRoute requiredRole="service_provider"><ServiceProviderProfilePage /></DashboardRoute>} />
            <Route path="/service-provider/service-settings" element={<DashboardRoute requiredRole="service_provider"><ServiceProviderProfilePage /></DashboardRoute>} />
            <Route path="/service-provider/availability" element={<DashboardRoute requiredRole="service_provider"><ServiceProviderAvailability /></DashboardRoute>} />
          </Routes>
        </Suspense>
      </main>
      {showFooter && <Footer />}
      <CookieConsent />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
