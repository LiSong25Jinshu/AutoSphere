import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './styles/tesla-theme.css';
import Footer from './components/Footer';

// Import user pages
import UserDashboardPage from './pages/user/Dashboard';
import UserProfile from './pages/user/Profile';
import UserAppointments from './pages/user/Appointments';
import UserMessages from './pages/user/Messages';
import UserNotifications from './pages/user/Notifications';
import UserInventory from './pages/user/Inventory';
import VehicleInsights from './pages/user/VehicleInsights';
import UserSettings from './pages/user/Settings';
import BookService from './pages/user/BookService';

// Import public pages
import LandingPage from './pages/public/LandingPage';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Login from './pages/public/Login';
import Register from './pages/public/Register';

// Simple test components
// Simple placeholder components
const VehiclesPage = () => (
  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
    <h1>Vehicle Marketplace</h1>
    <p>Browse our extensive collection of vehicles.</p>
    
    <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <img src="/placeholder-car.jpg" alt="Vehicle" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', backgroundColor: '#f0f0f0' }} />
        <h3 style={{ margin: '15px 0 10px 0' }}>2022 Honda Civic</h3>
        <p style={{ color: '#666', margin: '0 0 10px 0' }}>25,000 miles • Automatic • Gasoline</p>
        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c2c2c', margin: '0 0 15px 0' }}>$24,500</p>
        <button style={{ width: '100%', padding: '10px', backgroundColor: '#2c2c2c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          View Details
        </button>
      </div>
      
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <img src="/placeholder-car.jpg" alt="Vehicle" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', backgroundColor: '#f0f0f0' }} />
        <h3 style={{ margin: '15px 0 10px 0' }}>2021 Toyota Camry</h3>
        <p style={{ color: '#666', margin: '0 0 10px 0' }}>18,500 miles • Automatic • Hybrid</p>
        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c2c2c', margin: '0 0 15px 0' }}>$28,900</p>
        <button style={{ width: '100%', padding: '10px', backgroundColor: '#2c2c2c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          View Details
        </button>
      </div>
      
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <img src="/placeholder-car.jpg" alt="Vehicle" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', backgroundColor: '#f0f0f0' }} />
        <h3 style={{ margin: '15px 0 10px 0' }}>2020 BMW X5</h3>
        <p style={{ color: '#666', margin: '0 0 10px 0' }}>32,000 miles • Automatic • Gasoline</p>
        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c2c2c', margin: '0 0 15px 0' }}>$45,200</p>
        <button style={{ width: '100%', padding: '10px', backgroundColor: '#2c2c2c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          View Details
        </button>
      </div>
    </div>
    
    <div style={{ marginTop: '40px', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2>Search Filters</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
        <select style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <option>All Makes</option>
          <option>Honda</option>
          <option>Toyota</option>
          <option>BMW</option>
        </select>
        <select style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <option>All Models</option>
          <option>Civic</option>
          <option>Camry</option>
          <option>X5</option>
        </select>
        <select style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <option>All Years</option>
          <option>2022</option>
          <option>2021</option>
          <option>2020</option>
        </select>
        <button style={{ padding: '10px 20px', backgroundColor: '#2c2c2c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Search
        </button>
      </div>
    </div>
  </div>
);

const MessagesPage = () => {
  const conversations = [
    { id: 1, name: 'John Smith', role: 'user', lastMessage: 'Is the 2022 Honda Civic still available?', time: '2 hours ago', unread: 2 },
    { id: 2, name: 'Sarah Johnson', role: 'dealer', lastMessage: 'Thank you for the service booking!', time: '1 day ago', unread: 0 },
    { id: 3, name: 'Mike Chen', role: 'service_provider', lastMessage: 'The brake inspection is complete', time: '2 days ago', unread: 1 },
  ];

  return (
    <div style={{ padding: '40px 20px' }}>
      <h1>Messages</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginTop: '30px', height: '70vh' }}>
        {/* Conversations List */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0' }}>
            <input 
              type="text" 
              placeholder="Search conversations..." 
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          
          <div style={{ height: 'calc(100% - 80px)', overflowY: 'auto' }}>
            {conversations.map((conv) => (
              <div key={conv.id} style={{ padding: '15px 20px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', ':hover': { backgroundColor: '#f9f9f9' } }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <span style={{ fontWeight: 'bold' }}>{conv.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ 
                      backgroundColor: conv.role === 'dealer' ? '#2196f3' : conv.role === 'service_provider' ? '#ff9800' : '#4caf50', 
                      color: 'white', 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem' 
                    }}>
                      {conv.role}
                    </span>
                    {conv.unread > 0 && (
                      <span style={{ backgroundColor: '#f44336', color: 'white', padding: '2px 6px', borderRadius: '50%', fontSize: '0.8rem' }}>
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
                <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>{conv.lastMessage}</p>
                <p style={{ margin: '0', color: '#999', fontSize: '0.8rem', marginTop: '5px' }}>{conv.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ backgroundColor: '#2196f3', color: 'white', padding: '10px', borderRadius: '50%', marginRight: '15px' }}>
                JS
              </div>
              <div>
                <h3 style={{ margin: '0' }}>John Smith</h3>
                <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>Online • user</p>
              </div>
            </div>
          </div>

          <div style={{ flexGrow: 1, padding: '20px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
              <div style={{ backgroundColor: '#f0f0f0', padding: '12px', borderRadius: '12px', maxWidth: '70%' }}>
                <p style={{ margin: '0' }}>Hi! I'm interested in the 2022 Honda Civic you have listed.</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#666' }}>10:30 AM</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
              <div style={{ backgroundColor: '#2196f3', color: 'white', padding: '12px', borderRadius: '12px', maxWidth: '70%' }}>
                <p style={{ margin: '0' }}>Hello! Yes, it's still available. Would you like to schedule a test drive?</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: '0.8' }}>10:35 AM</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
              <div style={{ backgroundColor: '#f0f0f0', padding: '12px', borderRadius: '12px', maxWidth: '70%' }}>
                <p style={{ margin: '0' }}>That would be great! What times do you have available this week?</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#666' }}>10:40 AM</p>
              </div>
            </div>
          </div>

          <div style={{ padding: '20px', borderTop: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Type a message..." 
                style={{ flexGrow: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <button style={{ padding: '12px 20px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BookingsPage = () => {
  const bookings = [
    { id: 1, customer: 'John Smith', service: 'Oil Change', vehicle: '2020 Honda Civic', date: '2024-01-25', time: '10:00 AM', status: 'confirmed', price: '$45', type: 'maintenance' },
    { id: 2, customer: 'Sarah Johnson', service: 'Premium Car Wash', vehicle: '2019 BMW X5', date: '2024-01-26', time: '2:00 PM', status: 'pending', price: '$35', type: 'wash' },
    { id: 3, customer: 'Mike Chen', service: 'Brake Inspection', vehicle: '2021 Toyota Camry', date: '2024-01-24', time: '9:00 AM', status: 'completed', price: '$80', type: 'maintenance' },
    { id: 4, customer: 'Lisa Davis', service: 'Full Detail', vehicle: '2022 Mercedes C-Class', date: '2024-01-23', time: '11:00 AM', status: 'cancelled', price: '$120', type: 'wash' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#4caf50';
      case 'pending': return '#ff9800';
      case 'completed': return '#2196f3';
      case 'cancelled': return '#f44336';
      default: return '#666';
    }
  };

  return (
    <div style={{ padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Service Bookings</h1>
        <button style={{ padding: '12px 24px', backgroundColor: '#2c2c2c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          ➕ New Booking
        </button>
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0' }}>
          <button style={{ padding: '15px 30px', backgroundColor: 'transparent', border: 'none', borderBottom: '2px solid #2196f3', cursor: 'pointer', fontWeight: 'bold' }}>
            All ({bookings.length})
          </button>
          <button style={{ padding: '15px 30px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
            Pending ({bookings.filter(b => b.status === 'pending').length})
          </button>
          <button style={{ padding: '15px 30px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
            Confirmed ({bookings.filter(b => b.status === 'confirmed').length})
          </button>
          <button style={{ padding: '15px 30px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
            Completed ({bookings.filter(b => b.status === 'completed').length})
          </button>
        </div>
      </div>

      {/* Bookings List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {bookings.map((booking) => (
          <div key={booking.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ 
                  backgroundColor: booking.type === 'wash' ? '#2196f3' : '#ff9800', 
                  color: 'white', 
                  padding: '10px', 
                  borderRadius: '50%', 
                  marginRight: '15px' 
                }}>
                  {booking.type === 'wash' ? '🚿' : '🔧'}
                </span>
                <div>
                  <h3 style={{ margin: '0', fontSize: '1.2rem' }}>{booking.service}</h3>
                  <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>{booking.customer} • {booking.vehicle}</p>
                </div>
              </div>
              <span style={{ 
                backgroundColor: getStatusColor(booking.status), 
                color: 'white', 
                padding: '4px 12px', 
                borderRadius: '4px', 
                fontSize: '0.8rem',
                textTransform: 'capitalize'
              }}>
                {booking.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '15px' }}>
              <div>
                <strong>Date:</strong> {new Date(booking.date).toLocaleDateString()}
              </div>
              <div>
                <strong>Time:</strong> {booking.time}
              </div>
              <div>
                <strong>Price:</strong> {booking.price}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#2196f3', border: '1px solid #2196f3', borderRadius: '4px', cursor: 'pointer' }}>
                👁️ View Details
              </button>
              {booking.status === 'pending' && (
                <>
                  <button style={{ padding: '8px 16px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    ✅ Confirm
                  </button>
                  <button style={{ padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    ❌ Cancel
                  </button>
                </>
              )}
              {booking.status === 'confirmed' && (
                <button style={{ padding: '8px 16px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  ✏️ Reschedule
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const UserDashboard = () => (
  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
    <h1>User Dashboard</h1>
    <p>Welcome to your personal dashboard!</p>
  </div>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  
  return (
    <div style={{ padding: '40px 20px' }}>
      <h1>Admin Dashboard</h1>
      <p>Welcome back, {user?.firstName} {user?.lastName}</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '30px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>👥 Total Users</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c2c2c' }}>1,247</p>
          <p style={{ color: '#4caf50' }}>+12% this month</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>🚗 Vehicle Listings</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c2c2c' }}>856</p>
          <p style={{ color: '#4caf50' }}>+8% this month</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>📅 Active Bookings</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c2c2c' }}>342</p>
          <p style={{ color: '#ff5722' }}>-3% this month</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>💬 Live Conversations</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c2c2c' }}>23</p>
          <p style={{ color: '#4caf50' }}>+15% this month</p>
        </div>
      </div>
      
      <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>System Performance</h3>
          <div style={{ marginTop: '20px' }}>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Server Load</span>
                <span>68%</span>
              </div>
              <div style={{ backgroundColor: '#f0f0f0', height: '8px', borderRadius: '4px' }}>
                <div style={{ backgroundColor: '#2196f3', height: '100%', width: '68%', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Memory Usage</span>
                <span>72%</span>
              </div>
              <div style={{ backgroundColor: '#f0f0f0', height: '8px', borderRadius: '4px' }}>
                <div style={{ backgroundColor: '#ff9800', height: '100%', width: '72%', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>Recent Activity</h3>
          <div style={{ marginTop: '20px' }}>
            <div style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
              <p style={{ margin: '0', fontWeight: 'bold' }}>New user registered</p>
              <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>john.doe@email.com - 5 minutes ago</p>
            </div>
            <div style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
              <p style={{ margin: '0', fontWeight: 'bold' }}>Vehicle listed</p>
              <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>2023 Toyota Camry - 10 minutes ago</p>
            </div>
            <div style={{ padding: '10px 0' }}>
              <p style={{ margin: '0', fontWeight: 'bold' }}>Service booking created</p>
              <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>Maintenance service - 15 minutes ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DealerDashboard = () => {
  const { user } = useAuth();
  
  return (
    <div style={{ padding: '40px 20px' }}>
      <h1>Dealer Dashboard</h1>
      <p>Manage your vehicle inventory and customer relationships</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '30px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>📦 Total Inventory</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c2c2c' }}>127</p>
          <p style={{ color: '#4caf50' }}>+5 this week</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>🚗 Monthly Sales</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c2c2c' }}>23</p>
          <p style={{ color: '#4caf50' }}>+12% vs last month</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>👥 Active Leads</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c2c2c' }}>45</p>
          <p style={{ color: '#4caf50' }}>8 new today</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>💰 Revenue (MTD)</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c2c2c' }}>$485K</p>
          <p style={{ color: '#4caf50' }}>+18% vs last month</p>
        </div>
      </div>
      
      <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>Recent Customer Inquiries</h3>
          <div style={{ marginTop: '20px' }}>
            <div style={{ padding: '15px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0', fontWeight: 'bold' }}>Alice Johnson</p>
                <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>Purchase Inquiry • 2022 Honda Accord</p>
                <p style={{ margin: '0', color: '#2196f3', fontSize: '0.9rem' }}>2 hours ago</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ backgroundColor: '#2196f3', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>New</span>
                <span style={{ backgroundColor: '#ff5722', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>High</span>
              </div>
            </div>
            <div style={{ padding: '15px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0', fontWeight: 'bold' }}>Bob Smith</p>
                <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>Test Drive Request • 2021 Toyota Camry</p>
                <p style={{ margin: '0', color: '#2196f3', fontSize: '0.9rem' }}>4 hours ago</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ backgroundColor: '#2196f3', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Scheduled</span>
                <span style={{ backgroundColor: '#ff9800', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Medium</span>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>Quick Actions</h3>
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button style={{ padding: '12px', backgroundColor: '#2c2c2c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              ➕ Add New Vehicle
            </button>
            <button style={{ padding: '12px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              ✏️ Update Inventory
            </button>
            <button style={{ padding: '12px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              📊 View Analytics
            </button>
            <button style={{ padding: '12px', backgroundColor: 'transparent', color: '#2c2c2c', border: '1px solid #2c2c2c', borderRadius: '4px', cursor: 'pointer' }}>
              👁️ Manage Leads
            </button>
          </div>
          
          <div style={{ marginTop: '30px' }}>
            <h4>This Month's Performance</h4>
            <div style={{ marginTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Sales Target</span>
                <span>76%</span>
              </div>
              <div style={{ backgroundColor: '#f0f0f0', height: '8px', borderRadius: '4px' }}>
                <div style={{ backgroundColor: '#4caf50', height: '100%', width: '76%', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div style={{ marginTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Lead Conversion</span>
                <span>62%</span>
              </div>
              <div style={{ backgroundColor: '#f0f0f0', height: '8px', borderRadius: '4px' }}>
                <div style={{ backgroundColor: '#ff9800', height: '100%', width: '62%', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#ffc107', marginRight: '8px' }}>⭐</span>
              <span>Customer Rating: <strong>4.7/5</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ServiceProviderDashboard = () => {
  const { user } = useAuth();
  
  return (
    <div style={{ padding: '40px 20px' }}>
      <h1>Service Provider Dashboard</h1>
      <p>Manage your car wash and maintenance services</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '30px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>📅 Today's Bookings</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c2c2c' }}>12</p>
          <p style={{ color: '#4caf50' }}>3 in progress</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>💰 This Week Revenue</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c2c2c' }}>$2,850</p>
          <p style={{ color: '#4caf50' }}>+15% vs last week</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>⭐ Customer Rating</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c2c2c' }}>4.8</p>
          <p style={{ color: '#4caf50' }}>Based on 127 reviews</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>🔧 Active Services</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c2c2c' }}>23</p>
          <p style={{ color: '#4caf50' }}>Car wash & maintenance</p>
        </div>
      </div>
      
      <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>Your Services</h3>
          <div style={{ marginTop: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '2rem', marginRight: '15px' }}>🚿</span>
                <div>
                  <h4 style={{ margin: '0' }}>Car Wash Services</h4>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                    <span style={{ backgroundColor: '#2196f3', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>15 bookings</span>
                    <span style={{ backgroundColor: '#4caf50', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>$450</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginLeft: '55px' }}>
                <span style={{ border: '1px solid #ddd', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Basic Wash</span>
                <span style={{ border: '1px solid #ddd', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Premium Wash</span>
                <span style={{ border: '1px solid #ddd', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Full Detail</span>
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '2rem', marginRight: '15px' }}>🔧</span>
                <div>
                  <h4 style={{ margin: '0' }}>Maintenance Services</h4>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                    <span style={{ backgroundColor: '#2196f3', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>8 bookings</span>
                    <span style={{ backgroundColor: '#4caf50', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>$1,200</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginLeft: '55px' }}>
                <span style={{ border: '1px solid #ddd', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Oil Change</span>
                <span style={{ border: '1px solid #ddd', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Brake Service</span>
                <span style={{ border: '1px solid #ddd', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Diagnostics</span>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>Today's Appointments</h3>
          <div style={{ marginTop: '20px' }}>
            <div style={{ padding: '15px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ backgroundColor: '#ff9800', color: 'white', padding: '8px', borderRadius: '50%', marginRight: '15px' }}>🔧</span>
                <div>
                  <p style={{ margin: '0', fontWeight: 'bold' }}>John Smith</p>
                  <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>Oil Change • 2020 Honda Civic</p>
                  <p style={{ margin: '0', color: '#2196f3', fontSize: '0.9rem' }}>10:00 AM</p>
                </div>
              </div>
              <span style={{ backgroundColor: '#4caf50', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>In Progress</span>
            </div>
            
            <div style={{ padding: '15px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ backgroundColor: '#2196f3', color: 'white', padding: '8px', borderRadius: '50%', marginRight: '15px' }}>🚿</span>
                <div>
                  <p style={{ margin: '0', fontWeight: 'bold' }}>Sarah Johnson</p>
                  <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>Premium Car Wash • 2019 BMW X5</p>
                  <p style={{ margin: '0', color: '#2196f3', fontSize: '0.9rem' }}>11:30 AM</p>
                </div>
              </div>
              <span style={{ backgroundColor: '#ff9800', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Scheduled</span>
            </div>
            
            <div style={{ padding: '15px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ backgroundColor: '#ff9800', color: 'white', padding: '8px', borderRadius: '50%', marginRight: '15px' }}>🔧</span>
                <div>
                  <p style={{ margin: '0', fontWeight: 'bold' }}>Mike Chen</p>
                  <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>Brake Inspection • 2021 Toyota Camry</p>
                  <p style={{ margin: '0', color: '#2196f3', fontSize: '0.9rem' }}>2:00 PM</p>
                </div>
              </div>
              <span style={{ backgroundColor: '#ff9800', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Scheduled</span>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '40px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>Quick Actions</h3>
          <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <button style={{ padding: '15px', backgroundColor: '#2c2c2c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              📅 Manage Schedule
            </button>
            <button style={{ padding: '15px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              🚿 Add Wash Service
            </button>
            <button style={{ padding: '15px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              🔧 Add Maintenance
            </button>
            <button style={{ padding: '15px', backgroundColor: 'transparent', color: '#2c2c2c', border: '1px solid #2c2c2c', borderRadius: '4px', cursor: 'pointer' }}>
              💬 View Messages
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div style={{ padding: '40px 20px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <UserDashboard />;
  }

  return children;
};

// Navigation Component
function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="autosphere-nav">
      <div className="autosphere-nav-content">
        <Link to="/" className="autosphere-logo">
          AutoSphere
        </Link>
        
        <div className="autosphere-nav-links">
          <Link to="/" className="autosphere-nav-link">Home</Link>
          <Link to="/vehicles" className="autosphere-nav-link">Vehicles</Link>
          <Link to="/about" className="autosphere-nav-link">About</Link>
          <Link to="/contact" className="autosphere-nav-link">Contact</Link>
          
          {user ? (
            <>
              <Link to="/dashboard" className="autosphere-nav-link">Dashboard</Link>
              <Link to="/appointments" className="autosphere-nav-link">Appointments</Link>
              <Link to="/inventory" className="autosphere-nav-link">Inventory</Link>
              <Link to="/user-messages" className="autosphere-nav-link">Messages</Link>
              <Link to="/notifications" className="autosphere-nav-link">Notifications</Link>
              {user.role === 'admin' && (
                <Link to="/admin-dashboard" className="autosphere-nav-link">Admin</Link>
              )}
              <button 
                onClick={handleLogout}
                className="autosphere-nav-btn autosphere-nav-btn-logout"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="autosphere-nav-link">Login</Link>
              <Link to="/register" className="autosphere-nav-btn autosphere-nav-btn-register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navigation />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/vehicles" element={<VehiclesPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <UserDashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/appointments" 
                element={
                  <ProtectedRoute>
                    <UserAppointments />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/user-messages" 
                element={
                  <ProtectedRoute>
                    <UserMessages />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/notifications" 
                element={
                  <ProtectedRoute>
                    <UserNotifications />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/inventory" 
                element={
                  <ProtectedRoute>
                    <UserInventory />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/vehicle-insights" 
                element={
                  <ProtectedRoute>
                    <VehicleInsights />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <UserSettings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/book-service" 
                element={
                  <ProtectedRoute>
                    <BookService />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/messages" 
                element={
                  <ProtectedRoute>
                    <MessagesPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/bookings" 
                element={
                  <ProtectedRoute>
                    <BookingsPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Role-based Routes */}
              <Route 
                path="/admin-dashboard" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dealer-dashboard" 
                element={
                  <ProtectedRoute requiredRole="dealer">
                    <DealerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/service-provider-dashboard" 
                element={
                  <ProtectedRoute requiredRole="service-provider">
                    <ServiceProviderDashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;