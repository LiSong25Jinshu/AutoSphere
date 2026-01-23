import React, { useState } from "react";
import { requestAppointment } from "../../services/appointmentService";
import { useNavigate } from "react-router-dom";
import "./BookService.css";

function BookService() {
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!serviceType || !date || !time) {
      alert("Please fill in all required fields!");
      return;
    }

    const response = requestAppointment({
      userId: "user123", // replace with dynamic user ID
      serviceType,
      date,
      time,
      notes,
    });

    alert(response.message);

    // Reset form
    setServiceType("");
    setDate("");
    setTime("");
    setNotes("");

    // Optional: redirect to appointments page
    navigate("/appointments");
  };

  return (
    <div className="book-service-page">
      <div className="book-service-card">
        <h1>Book a Service</h1>
        <p className="subtitle">
          Request maintenance, diagnostics, or other car services.
        </p>
        <form className="book-service-form" onSubmit={handleSubmit}>
          <label>
            Service Type <span className="required">*</span>
            <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
              <option value="">-- Select Service --</option>
              <option value="Car Maintenance">Car Maintenance</option>
              <option value="Car Wash">Car Wash</option>
              <option value="Diagnostics">Diagnostics</option>
              <option value="Oil Change">Oil Change</option>
            </select>
          </label>

          <label>
            Date <span className="required">*</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          <label>
            Time <span className="required">*</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>

          <label>
            Additional Notes
            <textarea
              placeholder="Describe any issues or requests..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          <div className="form-buttons">
            <button type="submit" className="btn primary">Submit Request</button>
            <button type="button" className="btn secondary" onClick={() => navigate("/dashboard")}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookService;
