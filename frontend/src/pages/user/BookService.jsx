import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { appointmentService } from "../../services/appointmentService";
import "./BookService.css";

function BookService() {
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState("normal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const serviceOptions = [
    { value: "oil_change", label: "Oil Change", icon: "🛢️", description: "Regular oil and filter change" },
    { value: "brake_service", label: "Brake Service", icon: "🛑", description: "Brake inspection and repair" },
    { value: "tire_service", label: "Tire Service", icon: "🛞", description: "Tire rotation, balancing, replacement" },
    { value: "engine_diagnostic", label: "Engine Diagnostic", icon: "🔧", description: "Engine troubleshooting and diagnosis" },
    { value: "transmission_service", label: "Transmission Service", icon: "⚙️", description: "Transmission maintenance and repair" },
    { value: "air_conditioning", label: "Air Conditioning", icon: "❄️", description: "AC system service and repair" },
    { value: "battery_service", label: "Battery Service", icon: "🔋", description: "Battery testing and replacement" },
    { value: "general_maintenance", label: "General Maintenance", icon: "🔧", description: "Routine vehicle maintenance" },
    { value: "inspection", label: "Vehicle Inspection", icon: "🔍", description: "Comprehensive vehicle inspection" },
    { value: "repair", label: "Repair Service", icon: "🛠️", description: "General vehicle repairs" },
    { value: "other", label: "Other", icon: "📝", description: "Custom service request" }
  ];

  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", 
    "13:00", "14:00", "15:00", "16:00", "17:00"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!serviceType || !date || !time) {
      setError("Please fill in all required fields!");
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(`${date}T${time}`);
    const now = new Date();
    if (selectedDate <= now) {
      setError("Please select a future date and time!");
      return;
    }

    setLoading(true);

    try {
      const selectedService = serviceOptions.find(s => s.value === serviceType);
      
      // Create appointment data with detailed logging
      const appointmentData = {
        serviceType: serviceType,
        title: selectedService?.label || serviceType,
        description: selectedService?.description || notes,
        date,
        time,
        notes,
        priority,
        serviceProviderId: 3, // Default service provider from mock data
      };

      console.log('=== FRONTEND FORM DATA ===');
      console.log('Service Type:', serviceType);
      console.log('Date:', date);
      console.log('Time:', time);
      console.log('Selected Service:', selectedService);
      console.log('Final appointment data:', appointmentData);

      const response = await appointmentService.requestAppointment(appointmentData);

      console.log('=== SERVICE RESPONSE ===');
      console.log('Response:', response);

      if (response.success) {
        setSuccess("Appointment booked successfully! Redirecting to your appointments...");
        // Reset form
        setServiceType("");
        setDate("");
        setTime("");
        setNotes("");
        setPriority("normal");

        // Redirect to appointments page after a short delay
        setTimeout(() => {
          navigate("/appointments");
        }, 2000);
      } else {
        console.error('=== BOOKING FAILED ===');
        console.error('Full response:', response);
        
        let errorMessage = response.message || "Failed to book appointment. Please try again.";
        
        // If there are validation errors, show them
        if (response.error && response.error.errors) {
          console.error('Validation errors:', response.error.errors);
          const validationErrors = response.error.errors.map(err => `${err.path}: ${err.msg}`).join(', ');
          errorMessage = `Validation failed: ${validationErrors}`;
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error("=== BOOKING EXCEPTION ===");
      console.error("Error:", error);
      setError("Failed to book appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="book-service-page">
      <div className="book-service-card">
        <div className="service-header">
          <h1>Book a Service</h1>
          <p className="subtitle">
            Schedule your vehicle service appointment with our expert technicians.
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}
        
        <form className="book-service-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Service Type <span className="required">*</span>
            </label>
            <div className="service-options">
              {serviceOptions.map((service) => (
                <div
                  key={service.value}
                  className={`service-card ${serviceType === service.value ? 'selected' : ''}`}
                  onClick={() => setServiceType(service.value)}
                >
                  <div className="service-icon">{service.icon}</div>
                  <div className="service-label">{service.label}</div>
                  <div className="service-description">{service.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Preferred Date <span className="required">*</span>
              </label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="form-input"
                min={getMinDate()}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>
                Preferred Time <span className="required">*</span>
              </label>
              <div className="time-slots">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={`time-slot ${time === slot ? 'selected' : ''}`}
                    onClick={() => setTime(slot)}
                    disabled={loading}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Priority Level</label>
            <select 
              value={priority} 
              onChange={(e) => setPriority(e.target.value)}
              className="form-select"
              disabled={loading}
            >
              <option value="low">Low Priority</option>
              <option value="normal">Normal Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="form-group">
            <label>Additional Notes</label>
            <textarea
              placeholder="Describe any specific issues, symptoms, or special requests..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-textarea"
              rows="4"
              disabled={loading}
            />
          </div>

          <div className="form-buttons">
            <button 
              type="submit" 
              className="btn primary"
              disabled={loading || !serviceType || !date || !time}
            >
              {loading ? "Booking Appointment..." : "Book Appointment"}
            </button>
            <button 
              type="button" 
              className="btn secondary" 
              onClick={() => navigate("/appointments")}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookService;
