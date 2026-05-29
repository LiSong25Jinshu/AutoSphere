import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { appointmentService } from "../../services/appointmentService";
import { serviceAPI } from "../../services/api";
import { CURRENCY_SYMBOL, formatCost } from "../../utils/currency";
import StartChatButton from "../../components/StartChatButton";
import "./BookService.css";

// ─── Service catalogue ────────────────────────────────────────────────────────
const SERVICE_OPTIONS = [
  {
    value: "car_wash",
    label: "Car Wash",
    icon: "🚿",
    category: "Cleaning",
    description: "Exterior & interior wash, wax, detailing, and protective coating",
    duration: "30–90 min",
    priceHint: `From ${CURRENCY_SYMBOL}80`,
  },
  {
    value: "oil_change",
    label: "Oil Change",
    icon: "🛢️",
    category: "Maintenance",
    description: "Engine oil & filter replacement using manufacturer-recommended grade",
    duration: "30–45 min",
    priceHint: `From ${CURRENCY_SYMBOL}180`,
  },
  {
    value: "brake_service",
    label: "Brake Service",
    icon: "🛑",
    category: "Safety",
    description: "Brake pad/rotor inspection, replacement, and hydraulic fluid top-up",
    duration: "1–2 hrs",
    priceHint: `From ${CURRENCY_SYMBOL}400`,
  },
  {
    value: "tire_service",
    label: "Tire Service",
    icon: "🛞",
    category: "Maintenance",
    description: "Rotation, balancing, alignment check, puncture repair, or full replacement",
    duration: "45–90 min",
    priceHint: `From ${CURRENCY_SYMBOL}120`,
  },
  {
    value: "engine_diagnostic",
    label: "Engine Diagnostic",
    icon: "🔍",
    category: "Diagnostics",
    description: "OBD-II scan, fault-code analysis, and written diagnostic report",
    duration: "1–2 hrs",
    priceHint: `From ${CURRENCY_SYMBOL}300`,
  },
  {
    value: "transmission_service",
    label: "Transmission Service",
    icon: "⚙️",
    category: "Drivetrain",
    description: "Fluid flush, filter change, and transmission health inspection",
    duration: "1.5–3 hrs",
    priceHint: `From ${CURRENCY_SYMBOL}600`,
  },
  {
    value: "air_conditioning",
    label: "Air Conditioning",
    icon: "❄️",
    category: "Comfort",
    description: "Refrigerant recharge, leak test, compressor & cabin filter service",
    duration: "1–2 hrs",
    priceHint: `From ${CURRENCY_SYMBOL}350`,
  },
  {
    value: "battery_service",
    label: "Battery Service",
    icon: "🔋",
    category: "Electrical",
    description: "Load test, terminal cleaning, battery replacement & charging system check",
    duration: "30–60 min",
    priceHint: `From ${CURRENCY_SYMBOL}100`,
  },
  {
    value: "general_maintenance",
    label: "General Maintenance",
    icon: "🔧",
    category: "Maintenance",
    description: "Scheduled service per manufacturer intervals — fluids, filters, belts & more",
    duration: "1–3 hrs",
    priceHint: `From ${CURRENCY_SYMBOL}250`,
  },
  {
    value: "inspection",
    label: "Vehicle Inspection",
    icon: "📋",
    category: "Inspection",
    description: "Comprehensive 50-point safety & roadworthiness inspection with written report",
    duration: "1–1.5 hrs",
    priceHint: `From ${CURRENCY_SYMBOL}220`,
  },
  {
    value: "repair",
    label: "General Repair",
    icon: "🛠️",
    category: "Repair",
    description: "Mechanical or electrical fault diagnosis and repair — quote provided upfront",
    duration: "Varies",
    priceHint: "Quote on inspection",
  },
  {
    value: "Washing",
    label: "Washing service",
    icon: "🧼",
    category: "Cleaning",
    description: "Professional car washing and detailing services including exterior cleaning, interior vacuuming, polishing, and vehicle care packages",
    duration: "Varies",
    priceHint: "Quote on request",
  },
];

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

const STEPS = ["Service", "Provider", "Schedule", "Confirm"];

