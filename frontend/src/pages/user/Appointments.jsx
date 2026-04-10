import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentService } from '../../services/appointmentService';
import './Appointments.css';

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
        const transformed = response.data.map(booking => ({
          id: booking.id,
          serviceType: booking.serviceType || booking.title || 'Service',
          provider: booking.serviceProvider
            ? `${booking.serviceProvider.firstName} ${booking.serviceProvider.lastName}`
            : 'AutoSphere Service',
          date: new Date(booking.scheduledDate).toISOString().split('T')[0],
          time: booking.scheduledTime,
          status: booking.status,
          price: booking.actualCost || booking.estimatedCost || 0,
          address: booking.location?.address || '',
          notes: booking.customerNotes || booking.description || '',
          priority: booking.priority || 'normal',
          confirmationNumber: `AS-${String(booking.id).padStart(6, '0')}`,
          rating: booking.rating,
          review: booking.review,
        }));
        setAppointments(transformed);
      } else {
        setError(response.message || 'Failed to load appointments');
      }
    } catch (err) {
      console.error('Fetch appointments error:', err);
      setError('Failed to load appointments. Please try again.');
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
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const response = await appointmentService.cancelAppointment(appointmentId);
      if (response.success) {
        setAppointments(prev =>
          prev.map(apt => apt.id === appointmentId ? { ...apt, status: 'cancelled' } : apt)
        );
      } else {
        setError(response.message || 'Failed to cancel appointment');
      }
    } catch (err) {
      setError('Failed to cancel appointment. Please try again.');
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
      setError('Please select both date and time');
      return;
    }
    const selectedDate = new Date(`${rescheduleData.date}T${rescheduleData.time}`);
    if (selectedDate <= new Date()) {
      setError('Please select a future date and time');
      return;
    }
    try {
      const response = await appointmentService.rescheduleAppointment(
        rescheduleModal, rescheduleData.date, rescheduleData.time
      );
      if (response.success) {
        setAppointments(prev =>
          prev.map(apt =>
            apt.id === rescheduleModal
              ? { ...apt, date: rescheduleData.date, time: rescheduleData.time }
              : apt
          )
        );
        setRescheduleModal(null);
        setRescheduleData({ date: '', time: '' });
      } else {
        setError(response.message || 'Failed to reschedule appointment');
      }
    } catch (err) {
      setError('Failed to reschedule appointment. Please try again.');
    }
  };

  const handleViewDetails = (appointmentId) => {
    // Navigate to appointment details page or show modal
    navigate(`/appointments/${appointmentId}`);
  };

  const handleLeaveReview = async (appointmentId) => {
    const rating = parseInt(prompt('Rate your experience (1-5 stars):') || '0');
    if (!rating || rating < 1 || rating > 5) return;
    const review = prompt('Leave a review (optional):') || '';
    try {
      const response = await appointmentService.addReview(appointmentId, rating, review);
      if (response.success) {
        fetchAppointments();
      } else {
        setError(response.message || 'Failed to submit review');
      }
    } catch (err) {
      setError('Failed to submit review. Please try again.');
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

  if (error) {
    return (
      <div className="appointments-page">
        <div className="appointments-container">
          <div className="loading-state">
            <p style={{ color: '#d32f2f' }}>{error}</p>
            <button className="btn primary" onClick={fetchAppointments} style={{ marginTop: '1rem' }}>
              Retry
            </button>
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