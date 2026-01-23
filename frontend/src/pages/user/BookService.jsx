import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestAppointment } from "../../services/appointmentService";
import "./BookService.css";

function BookService() {
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!serviceType || !date || !time) {
      alert("Please fill in all required fields!");
      return;
    }

    setLoading(true);

    try {
      const response = await requestAppointment({
        userId: "user123", // replace with dynamic user ID
        serviceType,
        date,
        time,
        notes,
      });

      alert(response.message || "Appointment booked successfully!");

      // Reset form
      setServiceType("");
      setDate("");
      setTime("");
      setNotes("");

      // Optional: redirect to appointments page
      navigate("/appointments");
    } catch (error) {
      alert("Failed to book appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="book-service-page">
      <div className="book-service-card">
        <div className="service-header">
          <h1>Book a Service</h1>
          <p className="subtitle">
            Request maintenance, diagnostics, or other car services.
          </p>
        </div>
        
        <form className="book-service-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Service Type <span className="required">*</span>
            </label>
            <select 
              value={serviceType} 
              onChange={(e) => setServiceType(e.target.value)}
              className="form-select"
            >
              <option value="">-- Select Service --</option>
              <option value="Car Maintenance">Car Maintenance</option>
              <option value="Car Wash">Car Wash</option>
              <option value="Diagnostics">Diagnostics</option>
              <option value="Oil Change">Oil Change</option>
              <option value="Brake Service">Brake Service</option>
              <option value="Tire Service">Tire Service</option>
              <option value="Battery Service">Battery Service</option>
              <option value="AC Service">AC Service</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Date <span className="required">*</span>
              </label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="form-input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label>
                Time <span className="required">*</span>
              </label>
              <input 
                type="time" 
                value={time} 
                onChange={(e) => setTime(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Additional Notes</label>
            <textarea
              placeholder="Describe any issues or requests..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-textarea"
              rows="4"
            />
          </div>

          <div className="form-buttons">
            <button 
              type="submit" 
              className="btn primary"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
            <button 
              type="button" 
              className="btn secondary" 
              onClick={() => navigate("/dashboard")}
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
