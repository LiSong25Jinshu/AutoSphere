import { useState } from 'react';
import { appointmentService } from '../services/appointmentService';
import './ServiceBooking.css';

const ServiceBooking = ({ vehicleId, onBookingComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    serviceType: '',
    date: '',
    time: '',
    notes: '',
    priority: 'normal',
    vehicleId: vehicleId || null
  });
  const [errors, setErrors] = useState({});
  const [bookingResult, setBookingResult] = useState(null);

  const serviceTypes = [
    { value: 'oil_change', label: 'Oil Change', icon: '🛢️' },
    { value: 'brake_service', label: 'Brake Service', icon: '🛑' },
    { value: 'tire_service', label: 'Tire Service', icon: '🛞' },
    { value: 'engine_diagnostic', label: 'Engine Diagnostic', icon: '🔧' },
    { value: 'transmission_service', label: 'Transmission Service', icon: '⚙️' },
    { value: 'air_conditioning', label: 'Air Conditioning', icon: '❄️' },
    { value: 'battery_service', label: 'Battery Service', icon: '🔋' },
    { value: 'general_maintenance', label: 'General Maintenance', icon: '🔧' },
    { value: 'inspection', label: 'Vehicle Inspection', icon: '🔍' },
    { value: 'repair', label: 'Repair Service', icon: '🛠️' },
    { value: 'other', label: 'Other', icon: '📝' }
  ];

  const timeSlots = [
    { time: '08:00', label: '8:00 AM', available: true },
    { time: '08:30', label: '8:30 AM', available: true },
    { time: '09:00', label: '9:00 AM', available: true },
    { time: '09:30', label: '9:30 AM', available: true },
    { time: '10:00', label: '10:00 AM', available: true },
    { time: '10:30', label: '10:30 AM', available: true },
    { time: '11:00', label: '11:00 AM', available: true },
    { time: '11:30', label: '11:30 AM', available: true },
    { time: '13:00', label: '1:00 PM', available: true },
    { time: '13:30', label: '1:30 PM', available: true },
    { time: '14:00', label: '2:00 PM', available: true },
    { time: '14:30', label: '2:30 PM', available: true },
    { time: '15:00', label: '3:00 PM', available: true },
    { time: '15:30', label: '3:30 PM', available: true },
    { time: '16:00', label: '4:00 PM', available: true },
    { time: '16:30', label: '4:30 PM', available: true },
    { time: '17:00', label: '5:00 PM', available: true },
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low Priority' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High Priority' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.serviceType) {
        newErrors.serviceType = 'Please select a service type';
      }
    } else if (step === 2) {
      if (!formData.date) {
        newErrors.date = 'Please select a date';
      } else {
        const selectedDate = new Date(formData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
          newErrors.date = 'Please select a future date';
        }
      }
      if (!formData.time) {
        newErrors.time = 'Please select a time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setLoading(true);
    try {
      const appointmentData = {
        serviceType: formData.serviceType,
        date: formData.date,
        time: formData.time,
        notes: formData.notes,
        priority: formData.priority,
        vehicleId: formData.vehicleId,
        serviceProviderId: 3 // Default to service provider from setup
      };

      const response = await appointmentService.requestAppointment(appointmentData);
      
      if (response.success) {
        setBookingResult(response.data);
        setCurrentStep(3);
        onBookingComplete?.(response.data);
      } else {
        setErrors({ submit: response.message || 'Failed to create appointment' });
      }
    } catch (error) {
      console.error('Booking error:', error);
      setErrors({ submit: 'Failed to create appointment. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
        <span className="step-number">1</span>
        <span className="step-label">Service Type</span>
      </div>
      <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
        <span className="step-number">2</span>
        <span className="step-label">Date & Time</span>
      </div>
      <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
        <span className="step-number">3</span>
        <span className="step-label">Confirmation</span>
      </div>
    </div>
  );

  const renderServiceTypeStep = () => (
    <div className="booking-step">
      <h3>Select Service Type</h3>
      <p>Choose the type of service you need for your vehicle.</p>
      
      <div className="service-types-grid">
        {serviceTypes.map(service => (
          <div
            key={service.value}
            className={`service-type-card ${formData.serviceType === service.value ? 'selected' : ''}`}
            onClick={() => handleInputChange('serviceType', service.value)}
          >
            <div className="service-icon">{service.icon}</div>
            <div className="service-label">{service.label}</div>
          </div>
        ))}
      </div>
      
      {errors.serviceType && (
        <div className="error-message">{errors.serviceType}</div>
      )}
      
      <div className="step-actions">
        <button 
          className="btn primary"
          onClick={handleNext}
          disabled={!formData.serviceType}
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderDateTimeStep = () => (
    <div className="booking-step">
      <h3>Select Date & Time</h3>
      <p>Choose when you'd like to schedule your service appointment.</p>
      
      <div className="form-grid">
        <div className="form-group">
          <label>Preferred Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            min={getMinDate()}
            className={`form-input ${errors.date ? 'error' : ''}`}
          />
          {errors.date && <div className="error-message">{errors.date}</div>}
        </div>

        <div className="form-group">
          <label>Preferred Time</label>
          <div className="time-slots">
            {timeSlots.map(slot => (
              <button
                key={slot.time}
                type="button"
                className={`time-slot ${formData.time === slot.time ? 'selected' : ''} ${!slot.available ? 'unavailable' : ''}`}
                onClick={() => slot.available && handleInputChange('time', slot.time)}
                disabled={!slot.available}
                title={slot.available ? `Select ${slot.label}` : 'Not available'}
              >
                {slot.label}
              </button>
            ))}
          </div>
          {errors.time && <div className="error-message">{errors.time}</div>}
        </div>

        <div className="form-group">
          <label>Priority Level</label>
          <select
            value={formData.priority}
            onChange={(e) => handleInputChange('priority', e.target.value)}
            className="form-input"
          >
            {priorityLevels.map(priority => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group full-width">
          <label>Additional Notes (Optional)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Describe any specific issues or requirements..."
            className="form-input"
            rows="3"
          />
        </div>
      </div>

      {errors.submit && (
        <div className="error-message">{errors.submit}</div>
      )}
      
      <div className="step-actions">
        <button className="btn secondary" onClick={handleBack}>
          Back
        </button>
        <button 
          className="btn primary"
          onClick={handleSubmit}
          disabled={loading || !formData.date || !formData.time}
        >
          {loading ? 'Creating Appointment...' : 'Book Appointment'}
        </button>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="booking-step">
      <div className="confirmation-content">
        <div className="success-icon">✅</div>
        <h3>Appointment Booked Successfully!</h3>
        <p>Your service appointment has been scheduled.</p>
        
        {bookingResult && (
          <div className="booking-details">
            <div className="detail-row">
              <span className="label">Confirmation Number:</span>
              <span className="value">AS-{bookingResult.id.toString().padStart(6, '0')}</span>
            </div>
            <div className="detail-row">
              <span className="label">Service Type:</span>
              <span className="value">
                {serviceTypes.find(s => s.value === formData.serviceType)?.label}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Date & Time:</span>
              <span className="value">
                {new Date(formData.date).toLocaleDateString()} at {formData.time}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Priority:</span>
              <span className="value">
                {priorityLevels.find(p => p.value === formData.priority)?.label}
              </span>
            </div>
            {formData.notes && (
              <div className="detail-row">
                <span className="label">Notes:</span>
                <span className="value">{formData.notes}</span>
              </div>
            )}
          </div>
        )}
        
        <div className="confirmation-actions">
          <button 
            className="btn primary"
            onClick={() => window.location.href = '/appointments'}
          >
            View My Appointments
          </button>
          <button 
            className="btn secondary"
            onClick={() => {
              setCurrentStep(1);
              setFormData({
                serviceType: '',
                date: '',
                time: '',
                notes: '',
                priority: 'normal',
                vehicleId: vehicleId || null
              });
              setBookingResult(null);
              setErrors({});
            }}
          >
            Book Another Service
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="service-booking">
      <div className="booking-container">
        <div className="booking-header">
          <h2>Book a Service</h2>
          <p>Schedule your vehicle service appointment in just a few steps.</p>
        </div>

        {renderStepIndicator()}

        <div className="booking-content">
          {currentStep === 1 && renderServiceTypeStep()}
          {currentStep === 2 && renderDateTimeStep()}
          {currentStep === 3 && renderConfirmationStep()}
        </div>
      </div>
    </div>
  );
};

export default ServiceBooking;