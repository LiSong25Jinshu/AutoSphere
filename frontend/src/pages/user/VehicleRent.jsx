import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { rentalAPI } from "../../services/api";
import { CURRENCY_SYMBOL, formatPrice } from "../../utils/currency";
import StartChatButton from "../../components/StartChatButton";
import "./VehicleRent.css";

const STEPS = ["Browse", "Details", "Schedule", "Confirm"];

const BODY_TYPES = [
  { value: "", label: "All Types" },
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "hatchback", label: "Hatchback" },
  { value: "coupe", label: "Coupe" },
  { value: "convertible", label: "Convertible" },
  { value: "truck", label: "Truck" },
  { value: "van", label: "Van" },
  { value: "wagon", label: "Wagon" },
];

const TRANSMISSIONS = [
  { value: "", label: "Any Transmission" },
  { value: "automatic", label: "Automatic" },
  { value: "manual", label: "Manual" },
  { value: "cvt", label: "CVT" },
];

const FUEL_TYPES = [
  { value: "", label: "Any Fuel" },
  { value: "gasoline", label: "Gasoline" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid" },
  { value: "electric", label: "Electric" },
  { value: "plug_in_hybrid", label: "Plug-in Hybrid" },
];

const PICKUP_TIMES = [
  "07:00","08:00","09:00","10:00","11:00",
  "12:00","13:00","14:00","15:00","16:00","17:00","18:00",
];

const CONDITION_LABELS = {
  new: "New",
  used: "Used",
  certified_pre_owned: "Certified Pre-Owned",
};

const FUEL_LABELS = {
  gasoline: "Petrol",
  diesel: "Diesel",
  hybrid: "Hybrid",
  electric: "Electric",
  plug_in_hybrid: "Plug-in Hybrid",
};

function VehicleRent() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // ── Step 0: Browse ──────────────────────────────────────────────────────────
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    search: "", bodyType: "", transmission: "", fuelType: "",
    minPrice: "", maxPrice: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  // ── Step 1: Details ─────────────────────────────────────────────────────────
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  // ── Step 2: Schedule ────────────────────────────────────────────────────────
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [driverLicense, setDriverLicense] = useState("");
  const [notes, setNotes] = useState("");

  // ── Step 3: Confirm / Submit ────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState(null);

  // ── Fetch vehicles ──────────────────────────────────────────────────────────
  const fetchVehicles = useCallback((page = 1, f = appliedFilters) => {
    setLoading(true);
    setFetchError("");
    const params = { page, limit: 12 };
    if (f.search)       params.search       = f.search;
    if (f.bodyType)     params.bodyType     = f.bodyType;
    if (f.transmission) params.transmission = f.transmission;
    if (f.fuelType)     params.fuelType     = f.fuelType;
    if (f.minPrice)     params.minPrice     = f.minPrice;
    if (f.maxPrice)     params.maxPrice     = f.maxPrice;

    rentalAPI.getVehicles(params)
      .then((res) => {
        setVehicles(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
      })
      .catch(() => setFetchError("Could not load vehicles. Please try again."))
      .finally(() => setLoading(false));
  }, [appliedFilters]);

  useEffect(() => { fetchVehicles(1, appliedFilters); }, [appliedFilters]);

  const applyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  const clearFilters = () => {
    const empty = { search: "", bodyType: "", transmission: "", fuelType: "", minPrice: "", maxPrice: "" };
    setFilters(empty);
    setAppliedFilters(empty);
  };

  // ── Select a vehicle → load full details ───────────────────────────────────
  const selectVehicle = (vehicle) => {
    setDetailLoading(true);
    setActivePhoto(0);
    rentalAPI.getVehicleById(vehicle.id)
      .then((res) => {
        setSelectedVehicle(res.data.data);
        setStep(1);
      })
      .catch(() => {
        setSelectedVehicle(vehicle);
        setStep(1);
      })
      .finally(() => setDetailLoading(false));
  };

  // ── Navigation helpers ──────────────────────────────────────────────────────
  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const canProceed = () => {
    if (step === 0) return !!selectedVehicle;
    if (step === 1) return !!selectedVehicle;
    if (step === 2) return !!startDate && !!endDate && !!pickupTime && endDate > startDate;
    return true;
  };

  // ── Rental duration & cost estimate ────────────────────────────────────────
  const rentalDays = startDate && endDate
    ? Math.max(0, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000))
    : 0;
  const dailyRate = selectedVehicle
    ? Math.round(parseFloat(selectedVehicle.price) * 0.003)
    : 0;
  const estimatedTotal = dailyRate * rentalDays;

  const getMinDate = () => new Date().toISOString().split("T")[0];
  const getMinEndDate = () => startDate
    ? new Date(new Date(startDate).getTime() + 86400000).toISOString().split("T")[0]
    : getMinDate();

  // ── Submit rental request ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitError("");
    setSubmitting(true);
    try {
      const res = await rentalAPI.submitRequest({
        vehicleId: selectedVehicle.id,
        startDate,
        endDate,
        pickupTime,
        notes,
        driverLicense,
      });
      if (res.data.success) {
        setResult(res.data.data);
        setStep(3);
      } else {
        setSubmitError(res.data.message || "Failed to submit request.");
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setStep(0); setSelectedVehicle(null); setResult(null);
    setStartDate(""); setEndDate(""); setPickupTime("");
    setDriverLicense(""); setNotes(""); setSubmitError("");
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="vr-page">
      <div className="vr-card">

        {/* Header */}
        <div className="vr-header">
          <h1>Rent a Vehicle</h1>
          <p>Browse available cars, pick your dates, and submit a rental request in minutes.</p>
        </div>

        {/* Step indicator */}
        <div className="vr-steps">
          {STEPS.map((label, i) => (
            <div key={label} className={`vr-step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}>
              <div className="vr-step-circle">{i < step ? "✓" : i + 1}</div>
              <span className="vr-step-label">{label}</span>
              {i < STEPS.length - 1 && <div className="vr-step-line" />}
            </div>
          ))}
        </div>

        {/* ── STEP 0: Browse ── */}
        {step === 0 && (
          <div className="vr-section">
            <h2 className="vr-section-title">Choose a vehicle</h2>

            {/* Filters */}
            <div className="vr-filters">
              <input
                className="vr-input vr-search"
                type="text"
                placeholder="Search make or model…"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              />
              <select className="vr-select" value={filters.bodyType}
                onChange={(e) => setFilters((f) => ({ ...f, bodyType: e.target.value }))}>
                {BODY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <select className="vr-select" value={filters.transmission}
                onChange={(e) => setFilters((f) => ({ ...f, transmission: e.target.value }))}>
                {TRANSMISSIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <select className="vr-select" value={filters.fuelType}
                onChange={(e) => setFilters((f) => ({ ...f, fuelType: e.target.value }))}>
                {FUEL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input className="vr-input vr-price" type="number" placeholder="Min price"
                value={filters.minPrice}
                onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))} />
              <input className="vr-input vr-price" type="number" placeholder="Max price"
                value={filters.maxPrice}
                onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))} />
              <button className="vr-btn primary vr-filter-btn" onClick={applyFilters}>Search</button>
              <button className="vr-btn secondary vr-filter-btn" onClick={clearFilters}>Clear</button>
            </div>

            {/* Results count */}
            {!loading && !fetchError && (
              <p className="vr-results-count">
                {pagination.total} vehicle{pagination.total !== 1 ? "s" : ""} available
              </p>
            )}

            {/* Loading */}
            {loading && (
              <div className="vr-loading">
                <div className="vr-spinner" />
                <p>Loading vehicles…</p>
              </div>
            )}

            {/* Error */}
            {!loading && fetchError && (
              <div className="vr-alert error">{fetchError}</div>
            )}

            {/* Empty */}
            {!loading && !fetchError && vehicles.length === 0 && (
              <div className="vr-empty">
                <span className="vr-empty-icon">🚗</span>
                <p>No vehicles match your filters. Try adjusting your search.</p>
                <button className="vr-btn secondary" onClick={clearFilters}>Clear Filters</button>
              </div>
            )}

            {/* Vehicle grid */}
            {!loading && vehicles.length > 0 && (
              <div className="vr-vehicle-grid">
                {vehicles.map((v) => {
                  const thumb = v.images?.[0] || null;
                  const isSelected = selectedVehicle?.id === v.id;
                  return (
                    <div
                      key={v.id}
                      className={`vr-vehicle-card ${isSelected ? "selected" : ""}`}
                      onClick={() => selectVehicle(v)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && selectVehicle(v)}
                    >
                      <div className="vr-vehicle-img">
                        {thumb
                          ? <img src={thumb} alt={`${v.year} ${v.make} ${v.model}`} />
                          : <div className="vr-vehicle-img-placeholder">🚗</div>
                        }
                        {v.isFeatured && <span className="vr-badge featured">Featured</span>}
                        <span className={`vr-badge condition ${v.condition}`}>
                          {CONDITION_LABELS[v.condition] || v.condition}
                        </span>
                      </div>
                      <div className="vr-vehicle-body">
                        <div className="vr-vehicle-name">{v.year} {v.make} {v.model}</div>
                        <div className="vr-vehicle-meta">
                          <span>⚙️ {v.transmission}</span>
                          <span>⛽ {FUEL_LABELS[v.fuelType] || v.fuelType}</span>
                          {v.mileage != null && <span>📍 {v.mileage.toLocaleString()} km</span>}
                        </div>
                        <div className="vr-vehicle-footer">
                          <div className="vr-vehicle-price">
                            <span className="vr-price-label">Est. daily rate</span>
                            <span className="vr-price-value">
                              {CURRENCY_SYMBOL}{Math.round(parseFloat(v.price) * 0.003).toLocaleString()}
                            </span>
                          </div>
                          {isSelected && <span className="vr-selected-badge">✓ Selected</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="vr-pagination">
                <button className="vr-btn secondary" disabled={pagination.page <= 1}
                  onClick={() => fetchVehicles(pagination.page - 1)}>← Prev</button>
                <span className="vr-page-info">Page {pagination.page} of {pagination.pages}</span>
                <button className="vr-btn secondary" disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchVehicles(pagination.page + 1)}>Next →</button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 1: Details ── */}
        {step === 1 && selectedVehicle && (
          <div className="vr-section">
            <h2 className="vr-section-title">Vehicle details</h2>
            {detailLoading ? (
              <div className="vr-loading"><div className="vr-spinner" /><p>Loading details…</p></div>
            ) : (
              <div className="vr-detail-layout">
                {/* Photo gallery */}
                <div className="vr-gallery">
                  <div className="vr-gallery-main">
                    {selectedVehicle.images?.length > 0
                      ? <img src={selectedVehicle.images[activePhoto]} alt="Vehicle" />
                      : <div className="vr-gallery-placeholder">🚗</div>
                    }
                  </div>
                  {selectedVehicle.images?.length > 1 && (
                    <div className="vr-gallery-thumbs">
                      {selectedVehicle.images.map((img, i) => (
                        <img key={i} src={img} alt={`Photo ${i + 1}`}
                          className={i === activePhoto ? "active" : ""}
                          onClick={() => setActivePhoto(i)} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Specs */}
                <div className="vr-specs">
                  <h3 className="vr-specs-title">
                    {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                  </h3>
                  <div className="vr-specs-price">
                    <span className="vr-specs-daily">{CURRENCY_SYMBOL}{dailyRate.toLocaleString()}</span>
                    <span className="vr-specs-per-day">/ day (est.)</span>
                  </div>
                  <div className="vr-specs-grid">
                    {[
                      ["Body Type",     selectedVehicle.bodyType],
                      ["Transmission",  selectedVehicle.transmission],
                      ["Fuel Type",     FUEL_LABELS[selectedVehicle.fuelType] || selectedVehicle.fuelType],
                      ["Condition",     CONDITION_LABELS[selectedVehicle.condition] || selectedVehicle.condition],
                      ["Color",         selectedVehicle.color || "—"],
                      ["Mileage",       selectedVehicle.mileage != null ? `${selectedVehicle.mileage.toLocaleString()} km` : "—"],
                    ].map(([label, val]) => (
                      <div key={label} className="vr-spec-item">
                        <span className="vr-spec-label">{label}</span>
                        <span className="vr-spec-value">{val}</span>
                      </div>
                    ))}
                  </div>
                  {selectedVehicle.description && (
                    <p className="vr-specs-desc">{selectedVehicle.description}</p>
                  )}
                  {selectedVehicle.features?.length > 0 && (
                    <div className="vr-features">
                      <p className="vr-features-title">Features</p>
                      <div className="vr-features-list">
                        {selectedVehicle.features.map((f, i) => (
                          <span key={i} className="vr-feature-tag">{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedVehicle.dealer && (
                    <div className="vr-dealer-box">
                      <p className="vr-dealer-label">Listed by</p>
                      <p className="vr-dealer-name">
                        {selectedVehicle.dealer.firstName} {selectedVehicle.dealer.lastName}
                      </p>
                      {selectedVehicle.dealer.phone && (
                        <a
                          href={`tel:${selectedVehicle.dealer.phone.replace(/[\s\-().]/g, '')}`}
                          className="vr-dealer-phone"
                          aria-label={`Call ${selectedVehicle.dealer.firstName}`}
                        >
                          📞 {selectedVehicle.dealer.phone}
                        </a>
                      )}
                      <StartChatButton
                        userId={selectedVehicle.dealer.id}
                        userName={`${selectedVehicle.dealer.firstName} ${selectedVehicle.dealer.lastName}`}
                        userRole="dealer"
                        userPhone={selectedVehicle.dealer.phone || ''}
                        label="Message Dealer"
                        variant="outline"
                        size="sm"
                        className="vr-dealer-chat"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Schedule ── */}
        {step === 2 && (
          <div className="vr-section">
            <h2 className="vr-section-title">Set your rental dates</h2>

            {/* Summary bar */}
            <div className="vr-summary-bar">
              <div className="vr-summary-item">
                <span className="vr-summary-label">Vehicle</span>
                <span className="vr-summary-value">
                  {selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}
                </span>
              </div>
              <div className="vr-summary-divider" />
              <div className="vr-summary-item">
                <span className="vr-summary-label">Est. daily rate</span>
                <span className="vr-summary-value">{CURRENCY_SYMBOL}{dailyRate.toLocaleString()}</span>
              </div>
              {rentalDays > 0 && (
                <>
                  <div className="vr-summary-divider" />
                  <div className="vr-summary-item">
                    <span className="vr-summary-label">{rentalDays} day{rentalDays !== 1 ? "s" : ""}</span>
                    <span className="vr-summary-value vr-total">{CURRENCY_SYMBOL}{estimatedTotal.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            <div className="vr-schedule-grid">
              <div className="vr-form-group">
                <label className="vr-label">Pick-up Date <span className="vr-required">*</span></label>
                <input type="date" className="vr-input" value={startDate} min={getMinDate()}
                  onChange={(e) => { setStartDate(e.target.value); if (endDate && e.target.value >= endDate) setEndDate(""); }} />
              </div>
              <div className="vr-form-group">
                <label className="vr-label">Return Date <span className="vr-required">*</span></label>
                <input type="date" className="vr-input" value={endDate} min={getMinEndDate()}
                  onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="vr-form-group">
                <label className="vr-label">Pick-up Time <span className="vr-required">*</span></label>
                <div className="vr-time-grid">
                  {PICKUP_TIMES.map((t) => (
                    <button key={t} type="button"
                      className={`vr-time-btn ${pickupTime === t ? "selected" : ""}`}
                      onClick={() => setPickupTime(t)}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="vr-form-group">
                <label className="vr-label">Driver's License Number</label>
                <input type="text" className="vr-input" placeholder="e.g. GHA-1234567"
                  value={driverLicense} onChange={(e) => setDriverLicense(e.target.value)} />
              </div>
            </div>

            <div className="vr-form-group" style={{ marginTop: "1.5rem" }}>
              <label className="vr-label">Additional Notes</label>
              <textarea className="vr-textarea" rows={3}
                placeholder="Any special requests, pickup location details, or questions for the dealer…"
                value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            {startDate && endDate && endDate <= startDate && (
              <div className="vr-alert error">Return date must be after pick-up date.</div>
            )}
          </div>
        )}

        {/* ── STEP 3: Confirm / Success ── */}
        {step === 3 && (
          <div className="vr-section">
            {result ? (
              <div className="vr-success">
                <div className="vr-success-icon">✓</div>
                <h2>Request Submitted!</h2>
                <p className="vr-success-sub">
                  Your rental request for the <strong>{result.vehicleName}</strong> has been sent to{" "}
                  <strong>{result.dealerName}</strong>. They will contact you shortly to confirm.
                </p>
                <div className="vr-confirm-card">
                  {[
                    ["Vehicle",       result.vehicleName],
                    ["Dealer",        result.dealerName],
                    ["Dealer Phone",  result.dealerPhone || "—"],
                    ["Pick-up Date",  new Date(result.startDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })],
                    ["Return Date",   new Date(result.endDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })],
                    ["Pick-up Time",  result.pickupTime],
                    ["Duration",      `${result.days} day${result.days !== 1 ? "s" : ""}`],
                    ["Est. Daily Rate", `${CURRENCY_SYMBOL}${result.dailyRate?.toLocaleString()}`],
                    ["Est. Total",    `${CURRENCY_SYMBOL}${result.estimatedTotal?.toLocaleString()}`],
                  ].map(([label, val]) => (
                    <div key={label} className="vr-confirm-row">
                      <span className="vr-confirm-label">{label}</span>
                      <span className="vr-confirm-value">{val}</span>
                    </div>
                  ))}
                  {result.notes && (
                    <div className="vr-confirm-row">
                      <span className="vr-confirm-label">Notes</span>
                      <span className="vr-confirm-value">{result.notes}</span>
                    </div>
                  )}
                </div>
                <p className="vr-confirm-note">
                  Prices shown are estimates. Final cost will be confirmed by the dealer.
                </p>
                <div className="vr-success-actions">
                  <button className="vr-btn primary" onClick={() => navigate("/appointments")}>
                    View My Appointments
                  </button>
                  <button className="vr-btn secondary" onClick={resetAll}>
                    Rent Another Vehicle
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="vr-section-title">Confirm your rental request</h2>
                {submitError && <div className="vr-alert error">{submitError}</div>}
                <div className="vr-confirm-card">
                  {[
                    ["Vehicle",       `${selectedVehicle?.year} ${selectedVehicle?.make} ${selectedVehicle?.model}`],
                    ["Pick-up Date",  startDate ? new Date(startDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "—"],
                    ["Return Date",   endDate ? new Date(endDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "—"],
                    ["Pick-up Time",  pickupTime || "—"],
                    ["Duration",      rentalDays > 0 ? `${rentalDays} day${rentalDays !== 1 ? "s" : ""}` : "—"],
                    ["Est. Daily Rate", `${CURRENCY_SYMBOL}${dailyRate.toLocaleString()}`],
                    ["Est. Total",    rentalDays > 0 ? `${CURRENCY_SYMBOL}${estimatedTotal.toLocaleString()}` : "—"],
                  ].map(([label, val]) => (
                    <div key={label} className="vr-confirm-row">
                      <span className="vr-confirm-label">{label}</span>
                      <span className="vr-confirm-value">{val}</span>
                    </div>
                  ))}
                  {driverLicense && (
                    <div className="vr-confirm-row">
                      <span className="vr-confirm-label">License No.</span>
                      <span className="vr-confirm-value">{driverLicense}</span>
                    </div>
                  )}
                  {notes && (
                    <div className="vr-confirm-row">
                      <span className="vr-confirm-label">Notes</span>
                      <span className="vr-confirm-value">{notes}</span>
                    </div>
                  )}
                </div>
                <p className="vr-confirm-note">
                  This is a rental request. The dealer will contact you to confirm availability and final pricing.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Nav buttons ── */}
        {!result && (
          <div className="vr-nav">
            {step > 0 && (
              <button className="vr-btn secondary" onClick={goBack} disabled={submitting}>← Back</button>
            )}
            <div style={{ flex: 1 }} />
            {step < STEPS.length - 1 && (
              <button className="vr-btn primary" onClick={goNext}
                disabled={!canProceed() || detailLoading}>
                Continue →
              </button>
            )}
            {step === STEPS.length - 1 && !result && (
              <button className="vr-btn primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Request"}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default VehicleRent;
