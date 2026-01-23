import React from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { requestAppointment } from "../../services/appointmentService"; // ✅ import the service

function Dashboard({ role }) {
  const navigate = useNavigate();

  // Function to handle appointment request
  const handleRequestService = () => {
    const response = requestAppointment({
      userId: "user123", // Replace with dynamic user ID later
      date: "2026-01-12",
      time: "11:00 AM",
      serviceType: "Car Maintenance",
    });

    alert(response.message); // Show feedback to the user
  };

  return (
    <div className="dash-container">
      <h1 className="dash-title">Welcome, {role}</h1>

      <div className="dash-grid">

        {/* ================= CUSTOMER ================= */}
        {role === "customer" && (
          <>
            <div className="dash-card" onClick={() => navigate("/book-service")}>
              <h2>Book a Service</h2>
              <p>Request diagnostics, repairs, or maintenance.</p>
              <button className="btn primary"> Request Service </button>
            </div>

            <div className="dash-card" onClick={() => navigate("/messages")}>
              <h2>Messages</h2>
              <p>Chat with dealers & service providers.</p>
              <button className="btn secondary">Open Messages</button>
            </div>

            <div className="dash-card" onClick={() => navigate("/vehicle-insights")}>
              <h2>Vehicle Insights</h2>
              <p>View mileage, performance, and reports.</p>
              <button className="btn primary">View Insights</button>
            </div>

            <div className="dash-card" onClick={() => navigate("/profile")}>
              <h2>Profile</h2>
              <p>Edit your personal information.</p>
              <button className="btn secondary">Go to Profile</button>
            </div>

            <div className="dash-card" onClick={() => navigate("/ai-car-finder")}>
              <h2>AI Car Finder</h2>
              <p>Find the perfect car using AI-powered recommendations.</p>
              <button className="btn primary">Open AI Car Finder</button>
            </div>
          </>
        )}

        {/* ================= DEALER, SERVICE PROVIDER, ADMIN ================= */}
        {/* Keep these sections unchanged */}
      </div>
    </div>
  );
}

export default Dashboard;
