import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Dashboard.css';

const ServiceProviderDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    todaysBookings: 0,
    weeklyRevenue: 0,
    customerRating: 0,
    activeServices: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Mock data - replace with real API calls
    setBookings([
      {
        id: 1,
        customerName: 'John Smith',
        serviceType: 'Oil Change',
        vehicle: '2020 Honda Civic',
        time: '10:00 AM',
        status: 'in_progress',
        price: '$45'
      },
      {
        id: 2,
        customerName: 'Sarah Johnson',
        serviceType: 'Premium Car Wash',
        vehicle: '2019 BMW X5',
        time: '11:30 AM',
        status: 'confirmed',
        price: '$35'
      },
      {
        id: 3,
        customerName: 'Mike Chen',
        serviceType: 'Brake Service',
        vehicle: '2021 Toyota Camry',
        time: '2:00 PM',
        status: 'pending',
        price: '$120'
      }
    ]);

    setStats({
      todaysBookings: 12,
      weeklyRevenue: 2850,
      customerRating: 4.8,
      activeServices: 23
    });
  };

  const quickActions = [
    {
      title: 'Manage Schedule',
      description: 'View and update availability',
      icon: '📅',
      className: 'primary',
      action: () => navigate('/service-provider/schedule')
    },
    {
      title: 'Add Service',
      description: 'Create new service offering',
      icon: '➕',
      className: 'secondary',
      action: () => navigate('/service-provider/services')
    },
    {
      title: 'View Messages',
      description: 'Chat with customers',
      icon: '💬',
      className: 'success',
      action: () => navigate('/service-provider/messages')
    },
    {
      title: 'View Bookings',
      description: 'Manage all appointments',
      icon: '📋',
      className: 'info',
      action: () => navigate('/service-provider/bookings')
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'confirmed';
      case 'pending': return 'pending';
      case 'in_progress': return 'in-progress';
      case 'completed': return 'completed';
      default: return 'pending';
    }
  };

  return (
    <div className="dashboard-container">
      {/* Welcome Header */}
      <div className="dashboard-header">
        <div className="dashboard-avatar">
          🔧
        </div>
        <div className="dashboard-welcome">
          <h1>Welcome back, {user?.firstName || 'Service Provider'}!</h1>
          <p>Manage your car wash and maintenance services</p>
        </div>
        <button 
          className="settings-btn"
          onClick={() => navigate('/service-provider/profile')}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Today's Bookings</h3>
              <div className="stat-number">{stats.todaysBookings}</div>
            </div>
            <div className="stat-icon primary">📅</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Weekly Revenue</h3>
              <div className="stat-number">${stats.weeklyRevenue.toLocaleString()}</div>
            </div>
            <div className="stat-icon success">💰</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Customer Rating</h3>
              <div className="stat-number">{stats.customerRating}</div>
            </div>
            <div className="stat-icon secondary">⭐</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Active Services</h3>
              <div className="stat-number">{stats.activeServices}</div>
            </div>
            <div className="stat-icon info">🔧</div>
          </div>
        </div>
      </div>

      <div className="dashboard-main">
        {/* Main Content */}
        <div>
          {/* Quick Actions */}
          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="actions-grid">
              {quickActions.map((action, index) => (
                <div 
                  key={index}
                  className="action-card"
                  onClick={action.action}
                >
                  <div className="action-header">
                    <span className={`action-icon ${action.className}`}>
                      {action.icon}
                    </span>
                    <h3>{action.title}</h3>
                  </div>
                  <p>{action.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="appointments-section">
            <div className="appointments-header">
              <h2>Today's Appointments</h2>
              <button 
                className="view-all-btn"
                onClick={() => navigate('/service-provider/bookings')}
              >
                View All
              </button>
            </div>
            
            {bookings.length > 0 ? (
              <ul className="appointments-list">
                {bookings.map((booking) => (
                  <li key={booking.id} className="appointment-item">
                    <div className="appointment-icon">
                      {booking.serviceType.includes('Wash') ? '🚿' : '🔧'}
                    </div>
                    <div className="appointment-details">
                      <h4>{booking.customerName} - {booking.serviceType}</h4>
                      <p>{booking.time} • {booking.vehicle} • {booking.price}</p>
                    </div>
                    <span className={`appointment-status ${getStatusColor(booking.status)}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-appointments">
                <p>No appointments scheduled for today</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="dashboard-sidebar">
          {/* Service Performance */}
          <div className="service-performance">
            <h2>Service Performance</h2>
            
            <div className="service-breakdown">
              <div className="service-item">
                <div className="service-item-header">
                  <span className="service-icon">🚿</span>
                  <span className="service-name">Car Wash</span>
                </div>
                <div className="service-stats">
                  <span className="service-count">15 bookings</span>
                  <span className="service-revenue">$450</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '65%' }}></div>
                </div>
              </div>

              <div className="service-item">
                <div className="service-item-header">
                  <span className="service-icon">🔧</span>
                  <span className="service-name">Maintenance</span>
                </div>
                <div className="service-stats">
                  <span className="service-count">8 bookings</span>
                  <span className="service-revenue">$1,200</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '35%' }}></div>
                </div>
              </div>
            </div>

            <button
              className="view-analytics-btn"
              onClick={() => navigate('/service-provider/services')}
            >
              View All Services
            </button>
          </div>

          {/* Business Summary */}
          <div className="business-summary">
            <h2>Business Summary</h2>
            <div className="summary-item">
              <span className="summary-label">Total Customers</span>
              <span className="summary-value">127</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Completed Services</span>
              <span className="summary-value">342</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Average Rating</span>
              <span className="summary-value">⭐ {stats.customerRating}/5.0</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Response Time</span>
              <span className="summary-value">~15 min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderDashboard;
