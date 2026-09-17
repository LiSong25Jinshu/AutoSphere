import { useState, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import './Admin.css';
import './Reports.css';

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: 'bookings',
    label: 'Booking Reports',
    icon: '📋',
    description: 'Service bookings, completion rates, and revenue breakdown',
  },
  {
    id: 'users',
    label: 'User Reports',
    icon: '👥',
    description: 'New registrations, role distribution, and verification status',
  },
  {
    id: 'vehicles',
    label: 'Vehicle Reports',
    icon: '🚗',
    description: 'Vehicle listings, views, availability types, and conditions',
  },
  {
    id: 'rentals',
    label: 'Rental Reports',
    icon: '🔑',
    description: 'Vehicle rental requests, durations, and estimated revenue',
  },
  {
    id: 'providers',
    label: 'Service Provider Reports',
    icon: '🔧',
    description: 'Provider registrations, bookings, ratings, and services offered',
  },
  {
    id: 'recommendations',
    label: 'Recommendation Reports',
    icon: '🔍',
    description: 'Vehicle interaction tracking — views, saves, and booking signals',
  },
];

const PRESETS = [
  { id: 'today',      label: 'Today' },
  { id: 'this_week',  label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'custom',     label: 'Custom Range' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (d) => (d ? new Date(d).toLocaleDateString() : '—');
const fmtTime = (d) => (d ? new Date(d).toLocaleString() : '—');
const currency = (v) => (v != null && v !== '—' ? `GHS ${parseFloat(v).toLocaleString()}` : '—');
const cap = (s) => (s ? String(s).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—');

const getPresetDates = (preset) => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (preset === 'today') {
    const t = iso(now);
    return { startDate: t, endDate: t };
  }
  if (preset === 'this_week') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return { startDate: iso(start), endDate: iso(now) };
  }
  if (preset === 'this_month') {
    return { startDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, endDate: iso(now) };
  }
  if (preset === 'last_month') {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return { startDate: iso(first), endDate: iso(last) };
  }
  return null; // custom — user picks
};

// ─── PDF Export ───────────────────────────────────────────────────────────────

const exportPDF = (categoryId, categoryLabel, startDate, endDate, reportData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const dateRange = `${startDate} to ${endDate}`;
  const generated = new Date().toLocaleString();

  const tableFor = (columns, rows, emptyMsg = 'No records found.') => {
    if (!rows || rows.length === 0)
      return `<p class="empty">${emptyMsg}</p>`;
    return `
      <table>
        <thead><tr>${columns.map((c) => `<th>${c.label}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows
            .map(
              (r) =>
                `<tr>${columns
                  .map((c) => `<td>${r[c.key] != null ? r[c.key] : '—'}</td>`)
                  .join('')}</tr>`
            )
            .join('')}
        </tbody>
      </table>`;
  };

  const summaryCards = (pairs) =>
    `<div class="summary-grid">${pairs
      .map(([label, value]) => `<div class="stat-card"><div class="stat-val">${value}</div><div class="stat-lbl">${label}</div></div>`)
      .join('')}</div>`;

  let bodyContent = '';

  if (categoryId === 'bookings' && reportData) {
    const { summary, byStatus, records } = reportData;
    bodyContent = `
      ${summaryCards([
        ['Total Bookings', summary.total],
        ['Total Revenue', currency(summary.totalRevenue)],
        ['Completed', summary.completedCount],
        ['Completion Rate', `${summary.completionRate}%`],
        ['Cancelled', summary.cancelledCount],
      ])}
      <h3>Bookings by Status</h3>
      ${tableFor(
        [{ key: 'status', label: 'Status' }, { key: 'count', label: 'Count' }, { key: 'revenue', label: 'Revenue (GHS)' }],
        byStatus.map((r) => ({ status: cap(r.status), count: r.count, revenue: parseFloat(r.revenue || 0).toFixed(2) }))
      )}
      <h3>Booking Records</h3>
      ${tableFor(
        [
          { key: 'id', label: '#' },
          { key: 'title', label: 'Title' },
          { key: 'serviceType', label: 'Service' },
          { key: 'status', label: 'Status' },
          { key: 'scheduledDate', label: 'Scheduled' },
          { key: 'customerName', label: 'Customer' },
          { key: 'providerName', label: 'Provider' },
          { key: 'actualCost', label: 'Cost (GHS)' },
        ],
        records.map((r) => ({ ...r, serviceType: cap(r.serviceType), status: cap(r.status), scheduledDate: fmt(r.scheduledDate) }))
      )}`;
  }

  if (categoryId === 'users' && reportData) {
    const { summary, byRole, records } = reportData;
    bodyContent = `
      ${summaryCards([
        ['Total New Users', summary.total],
        ['Verified', summary.verified],
        ['Unverified', summary.unverified],
        ['Verification Rate', `${summary.verificationRate}%`],
      ])}
      <h3>Users by Role</h3>
      ${tableFor(
        [{ key: 'role', label: 'Role' }, { key: 'count', label: 'Count' }],
        byRole.map((r) => ({ role: cap(r.role), count: r.count }))
      )}
      <h3>User Records</h3>
      ${tableFor(
        [
          { key: 'id', label: '#' },
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role' },
          { key: 'isVerified', label: 'Verified' },
          { key: 'approvalStatus', label: 'Approval' },
          { key: 'createdAt', label: 'Joined' },
        ],
        records.map((r) => ({
          ...r,
          role: cap(r.role),
          isVerified: r.isVerified ? 'Yes' : 'No',
          approvalStatus: cap(r.approvalStatus),
          createdAt: fmt(r.createdAt),
        }))
      )}`;
  }

  if (categoryId === 'vehicles' && reportData) {
    const { summary, byStatus, byCondition, records } = reportData;
    bodyContent = `
      ${summaryCards([
        ['Total Listings', summary.total],
        ['Total Views', summary.totalViews],
        ['Avg Views/Vehicle', summary.avgViews],
      ])}
      <h3>Vehicles by Status</h3>
      ${tableFor(
        [{ key: 'status', label: 'Status' }, { key: 'count', label: 'Count' }],
        byStatus.map((r) => ({ status: cap(r.status), count: r.count }))
      )}
      <h3>Vehicles by Condition</h3>
      ${tableFor(
        [{ key: 'condition', label: 'Condition' }, { key: 'count', label: 'Count' }, { key: 'avgPrice', label: 'Avg Price (GHS)' }],
        byCondition.map((r) => ({ condition: cap(r.condition), count: r.count, avgPrice: r.avgPrice }))
      )}
      <h3>Vehicle Records</h3>
      ${tableFor(
        [
          { key: 'id', label: '#' },
          { key: 'name', label: 'Vehicle' },
          { key: 'condition', label: 'Condition' },
          { key: 'status', label: 'Status' },
          { key: 'availabilityType', label: 'Available For' },
          { key: 'price', label: 'Price (GHS)' },
          { key: 'viewCount', label: 'Views' },
          { key: 'dealerName', label: 'Dealer' },
        ],
        records.map((r) => ({ ...r, condition: cap(r.condition), status: cap(r.status), availabilityType: cap(r.availabilityType) }))
      )}`;
  }

  if (categoryId === 'rentals' && reportData) {
    const { summary, byStatus, records } = reportData;
    bodyContent = `
      ${summaryCards([
        ['Total Rentals', summary.total],
        ['Estimated Revenue', currency(summary.totalEstimatedRevenue)],
        ['Completed', summary.completedCount],
        ['Pending', summary.pendingCount],
      ])}
      <h3>Rentals by Status</h3>
      ${tableFor(
        [{ key: 'status', label: 'Status' }, { key: 'count', label: 'Count' }],
        byStatus.map((r) => ({ status: cap(r.status), count: r.count }))
      )}
      <h3>Rental Records</h3>
      ${tableFor(
        [
          { key: 'id', label: '#' },
          { key: 'vehicleName', label: 'Vehicle' },
          { key: 'startDate', label: 'Start' },
          { key: 'endDate', label: 'End' },
          { key: 'days', label: 'Days' },
          { key: 'estimatedTotal', label: 'Est. Total (GHS)' },
          { key: 'status', label: 'Status' },
          { key: 'customerName', label: 'Customer' },
          { key: 'dealerName', label: 'Dealer' },
        ],
        records.map((r) => ({ ...r, status: cap(r.status), startDate: fmt(r.startDate), endDate: fmt(r.endDate) }))
      )}`;
  }

  if (categoryId === 'providers' && reportData) {
    const { summary, records } = reportData;
    bodyContent = `
      ${summaryCards([
        ['Total Providers', summary.total],
        ['Approved', summary.approved],
        ['Pending Approval', summary.pending],
        ['Active', summary.active],
      ])}
      <h3>Provider Records</h3>
      ${tableFor(
        [
          { key: 'id', label: '#' },
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'businessName', label: 'Business' },
          { key: 'city', label: 'City' },
          { key: 'approvalStatus', label: 'Status' },
          { key: 'serviceCount', label: 'Services' },
          { key: 'totalBookings', label: 'Bookings' },
          { key: 'totalRevenue', label: 'Revenue (GHS)' },
          { key: 'avgRating', label: 'Rating' },
        ],
        records.map((r) => ({ ...r, approvalStatus: cap(r.approvalStatus), avgRating: r.avgRating || '—' }))
      )}`;
  }

  if (categoryId === 'recommendations' && reportData) {
    const { summary, topViewed, topSaved, topBooked } = reportData;
    bodyContent = `
      ${summaryCards([
        ['Total Interactions', summary.totalInteractions],
        ['Vehicle Views', summary.views],
        ['Vehicles Saved', summary.saves],
        ['Booking Signals', summary.bookingInteractions],
        ['Favorites Added', summary.favoritesAdded],
      ])}
      <h3>Top 10 Viewed Vehicles</h3>
      ${tableFor(
        [{ key: 'vehicleName', label: 'Vehicle' }, { key: 'count', label: 'Views' }],
        topViewed
      )}
      <h3>Top 10 Saved Vehicles</h3>
      ${tableFor(
        [{ key: 'vehicleName', label: 'Vehicle' }, { key: 'count', label: 'Saves' }],
        topSaved
      )}
      <h3>Top 10 Booked Vehicles</h3>
      ${tableFor(
        [{ key: 'vehicleName', label: 'Vehicle' }, { key: 'count', label: 'Booking Events' }],
        topBooked
      )}`;
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>AutoSphere — ${categoryLabel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; padding: 40px; font-size: 12px; }
    .header { border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: flex-end; }
    .logo { font-size: 26px; font-weight: 800; letter-spacing: -1px; }
    .meta { text-align: right; color: #555; font-size: 11px; line-height: 1.6; }
    h2 { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
    h3 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #555; margin: 24px 0 10px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin-bottom: 8px; }
    .stat-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; text-align: center; }
    .stat-val { font-size: 18px; font-weight: 700; color: #1a1a1a; }
    .stat-lbl { font-size: 10px; color: #888; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 4px; font-size: 11px; }
    th { padding: 8px 10px; text-align: left; background: #f5f5f5; font-weight: 700; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; color: #888; border-bottom: 1px solid #ddd; }
    td { padding: 7px 10px; border-bottom: 1px solid #f0f0f0; color: #333; }
    tr:last-child td { border-bottom: none; }
    .empty { color: #aaa; font-style: italic; padding: 12px 0; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; color: #aaa; font-size: 10px; text-align: center; }
    @media print {
      body { padding: 20px; }
      @page { margin: 20mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">AutoSphere</div>
    </div>
    <div class="meta">
      <strong>${categoryLabel}</strong><br />
      Date Range: ${dateRange}<br />
      Generated: ${generated}<br />
      Confidential — Admin use only
    </div>
  </div>
  <h2>${categoryLabel}</h2>
  ${bodyContent}
  <div class="footer">AutoSphere — Confidential report. Generated ${generated}.</div>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 400);
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminReports = () => {
  // Step tracking: 'select' | 'daterange' | 'report'
  const [step, setStep] = useState('select');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [datePreset, setDatePreset] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Resolved start/end for the current run
  const [appliedStart, setAppliedStart] = useState('');
  const [appliedEnd, setAppliedEnd] = useState('');

  const category = CATEGORIES.find((c) => c.id === selectedCategory);

  const resolvedDates = useCallback(() => {
    if (datePreset !== 'custom') return getPresetDates(datePreset);
    if (!customStart || !customEnd) return null;
    return { startDate: customStart, endDate: customEnd };
  }, [datePreset, customStart, customEnd]);

  const handleSelectCategory = (id) => {
    setSelectedCategory(id);
    setReportData(null);
    setError('');
    setStep('daterange');
  };

  const handleBack = () => {
    if (step === 'daterange') { setStep('select'); setSelectedCategory(null); }
    if (step === 'report')    { setStep('daterange'); }
  };

  const handleGenerate = async () => {
    const dates = resolvedDates();
    if (!dates) {
      setError('Please select both start and end dates.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const apiMap = {
        bookings:        adminAPI.getBookingsReport,
        users:           adminAPI.getUsersReport,
        vehicles:        adminAPI.getVehiclesReport,
        rentals:         adminAPI.getRentalsReport,
        providers:       adminAPI.getProvidersReport,
        recommendations: adminAPI.getRecommendationsReport,
      };
      const res = await apiMap[selectedCategory](dates);
      setReportData(res.data?.data);
      setAppliedStart(dates.startDate);
      setAppliedEnd(dates.endDate);
      setStep('report');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    exportPDF(selectedCategory, category?.label, appliedStart, appliedEnd, reportData);
  };

  // ── Step 1: Category selection ──────────────────────────────────────────────
  if (step === 'select') {
    return (
      <div className="admin-sub-page reports-page">
        <div className="admin-sub-header">
          <div>
            <h1>Reports</h1>
            <p>Select a report category to get started</p>
          </div>
        </div>
        <div className="reports-category-grid">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className="reports-category-card"
              onClick={() => handleSelectCategory(cat.id)}
            >
              <span className="reports-cat-icon">{cat.icon}</span>
              <div className="reports-cat-label">{cat.label}</div>
              <div className="reports-cat-desc">{cat.description}</div>
              <span className="reports-cat-arrow">→</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Step 2: Date range ──────────────────────────────────────────────────────
  if (step === 'daterange') {
    const isCustom = datePreset === 'custom';
    const canGenerate = !isCustom || (customStart && customEnd && customStart <= customEnd);

    return (
      <div className="admin-sub-page reports-page">
        <div className="admin-sub-header">
          <div>
            <button className="reports-back-btn" onClick={handleBack}>← Back</button>
            <h1>{category?.icon} {category?.label}</h1>
            <p>Select the date range for this report</p>
          </div>
        </div>

        {error && (
          <div className="admin-error-msg" style={{ marginBottom: 16 }}>{error}</div>
        )}

        <div className="reports-date-card">
          <div className="reports-presets">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                className={`admin-filter-btn ${datePreset === p.id ? 'active' : ''}`}
                onClick={() => setDatePreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {isCustom && (
            <div className="reports-custom-range">
              <div className="reports-date-field">
                <label>Start Date</label>
                <input
                  type="date"
                  value={customStart}
                  max={customEnd || undefined}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="reports-date-input"
                />
              </div>
              <div className="reports-date-field">
                <label>End Date</label>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart || undefined}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="reports-date-input"
                />
              </div>
            </div>
          )}

          {!isCustom && (() => {
            const d = getPresetDates(datePreset);
            return d ? (
              <p className="reports-range-preview">
                Range: <strong>{d.startDate}</strong> → <strong>{d.endDate}</strong>
              </p>
            ) : null;
          })()}

          <button
            className="reports-generate-btn"
            onClick={handleGenerate}
            disabled={!canGenerate || loading}
          >
            {loading ? 'Generating…' : 'Generate Report →'}
          </button>
        </div>
      </div>
    );
  }

  // ── Step 3: Report view ─────────────────────────────────────────────────────
  if (step === 'report' && reportData) {
    return (
      <div className="admin-sub-page reports-page">
        {/* Header */}
        <div className="admin-sub-header">
          <div>
            <button className="reports-back-btn" onClick={handleBack}>← Change Date Range</button>
            <h1>{category?.icon} {category?.label}</h1>
            <p className="reports-range-label">
              {appliedStart} → {appliedEnd} &nbsp;·&nbsp; Generated {new Date().toLocaleString()}
            </p>
          </div>
          <button className="reports-export-btn" onClick={handleExportPDF}>
            ⬇ Export PDF
          </button>
        </div>

        {/* Report content based on category */}
        {selectedCategory === 'bookings' && <BookingsReport data={reportData} />}
        {selectedCategory === 'users'    && <UsersReport    data={reportData} />}
        {selectedCategory === 'vehicles' && <VehiclesReport data={reportData} />}
        {selectedCategory === 'rentals'  && <RentalsReport  data={reportData} />}
        {selectedCategory === 'providers'&& <ProvidersReport data={reportData} />}
        {selectedCategory === 'recommendations' && <RecommendationsReport data={reportData} />}
      </div>
    );
  }

  return null;
};

// ─── Report Sub-Components ────────────────────────────────────────────────────

const SummaryGrid = ({ stats }) => (
  <div className="admin-reports-stats reports-summary">
    {stats.map(([label, value, color]) => (
      <div className="admin-report-card" key={label}>
        <div className="admin-report-value" style={color ? { color } : {}}>
          {value}
        </div>
        <div className="admin-report-label">{label}</div>
      </div>
    ))}
  </div>
);

const SectionTable = ({ title, columns, rows, emptyMsg = 'No records found.' }) => (
  <div className="admin-report-section" style={{ marginBottom: 20 }}>
    {title && <h2 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#1a1a1a' }}>{title}</h2>}
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="admin-empty">{emptyMsg}</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── Bookings Report ──────────────────────────────────────────────────────────
const BookingsReport = ({ data }) => {
  const { summary, byStatus, records } = data;
  return (
    <>
      <SummaryGrid stats={[
        ['Total Bookings',    summary.total,              '#2196f3'],
        ['Total Revenue',     currency(summary.totalRevenue), '#4caf50'],
        ['Completed',         summary.completedCount,     '#4caf50'],
        ['Completion Rate',   `${summary.completionRate}%`, '#9c27b0'],
        ['Cancelled',         summary.cancelledCount,     '#f44336'],
      ]} />
      <SectionTable
        title="Breakdown by Status"
        columns={[
          { key: 'status', label: 'Status', render: (v) => cap(v) },
          { key: 'count',  label: 'Count' },
          { key: 'revenue', label: 'Revenue (GHS)', render: (v) => parseFloat(v || 0).toFixed(2) },
        ]}
        rows={byStatus}
      />
      <SectionTable
        title="Booking Records"
        columns={[
          { key: 'id',           label: '#' },
          { key: 'title',        label: 'Title' },
          { key: 'serviceType',  label: 'Service', render: (v) => cap(v) },
          { key: 'status',       label: 'Status',  render: (v) => <span className={`admin-status-badge reports-badge-${v}`}>{cap(v)}</span> },
          { key: 'scheduledDate', label: 'Scheduled', render: (v) => fmt(v) },
          { key: 'customerName', label: 'Customer' },
          { key: 'providerName', label: 'Provider' },
          { key: 'actualCost',   label: 'Actual Cost', render: (v) => v != null ? `GHS ${parseFloat(v).toLocaleString()}` : '—' },
          { key: 'rating',       label: 'Rating', render: (v) => v ? `${v}/5` : '—' },
        ]}
        rows={records}
      />
    </>
  );
};

// ─── Users Report ─────────────────────────────────────────────────────────────
const UsersReport = ({ data }) => {
  const { summary, byRole, records } = data;
  return (
    <>
      <SummaryGrid stats={[
        ['New Users',          summary.total,                '#2196f3'],
        ['Verified',           summary.verified,             '#4caf50'],
        ['Unverified',         summary.unverified,           '#ff9800'],
        ['Verification Rate',  `${summary.verificationRate}%`, '#9c27b0'],
      ]} />
      <SectionTable
        title="Users by Role"
        columns={[
          { key: 'role',  label: 'Role',  render: (v) => cap(v) },
          { key: 'count', label: 'Count' },
        ]}
        rows={byRole}
      />
      <SectionTable
        title="User Records"
        columns={[
          { key: 'id',             label: '#' },
          { key: 'name',           label: 'Name' },
          { key: 'email',          label: 'Email' },
          { key: 'role',           label: 'Role',     render: (v) => cap(v) },
          { key: 'isVerified',     label: 'Verified', render: (v) => v ? '✓ Yes' : '✗ No' },
          { key: 'approvalStatus', label: 'Approval', render: (v) => cap(v) },
          { key: 'city',           label: 'City' },
          { key: 'createdAt',      label: 'Joined',   render: (v) => fmt(v) },
        ]}
        rows={records}
      />
    </>
  );
};

// ─── Vehicles Report ──────────────────────────────────────────────────────────
const VehiclesReport = ({ data }) => {
  const { summary, byStatus, byCondition, byAvailability, records } = data;
  return (
    <>
      <SummaryGrid stats={[
        ['Total Listings', summary.total,      '#2196f3'],
        ['Total Views',    summary.totalViews, '#ff9800'],
        ['Avg Views',      summary.avgViews,   '#9c27b0'],
      ]} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <SectionTable
          title="By Status"
          columns={[
            { key: 'status', label: 'Status', render: (v) => cap(v) },
            { key: 'count',  label: 'Count' },
          ]}
          rows={byStatus}
        />
        <SectionTable
          title="By Availability"
          columns={[
            { key: 'availabilityType', label: 'Type',  render: (v) => cap(v) },
            { key: 'count',            label: 'Count' },
          ]}
          rows={byAvailability}
        />
      </div>
      <SectionTable
        title="By Condition"
        columns={[
          { key: 'condition', label: 'Condition', render: (v) => cap(v) },
          { key: 'count',     label: 'Count' },
          { key: 'avgPrice',  label: 'Avg Price (GHS)' },
        ]}
        rows={byCondition}
      />
      <SectionTable
        title="Vehicle Records"
        columns={[
          { key: 'id',               label: '#' },
          { key: 'name',             label: 'Vehicle' },
          { key: 'condition',        label: 'Condition',  render: (v) => cap(v) },
          { key: 'status',           label: 'Status',     render: (v) => cap(v) },
          { key: 'availabilityType', label: 'For',        render: (v) => cap(v) },
          { key: 'price',            label: 'Price (GHS)', render: (v) => parseFloat(v).toLocaleString() },
          { key: 'viewCount',        label: 'Views' },
          { key: 'dealerName',       label: 'Dealer' },
          { key: 'createdAt',        label: 'Listed',     render: (v) => fmt(v) },
        ]}
        rows={records}
      />
    </>
  );
};

// ─── Rentals Report ───────────────────────────────────────────────────────────
const RentalsReport = ({ data }) => {
  const { summary, byStatus, records } = data;
  return (
    <>
      <SummaryGrid stats={[
        ['Total Rentals',     summary.total,                       '#2196f3'],
        ['Est. Revenue',      currency(summary.totalEstimatedRevenue), '#4caf50'],
        ['Completed',         summary.completedCount,              '#4caf50'],
        ['Pending',           summary.pendingCount,                '#ff9800'],
      ]} />
      <SectionTable
        title="Breakdown by Status"
        columns={[
          { key: 'status', label: 'Status', render: (v) => cap(v) },
          { key: 'count',  label: 'Count' },
        ]}
        rows={byStatus}
      />
      <SectionTable
        title="Rental Records"
        columns={[
          { key: 'id',             label: '#' },
          { key: 'vehicleName',    label: 'Vehicle' },
          { key: 'startDate',      label: 'Start',   render: (v) => fmt(v) },
          { key: 'endDate',        label: 'End',     render: (v) => fmt(v) },
          { key: 'days',           label: 'Days' },
          { key: 'estimatedTotal', label: 'Est. Total', render: (v) => v !== '—' ? currency(v) : '—' },
          { key: 'status',         label: 'Status',  render: (v) => cap(v) },
          { key: 'customerName',   label: 'Customer' },
          { key: 'dealerName',     label: 'Dealer' },
          { key: 'createdAt',      label: 'Requested', render: (v) => fmt(v) },
        ]}
        rows={records}
      />
    </>
  );
};

// ─── Providers Report ─────────────────────────────────────────────────────────
const ProvidersReport = ({ data }) => {
  const { summary, records } = data;
  return (
    <>
      <SummaryGrid stats={[
        ['Total Providers', summary.total,   '#2196f3'],
        ['Approved',        summary.approved,'#4caf50'],
        ['Pending',         summary.pending, '#ff9800'],
        ['Active',          summary.active,  '#9c27b0'],
      ]} />
      <SectionTable
        title="Service Provider Records"
        columns={[
          { key: 'id',             label: '#' },
          { key: 'name',           label: 'Name' },
          { key: 'email',          label: 'Email' },
          { key: 'businessName',   label: 'Business' },
          { key: 'city',           label: 'City' },
          { key: 'approvalStatus', label: 'Status', render: (v) => cap(v) },
          { key: 'serviceCount',   label: 'Services' },
          { key: 'totalBookings',  label: 'Bookings' },
          { key: 'totalRevenue',   label: 'Revenue (GHS)', render: (v) => parseFloat(v).toLocaleString() },
          { key: 'avgRating',      label: 'Rating', render: (v) => v ? `${v}/5` : '—' },
          { key: 'createdAt',      label: 'Joined', render: (v) => fmt(v) },
        ]}
        rows={records}
      />
    </>
  );
};

// ─── Recommendations Report ───────────────────────────────────────────────────
const RecommendationsReport = ({ data }) => {
  const { summary, topViewed, topSaved, topBooked } = data;
  return (
    <>
      <SummaryGrid stats={[
        ['Total Interactions',  summary.totalInteractions, '#2196f3'],
        ['Vehicle Views',       summary.views,             '#ff9800'],
        ['Saved',               summary.saves,             '#9c27b0'],
        ['Booking Signals',     summary.bookingInteractions,'#4caf50'],
        ['Favorites Added',     summary.favoritesAdded,    '#f44336'],
      ]} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        <SectionTable
          title="Top 10 Viewed"
          columns={[
            { key: 'vehicleName', label: 'Vehicle' },
            { key: 'count',       label: 'Views' },
          ]}
          rows={topViewed}
          emptyMsg="No view data."
        />
        <SectionTable
          title="Top 10 Saved"
          columns={[
            { key: 'vehicleName', label: 'Vehicle' },
            { key: 'count',       label: 'Saves' },
          ]}
          rows={topSaved}
          emptyMsg="No save data."
        />
        <SectionTable
          title="Top 10 Booked"
          columns={[
            { key: 'vehicleName', label: 'Vehicle' },
            { key: 'count',       label: 'Events' },
          ]}
          rows={topBooked}
          emptyMsg="No booking signal data."
        />
      </div>
    </>
  );
};

export default AdminReports;