// ─── Component ────────────────────────────────────────────────────────────────
function BookService() {
  const navigate = useNavigate();

  // Step 1 — service selection
  const [serviceType, setServiceType] = useState("");

  // Step 2 — provider selection
  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState("");
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Step 3 — schedule
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  // Submission
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Active step (0-indexed)
  const [step, setStep] = useState(0);

  // ── Fetch providers whenever service type changes ──────────────────────────
  useEffect(() => {
    if (!serviceType) return;
    setProvidersLoading(true);
    setProvidersError("");
    setProviders([]);
    setSelectedProvider(null);

    serviceAPI
      .getProvidersByType(serviceType)
      .then((res) => {
        if (res.data.success) {
          setProviders(res.data.data);
          if (res.data.data.length === 0) {
            setProvidersError("No service providers are currently available for this service. Please try another service or check back later.");
          }
        }
      })
      .catch(() => {
        setProvidersError("Could not load service providers. Please try again.");
      })
      .finally(() => setProvidersLoading(false));
  }, [serviceType]);

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const canProceedFromStep = (s) => {
    if (s === 0) return !!serviceType;
    if (s === 1) return !!selectedProvider;
    if (s === 2) return !!date && !!time;
    return true;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError("");
    const selectedDate = new Date(`${date}T${time}`);
    if (selectedDate <= new Date()) {
      setError("Please select a future date and time.");
      return;
    }

    setLoading(true);
    try {
      const selectedService = SERVICE_OPTIONS.find((s) => s.value === serviceType);
      const appointmentData = {
        serviceType,
        title: selectedService?.label || serviceType,
        description: selectedService?.description || notes,
        date,
        time,
        notes,
        serviceProviderId: selectedProvider.id,
      };

      const response = await appointmentService.requestAppointment(appointmentData);

      if (response.success) {
        setSuccess("Appointment booked successfully! Redirecting to your appointments…");
        setTimeout(() => navigate("/appointments"), 2000);
      } else {
        setError(response.message || "Failed to book appointment. Please try again.");
      }
    } catch {
      setError("Failed to book appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => new Date().toISOString().split("T")[0];
  const selectedServiceObj = SERVICE_OPTIONS.find((s) => s.value === serviceType);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bs-page">
      <div className="bs-card">
        {/* Header */}
        <div className="bs-header">
          <h1>Book a Service</h1>
          <p>Schedule your vehicle service with a verified provider in a few steps.</p>
        </div>

        {/* Step indicator */}
        <div className="bs-steps">
          {STEPS.map((label, i) => (
            <div key={label} className={`bs-step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}>
              <div className="bs-step-circle">{i < step ? "✓" : i + 1}</div>
              <span className="bs-step-label">{label}</span>
              {i < STEPS.length - 1 && <div className="bs-step-line" />}
            </div>
          ))}
        </div>

        {/* Alerts */}
        {error && <div className="bs-alert error">{error}</div>}
        {success && <div className="bs-alert success">{success}</div>}

        {/* ── STEP 0: Choose service ── */}
        {step === 0 && (
          <div className="bs-section">
            <h2 className="bs-section-title">What service do you need?</h2>
            <div className="bs-service-grid">
              {SERVICE_OPTIONS.map((svc) => (
                <div
                  key={svc.value}
                  className={`bs-service-card ${serviceType === svc.value ? "selected" : ""}`}
                  onClick={() => setServiceType(svc.value)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setServiceType(svc.value)}
                >
                  <div className="bs-svc-top">
                    <span className="bs-svc-icon">{svc.icon}</span>
                    <span className="bs-svc-category">{svc.category}</span>
                  </div>
                  <div className="bs-svc-name">{svc.label}</div>
                  <div className="bs-svc-desc">{svc.description}</div>
                  <div className="bs-svc-meta">
                    <span>⏱ {svc.duration}</span>
                    <span>{svc.priceHint}</span>
                  </div>
                  {serviceType === svc.value && (
                    <div className="bs-svc-check">✓ Selected</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 1: Choose provider ── */}
        {step === 1 && (
          <div className="bs-section">
            <h2 className="bs-section-title">
              Available providers for{" "}
              <span className="bs-highlight">{selectedServiceObj?.label}</span>
            </h2>

            {providersLoading && (
              <div className="bs-loading">
                <div className="bs-spinner" />
                <p>Finding providers near you…</p>
              </div>
            )}

            {!providersLoading && providersError && (
              <div className="bs-provider-empty">
                <span className="bs-empty-icon">🔍</span>
                <p>{providersError}</p>
                <button className="bs-btn secondary" onClick={goBack}>
                  Choose a Different Service
                </button>
              </div>
            )}

            {!providersLoading && !providersError && providers.length > 0 && (
              <div className="bs-provider-list">
                {providers.map((prov) => (
                  <div
                    key={prov.id}
                    className={`bs-provider-card ${selectedProvider?.id === prov.id ? "selected" : ""}`}
                    onClick={() => setSelectedProvider(prov)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedProvider(prov)}
                  >
                    <div className="bs-prov-avatar">
                      {prov.firstName[0]}{prov.lastName[0]}
                    </div>
                    <div className="bs-prov-info">
                      <div className="bs-prov-name">
                        {prov.firstName} {prov.lastName}
                        {selectedProvider?.id === prov.id && (
                          <span className="bs-prov-selected-badge">✓ Selected</span>
                        )}
                      </div>
                      {prov.phone && (
                        <div className="bs-prov-contact">📞 {prov.phone}</div>
                      )}
                      <div className="bs-prov-services">
                        {prov.services.map((s) => (
                          <span key={s.id} className="bs-service-tag">
                            {s.name}
                            {s.price > 0 && (
                              <span className="bs-service-tag-price"> · {CURRENCY_SYMBOL}{s.price}</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="bs-prov-duration">
                      {prov.services[0] && (
                        <>
                          <div className="bs-prov-price">
                            {CURRENCY_SYMBOL}{Math.min(...prov.services.map((s) => s.price))}
                            {prov.services.length > 1 && "+"}
                          </div>
                          <div className="bs-prov-dur-label">starting from</div>
                        </>
                      )}
                      <StartChatButton
                        userId={prov.id}
                        userName={`${prov.firstName} ${prov.lastName}`}
                        label="Message"
                        variant="ghost"
                        size="sm"
                        className="bs-prov-msg-btn"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Schedule ── */}
        {step === 2 && (
          <div className="bs-section">
            <h2 className="bs-section-title">Pick a date & time</h2>

            {/* Summary bar */}
            <div className="bs-summary-bar">
              <div className="bs-summary-item">
                <span className="bs-summary-label">Service</span>
                <span className="bs-summary-value">
                  {selectedServiceObj?.icon} {selectedServiceObj?.label}
                </span>
              </div>
              <div className="bs-summary-divider" />
              <div className="bs-summary-item">
                <span className="bs-summary-label">Provider</span>
                <span className="bs-summary-value">
                  {selectedProvider?.firstName} {selectedProvider?.lastName}
                </span>
              </div>
            </div>

            <div className="bs-schedule-grid">
              <div className="bs-form-group">
                <label className="bs-label">
                  Preferred Date <span className="bs-required">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bs-input"
                  min={getMinDate()}
                />
              </div>

              <div className="bs-form-group">
                <label className="bs-label">
                  Preferred Time <span className="bs-required">*</span>
                </label>
                <div className="bs-time-grid">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`bs-time-btn ${time === slot ? "selected" : ""}`}
                      onClick={() => setTime(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bs-form-group" style={{ marginTop: "1.5rem" }}>
              <label className="bs-label">Additional Notes</label>
              <textarea
                className="bs-textarea"
                rows={4}
                placeholder="Describe any specific issues, symptoms, or special requests…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── STEP 3: Confirm ── */}
        {step === 3 && (
          <div className="bs-section">
            <h2 className="bs-section-title">Confirm your booking</h2>
            <div className="bs-confirm-card">
              <div className="bs-confirm-row">
                <span className="bs-confirm-label">Service</span>
                <span className="bs-confirm-value">
                  {selectedServiceObj?.icon} {selectedServiceObj?.label}
                </span>
              </div>
              <div className="bs-confirm-row">
                <span className="bs-confirm-label">Provider</span>
                <span className="bs-confirm-value">
                  {selectedProvider?.firstName} {selectedProvider?.lastName}
                </span>
              </div>
              {selectedProvider?.phone && (
                <div className="bs-confirm-row">
                  <span className="bs-confirm-label">Contact</span>
                  <span className="bs-confirm-value">{selectedProvider.phone}</span>
                </div>
              )}
              <div className="bs-confirm-row">
                <span className="bs-confirm-label">Date</span>
                <span className="bs-confirm-value">
                  {date ? new Date(date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "—"}
                </span>
              </div>
              <div className="bs-confirm-row">
                <span className="bs-confirm-label">Time</span>
                <span className="bs-confirm-value">{time || "—"}</span>
              </div>
              {notes && (
                <div className="bs-confirm-row">
                  <span className="bs-confirm-label">Notes</span>
                  <span className="bs-confirm-value">{notes}</span>
                </div>
              )}
            </div>
            <p className="bs-confirm-note">
              By confirming, you agree to the appointment terms. The provider will contact you to confirm availability.
            </p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="bs-nav">
          {step > 0 && (
            <button className="bs-btn secondary" onClick={goBack} disabled={loading}>
              ← Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < STEPS.length - 1 ? (
            <button
              className="bs-btn primary"
              onClick={goNext}
              disabled={!canProceedFromStep(step) || (step === 1 && providersLoading)}
            >
              Continue →
            </button>
          ) : (
            <button
              className="bs-btn primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Booking…" : "Confirm Booking"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookService;
