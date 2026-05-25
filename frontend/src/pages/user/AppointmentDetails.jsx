import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appointmentService } from '../../services/appointmentService';
import './AppointmentDetails.css';

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });

  useEffect(() => {
    fetchAppointmentDetails();
  }, [id]);

  const fetchAppointmentDetails = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await appointmentService.getAppointment(id);
      
      if (response.success) {
        // Transform booking data to appointment format
        const booking = response.data;
        const transformedAppointment = {
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
          rating: booking.rating,
          review: booking.review,
          originalBooking: booking
        };
        
        setAppointment(transformedAppointment);
      } else {
        setError(response.message || 'Failed to fetch appointment details');
      }
    } catch (error) {
      console.error('Fetch appointment details error:', error);
      setError('Failed to load appointment details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleCancelAppointment = async () => {
    const reason = prompt('Please provide a reason for cancellation (optional):');
    
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        const response = await appointmentService.cancelAppointment(appointment.id, reason);
        
        if (response.success) {
          setAppointment(prev => ({ ...prev, status: 'cancelled' }));
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

  const handleRescheduleAppointment = () => {
    setRescheduleData({
      date: appointment.date,
      time: appointment.time
    });
    setRescheduleModal(true);
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
        appointment.id,
        rescheduleData.date,
        rescheduleData.time
      );

      if (response.success) {
        setAppointment(prev => ({
          ...prev,
          date: rescheduleData.date,
          time: rescheduleData.time
        }));
        setRescheduleModal(false);
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

  const handleLeaveReview = async () => {
    const rating = prompt('Rate your experience (1-5 stars):');
    if (rating && rating >= 1 && rating <= 5) {
      const review = prompt('Leave a review (optional):');
      
      try {
        const response = await appointmentService.addReview(appointment.id, parseInt(rating), review);
        
        if (response.success) {
          setAppointment(prev => ({
            ...prev,
            rating: parseInt(rating),
            review: review
          }));
          alert('Thank you for your review!');
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
      <div className="appointment-details-page">
        <div className="appointment-details-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading appointment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="appointment-details-page">
        <div className="appointment-details-container">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Error Loading Appointment</h3>
            <p>{error}</p>
            <div className="error-actions">
              <button className="btn primary" onClick={fetchAppointmentDetails}>
                Try Again
              </button>
              <button className="btn secondary" onClick={() => navigate('/appointments')}>
                Back to Appointments
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="appointment-details-page">
        <div className="appointment-details-container">
          <div className="error-state">
            <div className="error-icon">📅</div>
            <h3>Appointment Not Found</h3>
            <p>The appointment you're looking for doesn't exist or has been removed.</p>
            <button className="btn primary" onClick={() => navigate('/appointments')}>
              Back to Appointments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="appointment-details-page">
      <div className="appointment-details-container">
        {/* Header */}
        <div className="appointment-details-header">
          <button className="back-button" onClick={() => navigate('/appointments')}>
            ← Back to Appointments
          </button>
          <div className="header-content">
            <h1>Appointment Details</h1>
            <div className="confirmation-info">
              <span className="confirmation-number">
                Confirmation: {appointment.confirmationNumber}
              </span>
              <span className={`appointment-status ${getStatusColor(appointment.status)}`}>
                {appointment.status}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="appointment-details-content">
          {/* Service Information */}
          <div className="details-section">
            <h2>Service Information</h2>
            <div className="service-info">
              <div className="service-header">
                <h3>{appointment.serviceType}</h3>
                <p className="provider">Service Provider: {appointment.provider}</p>
              </div>
              
              <div className="service-details">
                <div className="detail-row">
                  <span className="detail-label">Date & Time:</span>
                  <span className="detail-value">
                    {new Date(appointment.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })} at {appointment.time}
                  </span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{appointment.address}</span>
                </div>
                
                {appointment.price > 0 && (
                  <div className="detail-row">
                    <span className="detail-label">Price:</span>
                    <span className="detail-value">GH₵ {appointment.price.toFixed(2)}</span>
                  </div>
                )}
                
                {appointment.priority && appointment.priority !== 'normal' && (
                  <div className="detail-row">
                    <span className="detail-label">Priority:</span>
                    <span className={`priority-badge priority-${appointment.priority}`}>
                      {appointment.priority}
                    </span>
                  </div>
                )}
                
                <div className="detail-row">
                  <span className="detail-label">Created:</span>
                  <span className="detail-value">
                    {new Date(appointment.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="details-section">
              <h2>Additional Notes</h2>
              <div className="notes-content">
                <p>{appointment.notes}</p>
              </div>
            </div>
          )}

          {/* Review Section */}
          {appointment.status === 'completed' && (
            <div className="details-section">
              <h2>Service Review</h2>
              {appointment.rating ? (
                <div className="review-content">
                  <div className="rating">
                    <span className="rating-label">Rating:</span>
                    <div className="stars">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span 
                          key={star} 
                          className={`star ${star <= appointment.rating ? 'filled' : ''}`}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                  </div>
                  {appointment.review && (
                    <div className="review-text">
                      <span className="review-label">Review:</span>
                      <p>{appointment.review}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-review">
                  <p>No review submitted yet.</p>
                  <button className="btn primary" onClick={handleLeaveReview}>
                    Leave Review
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="details-section">
            <h2>Actions</h2>
            <div className="appointment-actions">
              {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                <>
                  <button 
                    className="btn secondary"
                    onClick={handleRescheduleAppointment}
                  >
                    Reschedule Appointment
                  </button>
                  <button 
                    className="btn danger"
                    onClick={handleCancelAppointment}
                  >
                    Cancel Appointment
                  </button>
                </>
              )}
              
              {appointment.status === 'completed' && !appointment.rating && (
                <button 
                  className="btn primary"
                  onClick={handleLeaveReview}
                >
                  Leave Review
                </button>
              )}
              
              <button 
                className="btn secondary"
                onClick={() => navigate('/book-service')}
              >
                Book Another Service
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div className="modal-overlay" onClick={() => setRescheduleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reschedule Appointment</h3>
              <button 
                className="modal-close"
                onClick={() => setRescheduleModal(false)}
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
                onClick={() => setRescheduleModal(false)}
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

export default AppointmentDetails;