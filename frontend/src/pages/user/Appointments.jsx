import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Appointments.css';

const UserAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    // Mock data - replace with real API call
    setTimeout(() => {
      setAppointments([
        {
          id: 1,
          serviceType: 'Oil Change',
          provider: 'QuickFix Motors',
          date: '2024-01-25',
          time: '10:00 AM',
          status: 'confirmed',
          price: 45.00,
          address: '123 Service St, City, ST 12345',
          notes: 'Regular maintenance check'
        },
        {
          id: 2,
          serviceType: 'Brake Service',
          provider: 'AutoCare Plus',
          date: '2024-01-30',
          time: '2:00 PM',
          status: 'pending',
          price: 180.00,
          address: '456 Repair Ave, City, ST 12345',
          notes: 'Brake pads replacement needed'
        },
        {
          id: 3,
          serviceType: 'Car Wash',
          provider: 'Shine & Clean',
          date: '2024-01-15',
          time: '11:30 AM',
          status: 'completed',
          price: 25.00,
          address: '789 Wash Blvd, City, ST 12345',
          notes: 'Full exterior and interior cleaning'
        },
        {
          id: 4,
          serviceType: 'Tire Service',
          provider: 'Tire World',
          date: '2024-01-10',
          time: '9:00 AM',
          status: 'completed',
          price: 320.00,
          address: '321 Tire Lane, City, ST 12345',
          notes: 'All four tires replaced'
        },
        {
          id: 5,
          serviceType: 'AC Service',
          provider: 'Cool Air Auto',
          date: '2024-01-05',
          time: '3:30 PM',
          status: 'cancelled',
          price: 95.00,
          address: '654 Climate Dr, City, ST 12345',
          notes: 'AC not cooling properly'
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'all') return true;
    return appointment.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'status-confirmed';
      case 'pending': return 'status-pending';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  const handleCancelAppointment = (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: 'cancelled' }
            : apt
        )
      );
    }
  };

  const handleRescheduleAppointment = (appointmentId) => {
    // Navigate to reschedule page or open modal
    alert('Reschedule functionality coming soon!');
  };

  if (loading) {
    return (
      <div className="appointments-page">
        <div className="appointments-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading appointments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="appointments-page">
      <div className="appointments-container">
        <div className="appointments-header">
          <h1>My Appointments</h1>
          <p>Manage your service appointments and booking history</p>
          <button 
            className="btn primary"
            onClick={() => navigate('/book-service')}
          >
            Book New Service
          </button>
        </div>

        <div className="appointments-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({appointments.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({appointments.filter(a => a.status === 'pending').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'confirmed' ? 'active' : ''}`}
            onClick={() => setFilter('confirmed')}
          >
            Confirmed ({appointments.filter(a => a.status === 'confirmed').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({appointments.filter(a => a.status === 'completed').length})
          </button>
        </div>

        <div className="appointments-list">
          {filteredAppointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No appointments found</h3>
              <p>
                {filter === 'all' 
                  ? "You haven't booked any services yet."
                  : `No ${filter} appointments found.`
                }
              </p>
              <button 
                className="btn primary"
                onClick={() => navigate('/book-service')}
              >
                Book Your First Service
              </button>
            </div>
          ) : (
            filteredAppointments.map(appointment => (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-header">
                  <div className="appointment-service">
                    <h3>{appointment.serviceType}</h3>
                    <p className="provider">{appointment.provider}</p>
                  </div>
                  <span className={`appointment-status ${getStatusColor(appointment.status)}`}>
                    {appointment.status}
                  </span>
                </div>

                <div className="appointment-details">
                  <div className="detail-item">
                    <span className="detail-icon">📅</span>
                    <span className="detail-text">{appointment.date} at {appointment.time}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">📍</span>
                    <span className="detail-text">{appointment.address}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">💰</span>
                    <span className="detail-text">${appointment.price.toFixed(2)}</span>
                  </div>
                  {appointment.notes && (
                    <div className="detail-item">
                      <span className="detail-icon">📝</span>
                      <span className="detail-text">{appointment.notes}</span>
                    </div>
                  )}
                </div>

                <div className="appointment-actions">
                  {appointment.status === 'pending' && (
                    <>
                      <button 
                        className="btn secondary small"
                        onClick={() => handleRescheduleAppointment(appointment.id)}
                      >
                        Reschedule
                      </button>
                      <button 
                        className="btn danger small"
                        onClick={() => handleCancelAppointment(appointment.id)}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {appointment.status === 'confirmed' && (
                    <>
                      <button 
                        className="btn secondary small"
                        onClick={() => handleRescheduleAppointment(appointment.id)}
                      >
                        Reschedule
                      </button>
                      <button 
                        className="btn danger small"
                        onClick={() => handleCancelAppointment(appointment.id)}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {appointment.status === 'completed' && (
                    <button className="btn primary small">
                      Leave Review
                    </button>
                  )}
                  <button className="btn secondary small">
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {filteredAppointments.length > 0 && (
          <div className="appointments-summary">
            <div className="summary-card">
              <h3>Appointment Summary</h3>
              <div className="summary-stats">
                <div className="summary-stat">
                  <span className="stat-number">{appointments.filter(a => a.status === 'completed').length}</span>
                  <span className="stat-label">Completed</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-number">{appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length}</span>
                  <span className="stat-label">Upcoming</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-number">
                    ${appointments
                      .filter(a => a.status === 'completed')
                      .reduce((sum, a) => sum + a.price, 0)
                      .toFixed(0)}
                  </span>
                  <span className="stat-label">Total Spent</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAppointments;