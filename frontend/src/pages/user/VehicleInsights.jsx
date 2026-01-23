import './VehicleInsights.css';

const VehicleInsights = () => {
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

  return (
    <div className="vehicle-insights-page">
      <div className="insights-container">
        <div className="insights-header">
          <h1>Vehicle Insights</h1>
          <p className="subtitle">Overview of your car's health and performance</p>
        </div>

        <div className="insights-grid">
          <div className="insight-card">
            <div className="card-icon">📊</div>
            <h3>Mileage</h3>
            <p className="card-value">{vehicleData.mileage.toLocaleString()} miles</p>
          </div>

          <div className="insight-card">
            <div className="card-icon">⛽</div>
            <h3>Fuel Efficiency</h3>
            <p className="card-value">{vehicleData.fuelEfficiency} MPG</p>
          </div>

          <div className="insight-card">
            <div className="card-icon">🔧</div>
            <h3>Last Service</h3>
            <p className="card-value">{vehicleData.lastService}</p>
          </div>

          <div className="insight-card">
            <div className="card-icon">📅</div>
            <h3>Next Service</h3>
            <p className="card-value">{vehicleData.nextService}</p>
          </div>

          <div className="insight-card">
            <div className="card-icon">🚗</div>
            <h3>Engine Status</h3>
            <p className="card-value status-good">{vehicleData.engineStatus}</p>
          </div>

          <div className="insight-card">
            <div className="card-icon">🔋</div>
            <h3>Battery Status</h3>
            <p className="card-value status-healthy">{vehicleData.batteryStatus}</p>
          </div>
        </div>

        {vehicleData.alerts.length > 0 && (
          <div className="alerts-section">
            <h2>🚨 Alerts & Recommendations</h2>
            <div className="alerts-list">
              {vehicleData.alerts.map((alert, index) => (
                <div key={index} className="alert-item">
                  <span className="alert-icon">⚠️</span>
                  <span className="alert-text">{alert}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleInsights;