import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentService } from '../../services/appointmentService';
import './Appointments.css';

const MOCK_APPOINTMENTS = [
  {
    id: 1,
    serviceType: 'Oil Change',
    provider: 'QuickFix Motors',
    date: '2024-02-10',
    time: '10:00',
    status: 'confirmed',
    price: 45,
    address: '123 Service St, Detroit, MI 48201',
    notes: 'Standard oil change with filter replacement',
    priority: 'normal',
    confirmationNumber: 'AS-000001',
  },
  {
    id: 2,
    serviceType: 'Brake Inspection',
    provider: 'AutoCare Plus',
    date: '2024-02-15',
    time: '14:00',
    status: 'pending',
    price: 80,
    address: '456 Auto Ave, Detroit, MI 48202',
    notes: 'Front and rear brake check',
    priority: 'high',
    confirmationNumber: 'AS-000002',
  },
  {
    id: 3,
    serviceType: 'Full Detail',
    provider: 'Shine & Drive',
    date: '2024-01-20',
    time: '09:00',
    status: 'completed',
    price: 120,
    address: '789 Clean Blvd, Detroit, MI 48203',
    notes: 'Interior and exterior detailing',
    priority: 'normal',
    confirmationNumber: 'AS-000003',
  },
  {
    id: 4,
    serviceType: 'Tire Rotation',
    provider: 'QuickFix Motors',
    date: '2024-01-10',
    time: '11:00',
    status: 'completed',
    price: 35,
    address: '123 Service St, Detroit, MI 48201',
    notes: '',
    priority: 'normal',
    confirmationNumber: 'AS-000004',
  },
];

const UserAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await appointmentService.getUserAppointments();
      
      if (response.success) {
        const transformedAppointments = response.data.map(booking => ({
          id: booking.id,
          serviceType: booking.title,
          provider: booking.serviceProvider ? 
            `${booking.serviceProvider.firstName} ${booking.serviceProvider.lastName}` : 
            'AutoSphere Service',
          date: new Date(booking.scheduledDate).toISOString().split('T')[0],
          time: booking.scheduledTime,
          status: booking.status,
          price: booking.estimatedCost || booking.actualCost || 0,
          address: booking.location?.address || '123 Service St, City, ST 12345',
          notes: booking.customerNotes || booking.description,
          priority: booking.priority,
          confirmationNumber: `AS-${booking.id.toString().padStart(6, '0')}`,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
          originalBooking: booking
        }));
        
        setAppointments(transformedAppointments);
      } else {
        // Fall back to mock data
        setAppointments(MOCK_APPOINTMENTS);
      }
    } catch (error) {
      console.error('Fetch appointments error:', error);
      // Fall back to mock data silently
      setAppointments(MOCK_APPOINTMENTS);
    } finally {
      setLoading(false);
    }
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
      case 'in_progress': return 'status-in-progress';
      default: return 'status-pending';
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    const reason = prompt('Please provide a reason for cancellation (optional):');
    
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        const response = await appointmentService.cancelAppointment(appointmentId, reason);
        
        if (response.success) {
          // Update local state
          setAppointments(prev => 
            prev.map(apt => 
              apt.id === appointmentId 
                ? { ...apt, status: 'cancelled' }
                : apt
            )
          );
          alert('Appointment cancelled successfully!');
        } else {
          alert(response.message || 'Failed to cancel appointment');
        }
      } catch (error) {
        console.error('Cancel appointment error:', error);
        alert('Failed to cancel appointment. Please try again.');
      }
    }
  };

  const handleRescheduleAppointment = (appointmentId) => {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (appointment) {
      setRescheduleModal(appointmentId);
      setRescheduleData({
        date: appointment.date,
        time: appointment.time
      });
    }
  };

  const submitReschedule = async () => {
    if (!rescheduleData.date || !rescheduleData.time) {
      alert('Please select both date and time');
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(`${rescheduleData.date}T${rescheduleData.time}`);
    const now = new Date();
    if (selectedDate <= now) {
      alert('Please select a future date and time!');
      return;
    }

    try {
      const response = await appointmentService.rescheduleAppointment(
        rescheduleModal,
        rescheduleData.date,
        rescheduleData.time
      );

      if (response.success) {
        // Update local state
        setAppointments(prev => 
          prev.map(apt => 
            apt.id === rescheduleModal 
              ? { ...apt, date: rescheduleData.date, time: rescheduleData.time }
              : apt
          )
        );
        setRescheduleModal(null);
        setRescheduleData({ date: '', time: '' });
        alert('Appointment rescheduled successfully!');
      } else {
        alert(response.message || 'Failed to reschedule appointment');
      }
    } catch (error) {
      console.error('Reschedule appointment error:', error);
      alert('Failed to reschedule appointment. Please try again.');
    }
  };

  const handleViewDetails = (appointmentId) => {
    // Navigate to appointment details page or show modal
    navigate(`/appointments/${appointmentId}`);
  };

  const handleLeaveReview = async (appointmentId) => {
    const rating = prompt('Rate your experience (1-5 stars):');
    if (rating && rating >= 1 && rating <= 5) {
      const review = prompt('Leave a review (optional):');
      
      try {
        const response = await appointmentService.addReview(appointmentId, parseInt(rating), review);
        
        if (response.success) {
          alert('Thank you for your review!');
          fetchAppointments(); // Refresh to show updated data
        } else {
          alert(response.message || 'Failed to submit review');
        }
      } catch (error) {
        console.error('Add review error:', error);
        alert('Failed to submit review. Please try again.');
      }
    }
  };

  // Get minimum date for rescheduling (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
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
                    <p className="confirmation">Confirmation: {appointment.confirmationNumber}</p>
                  </div>
                  <div className="appointment-status-container">
                    <span className={`appointment-status ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                    {appointment.priority && appointment.priority !== 'normal' && (
                      <span className={`priority-badge priority-${appointment.priority}`}>
                        {appointment.priority}
                      </span>
                    )}
                  </div>
                </div>

                <div className="appointment-details">
                  <div className="detail-item">
                    <span className="detail-icon">📅</span>
                    <span className="detail-text">
                      {new Date(appointment.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })} at {appointment.time}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">📍</span>
                    <span className="detail-text">{appointment.address}</span>
                  </div>
                  {appointment.price > 0 && (
                    <div className="detail-item">
                      <span className="detail-icon">💰</span>
                      <span className="detail-text">${appointment.price.toFixed(2)}</span>
                    </div>
                  )}
                  {appointment.notes && (
                    <div className="detail-item">
                      <span className="detail-icon">📝</span>
                      <span className="detail-text">{appointment.notes}</span>
                    </div>
                  )}
                </div>

                <div className="appointment-actions">
                  {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
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
                    <button 
                      className="btn primary small"
                      onClick={() => handleLeaveReview(appointment.id)}
                    >
                      Leave Review
                    </button>
                  )}
                  <button 
                    className="btn secondary small"
                    onClick={() => handleViewDetails(appointment.id)}
                  >
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
                  <span className="stat-number">{appointments.filter(a => ['confirmed', 'pending', 'in_progress'].includes(a.status)).length}</span>
                  <span className="stat-label">Upcoming</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-number">
                    ${appointments
                      .filter(a => a.status === 'completed' && a.price > 0)
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

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div className="modal-overlay" onClick={() => setRescheduleModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reschedule Appointment</h3>
              <button 
                className="modal-close"
                onClick={() => setRescheduleModal(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>New Date</label>
                <input
                  type="date"
                  value={rescheduleData.date}
                  onChange={(e) => setRescheduleData(prev => ({ ...prev, date: e.target.value }))}
                  className="form-input"
                  min={getMinDate()}
                />
              </div>
              <div className="form-group">
                <label>New Time</label>
                <input
                  type="time"
                  value={rescheduleData.time}
                  onChange={(e) => setRescheduleData(prev => ({ ...prev, time: e.target.value }))}
                  className="form-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn secondary"
                onClick={() => setRescheduleModal(null)}
              >
                Cancel
              </button>
              <button 
                className="btn primary"
                onClick={submitReschedule}
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAppointments;