import React from "react";
import "./VehicleInsights.css";

// Sample data for demonstration
const vehicleData = {
  mileage: 12450, // in miles
  fuelEfficiency: 28, // mpg
  lastService: "2025-12-01",
  nextService: "2026-03-01",
  engineStatus: "Good",
  batteryStatus: "Healthy",
  alerts: ["Oil change due soon", "Tire rotation recommended"],
};

function VehicleInsights() {
  return (
    <div className="vehicle-insights-page">
      <h1>Vehicle Insights</h1>
      <p className="subtitle">Overview of your car’s health and performance</p>

      <div className="insights-grid">
        <div className="insight-card">
          <h3>Mileage</h3>
          <p>{vehicleData.mileage.toLocaleString()} miles</p>
        </div>

        <div className="insight-card">
          <h3>Fuel Efficiency</h3>
          <p>{vehicleData.fuelEfficiency} MPG</p>
        </div>

        <div className="insight-card">
          <h3>Last Service</h3>
          <p>{vehicleData.lastService}</p>
        </div>

        <div className="insight-card">
          <h3>Next Service</h3>
          <p>{vehicleData.nextService}</p>
        </div>

        <div className="insight-card">
          <h3>Engine Status</h3>
          <p>{vehicleData.engineStatus}</p>
        </div>

        <div className="insight-card">
          <h3>Battery Status</h3>
          <p>{vehicleData.batteryStatus}</p>
        </div>
      </div>

      {vehicleData.alerts.length > 0 && (
        <div className="alerts-section">
          <h2>Alerts</h2>
          <ul>
            {vehicleData.alerts.map((alert, index) => (
              <li key={index}>{alert}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default VehicleInsights;
