import { useState, useEffect } from "react";
import { appointmentService } from "../../services/appointmentService";
import "./Bookings.css";

const STATUS_COLORS = { pending: "status-pending", confirmed: "status-confirmed", in_progress: "status-inprogress", completed: "status-completed", cancelled: "status-cancelled" };

const ServiceProviderBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getUserAppointments();
      if (res.success && res.data?.length) {
        setBookings(res.data);
      } else {
        setBookings([
          { id: 1, title: "Oil Change", serviceType: "oil_change", scheduledDate: "2024-01-25", scheduledTime: "10:00", status: "confirmed", customerNotes: "Please use synthetic oil", user: { firstName: "John", lastName: "Smith", phone: "+1 555-0101" } },
          { id: 2, title: "Brake Service", serviceType: "brake_service", scheduledDate: "2024-01-25", scheduledTime: "14:00", status: "pending", customerNotes: "", user: { firstName: "Sarah", lastName: "Johnson", phone: "+1 555-0102" } },
          { id: 3, title: "Premium Car Wash", serviceType: "general_maintenance", scheduledDate: "2024-01-26", scheduledTime: "11:00", status: "in_progress", customerNotes: "Full detail please", user: { firstName: "Mike", lastName: "Chen", phone: "+1 555-0103" } },
          { id: 4, title: "Tire Rotation", serviceType: "tire_service", scheduledDate: "2024-01-24", scheduledTime: "09:00", status: "completed", customerNotes: "", user: { firstName: "Lisa", lastName: "Davis", phone: "+1 555-0104" } },
        ]);
      }
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setActionLoading(id + status);
    const res = await appointmentService.updateAppointmentStatus(id, status);
    if (res.success) {
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    }
    setActionLoading(null);
  };

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);
  const counts = bookings.reduce((acc, b) => { acc[b.status] = (acc[b.status] || 0) + 1; return acc; }, {});

  return (
    <div className="sp-bookings-page">
      <div className="spb-header">
        <div><h1>Appointments</h1><p>Manage your service bookings</p></div>
      </div>

      <div className="spb-stats">
        {[["pending","Pending","#ff9800"],["confirmed","Confirmed","#2196f3"],["in_progress","In Progress","#9c27b0"],["completed","Completed","#4caf50"]].map(([s, label, color]) => (
          <div key={s} className="spb-stat-card" style={{ borderTop: "4px solid " + color }}>
            <div className="spb-stat-num" style={{ color }}>{counts[s] || 0}</div>
            <div className="spb-stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="spb-filters">
        {["all","pending","confirmed","in_progress","completed","cancelled"].map((s) => (
          <button key={s} className={"spb-filter-btn" + (filter === s ? " active" : "")} onClick={() => setFilter(s)}>
            {s === "all" ? "All" : s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            {s !== "all" && counts[s] ? " (" + counts[s] + ")" : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spb-loading"><div className="spb-spinner"></div><p>Loading appointments...</p></div>
      ) : filtered.length === 0 ? (
        <div className="spb-empty"><div>📅</div><h3>No appointments found</h3></div>
      ) : (
        <div className="spb-list">
          {filtered.map((b) => (
            <div key={b.id} className="spb-card">
              <div className="spb-card-top">
                <div className="spb-card-info">
                  <h3>{b.title}</h3>
                  <p className="spb-customer">{b.user ? b.user.firstName + " " + b.user.lastName : "Customer"} {b.user?.phone ? "• " + b.user.phone : ""}</p>
                  <p className="spb-datetime">📅 {new Date(b.scheduledDate).toLocaleDateString()} at {b.scheduledTime}</p>
                  {b.customerNotes && <p className="spb-notes">📝 {b.customerNotes}</p>}
                </div>
                <span className={"spb-status " + (STATUS_COLORS[b.status] || "")}>{b.status.replace("_", " ")}</span>
              </div>
              <div className="spb-card-actions">
                {b.status === "pending" && (
                  <>
                    <button className="spb-btn confirm" disabled={actionLoading === b.id + "confirmed"} onClick={() => updateStatus(b.id, "confirmed")}>Confirm</button>
                    <button className="spb-btn cancel" disabled={actionLoading === b.id + "cancelled"} onClick={() => updateStatus(b.id, "cancelled")}>Cancel</button>
                  </>
                )}
                {b.status === "confirmed" && (
                  <button className="spb-btn inprogress" disabled={actionLoading === b.id + "in_progress"} onClick={() => updateStatus(b.id, "in_progress")}>Start Service</button>
                )}
                {b.status === "in_progress" && (
                  <button className="spb-btn complete" disabled={actionLoading === b.id + "completed"} onClick={() => updateStatus(b.id, "completed")}>Mark Complete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceProviderBookings;
