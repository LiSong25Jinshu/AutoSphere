/**
 * Manage Schedule — full schedule management for service providers
 *
 * Tabs:
 *  1. Weekly Hours    — open/close each day, set hours, add break times
 *  2. Blocked Dates   — mark specific dates as unavailable
 *  3. Settings        — buffer time, max daily bookings, booking window
 */
import { useState, useEffect } from 'react';
import { serviceAPI } from '../../services/api';
import './Availability.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DAY_SHORT = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
  Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

const PRESETS = [
  { label: 'Standard (Mon–Fri 9–5)',   days: ['Monday','Tuesday','Wednesday','Thursday','Friday'], start: '09:00', end: '17:00' },
  { label: 'Extended (Mon–Sat 8–6)',   days: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], start: '08:00', end: '18:00' },
  { label: 'All Week (8–5)',           days: DAYS, start: '08:00', end: '17:00' },
  { label: 'Morning Only (7–12)',      days: ['Monday','Tuesday','Wednesday','Thursday','Friday'], start: '07:00', end: '12:00' },
  { label: 'Afternoon Only (13–18)',   days: ['Monday','Tuesday','Wednesday','Thursday','Friday'], start: '13:00', end: '18:00' },
];

const DEFAULT_WEEK = DAYS.reduce((acc, day) => {
  acc[day] = {
    enabled: day !== 'Sunday',
    start: '09:00',
    end: '17:00',
    breaks: [],           // [{ start, end }]
  };
  return acc;
}, {});

const DEFAULT_SETTINGS = {
  bufferMinutes: 15,        // gap between appointments
  maxBookingsPerDay: 10,
  bookingWindowDays: 30,    // how far ahead customers can book
  minNoticeHours: 2,        // minimum notice before booking
};

const today = () => new Date().toISOString().split('T')[0];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

const Toggle = ({ checked, onChange, id }) => (
  <label className="sch-toggle" htmlFor={id}>
    <input type="checkbox" id={id} checked={checked} onChange={onChange} />
    <span className="sch-toggle-track">
      <span className="sch-toggle-thumb" />
    </span>
  </label>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const ServiceProviderAvailability = () => {
  const [tab, setTab]               = useState('hours');
  const [week, setWeek]             = useState(DEFAULT_WEEK);
  const [blocked, setBlocked]       = useState([]);     // ['2025-08-01', ...]
  const [settings, setSettings]     = useState(DEFAULT_SETTINGS);
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockNote, setNewBlockNote] = useState('');

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await serviceAPI.getSchedule();
        const data = res.data?.data;
        if (data) {
          if (data.week)     setWeek({ ...DEFAULT_WEEK, ...data.week });
          if (data.blocked)  setBlocked(data.blocked);
          if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        }
      } catch (e) {
        console.error('Load schedule error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await serviceAPI.saveSchedule({ week, blocked, settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Weekly hours helpers ────────────────────────────────────────────────────
  const toggleDay = (day) =>
    setWeek(w => ({ ...w, [day]: { ...w[day], enabled: !w[day].enabled } }));

  const setDayTime = (day, field, value) =>
    setWeek(w => ({ ...w, [day]: { ...w[day], [field]: value } }));

  const addBreak = (day) =>
    setWeek(w => ({
      ...w,
      [day]: { ...w[day], breaks: [...(w[day].breaks || []), { start: '12:00', end: '13:00' }] },
    }));

  const updateBreak = (day, idx, field, value) =>
    setWeek(w => {
      const breaks = [...(w[day].breaks || [])];
      breaks[idx] = { ...breaks[idx], [field]: value };
      return { ...w, [day]: { ...w[day], breaks } };
    });

  const removeBreak = (day, idx) =>
    setWeek(w => {
      const breaks = (w[day].breaks || []).filter((_, i) => i !== idx);
      return { ...w, [day]: { ...w[day], breaks } };
    });

  const applyPreset = (preset) => {
    const next = { ...DEFAULT_WEEK };
    DAYS.forEach(day => {
      next[day] = {
        ...DEFAULT_WEEK[day],
        enabled: preset.days.includes(day),
        start: preset.start,
        end: preset.end,
        breaks: [],
      };
    });
    setWeek(next);
  };

  // ── Blocked dates helpers ───────────────────────────────────────────────────
  const addBlockedDate = () => {
    if (!newBlockDate) return;
    if (blocked.find(b => b.date === newBlockDate)) return;
    setBlocked(prev => [...prev, { date: newBlockDate, note: newBlockNote.trim() }]
      .sort((a, b) => a.date.localeCompare(b.date)));
    setNewBlockDate('');
    setNewBlockNote('');
  };

  const removeBlockedDate = (date) =>
    setBlocked(prev => prev.filter(b => b.date !== date));

  // ── Settings helpers ────────────────────────────────────────────────────────
  const setSetting = (key, value) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const openDays  = DAYS.filter(d => week[d]?.enabled).length;
  const closedDays = 7 - openDays;

  if (loading) {
    return (
      <div className="sch-page">
        <div className="sch-loading">
          <div className="sch-spinner" />
          <p>Loading your schedule…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sch-page">

      {/* ── Header ── */}
      <div className="sch-header">
        <div>
          <h1>📅 Manage Schedule</h1>
          <p>Control your working hours, breaks, blocked dates, and booking settings.</p>
        </div>
        <div className="sch-header-stats">
          <div className="sch-stat">
            <span className="sch-stat-n">{openDays}</span>
            <span className="sch-stat-l">Open days</span>
          </div>
          <div className="sch-stat">
            <span className="sch-stat-n">{blocked.length}</span>
            <span className="sch-stat-l">Blocked dates</span>
          </div>
          <div className="sch-stat">
            <span className="sch-stat-n">{settings.maxBookingsPerDay}</span>
            <span className="sch-stat-l">Max/day</span>
          </div>
        </div>
      </div>

      {/* ── Alerts ── */}
      {error && <div className="sch-alert error">{error}</div>}
      {saved && <div className="sch-alert success">✅ Schedule saved successfully!</div>}

      {/* ── Tabs ── */}
      <div className="sch-tabs">
        {[
          { key: 'hours',   label: '🕐 Weekly Hours' },
          { key: 'blocked', label: '🚫 Blocked Dates' },
          { key: 'settings',label: '⚙️ Settings' },
        ].map(t => (
          <button
            key={t.key}
            className={`sch-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════
          TAB 1 — Weekly Hours
          ════════════════════════════════════ */}
      {tab === 'hours' && (
        <div className="sch-section">

          {/* Presets */}
          <div className="sch-presets-bar">
            <span className="sch-presets-label">Quick presets:</span>
            {PRESETS.map(p => (
              <button key={p.label} className="sch-preset-btn" onClick={() => applyPreset(p)}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Day rows */}
          <div className="sch-week-card">
            {DAYS.map((day, idx) => {
              const d = week[day];
              return (
                <div key={day} className={`sch-day-row ${!d.enabled ? 'closed' : ''}`}>

                  {/* Left: toggle + name */}
                  <div className="sch-day-left">
                    <Toggle
                      id={`toggle-${day}`}
                      checked={d.enabled}
                      onChange={() => toggleDay(day)}
                    />
                    <div className="sch-day-name">
                      <span className="sch-day-full">{day}</span>
                      <span className="sch-day-short">{DAY_SHORT[day]}</span>
                    </div>
                  </div>

                  {/* Right: times or closed label */}
                  {d.enabled ? (
                    <div className="sch-day-right">
                      {/* Main hours */}
                      <div className="sch-hours-row">
                        <input
                          type="time" className="sch-time-input"
                          value={d.start}
                          onChange={e => setDayTime(day, 'start', e.target.value)}
                        />
                        <span className="sch-time-sep">–</span>
                        <input
                          type="time" className="sch-time-input"
                          value={d.end}
                          onChange={e => setDayTime(day, 'end', e.target.value)}
                        />
                        <button
                          className="sch-add-break-btn"
                          onClick={() => addBreak(day)}
                          title="Add break time"
                        >
                          + Break
                        </button>
                      </div>

                      {/* Break times */}
                      {(d.breaks || []).map((brk, i) => (
                        <div key={i} className="sch-break-row">
                          <span className="sch-break-label">Break</span>
                          <input
                            type="time" className="sch-time-input sm"
                            value={brk.start}
                            onChange={e => updateBreak(day, i, 'start', e.target.value)}
                          />
                          <span className="sch-time-sep">–</span>
                          <input
                            type="time" className="sch-time-input sm"
                            value={brk.end}
                            onChange={e => updateBreak(day, i, 'end', e.target.value)}
                          />
                          <button
                            className="sch-remove-btn"
                            onClick={() => removeBreak(day, i)}
                            title="Remove break"
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="sch-closed-label">Closed</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Week summary */}
          <div className="sch-week-summary">
            {DAYS.map(day => (
              <div key={day} className={`sch-week-dot ${week[day].enabled ? 'open' : 'closed'}`}>
                <div className="sch-week-dot-circle" />
                <span>{DAY_SHORT[day]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
          TAB 2 — Blocked Dates
          ════════════════════════════════════ */}
      {tab === 'blocked' && (
        <div className="sch-section">
          <p className="sch-section-hint">
            Block specific dates when you are unavailable — public holidays, vacations, or personal days.
            Customers will not be able to book on these dates.
          </p>

          {/* Add new blocked date */}
          <div className="sch-block-add">
            <div className="sch-block-add-row">
              <div className="sch-form-group">
                <label>Date <span className="sch-req">*</span></label>
                <input
                  type="date"
                  className="sch-input"
                  value={newBlockDate}
                  min={today()}
                  onChange={e => setNewBlockDate(e.target.value)}
                />
              </div>
              <div className="sch-form-group" style={{ flex: 2 }}>
                <label>Reason (optional)</label>
                <input
                  type="text"
                  className="sch-input"
                  placeholder="e.g. Public holiday, Vacation…"
                  value={newBlockNote}
                  onChange={e => setNewBlockNote(e.target.value)}
                />
              </div>
              <button
                className="sch-btn primary"
                onClick={addBlockedDate}
                disabled={!newBlockDate}
                style={{ alignSelf: 'flex-end' }}
              >
                Block Date
              </button>
            </div>
          </div>

          {/* Blocked list */}
          {blocked.length === 0 ? (
            <div className="sch-empty">
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📆</div>
              <p>No blocked dates. You're available on all working days.</p>
            </div>
          ) : (
            <div className="sch-blocked-list">
              {blocked.map(b => (
                <div key={b.date} className="sch-blocked-item">
                  <div className="sch-blocked-left">
                    <span className="sch-blocked-date">🚫 {fmtDate(b.date)}</span>
                    {b.note && <span className="sch-blocked-note">{b.note}</span>}
                  </div>
                  <button
                    className="sch-remove-btn"
                    onClick={() => removeBlockedDate(b.date)}
                    title="Remove block"
                  >✕ Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════
          TAB 3 — Settings
          ════════════════════════════════════ */}
      {tab === 'settings' && (
        <div className="sch-section">
          <p className="sch-section-hint">
            Fine-tune how your booking calendar works for customers.
          </p>

          <div className="sch-settings-grid">

            <div className="sch-setting-card">
              <div className="sch-setting-icon">⏱️</div>
              <div className="sch-setting-body">
                <label className="sch-setting-label">Buffer Time Between Appointments</label>
                <p className="sch-setting-hint">
                  Gap added after each booking so you can prepare for the next customer.
                </p>
                <div className="sch-setting-control">
                  <select
                    className="sch-select"
                    value={settings.bufferMinutes}
                    onChange={e => setSetting('bufferMinutes', Number(e.target.value))}
                  >
                    {[0,5,10,15,20,30,45,60].map(m => (
                      <option key={m} value={m}>{m === 0 ? 'No buffer' : `${m} minutes`}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="sch-setting-card">
              <div className="sch-setting-icon">📊</div>
              <div className="sch-setting-body">
                <label className="sch-setting-label">Maximum Bookings Per Day</label>
                <p className="sch-setting-hint">
                  Limit the total number of appointments that can be booked on any single day.
                </p>
                <div className="sch-setting-control">
                  <input
                    type="number" min="1" max="50"
                    className="sch-input narrow"
                    value={settings.maxBookingsPerDay}
                    onChange={e => setSetting('maxBookingsPerDay', Math.max(1, Number(e.target.value)))}
                  />
                  <span className="sch-setting-unit">bookings/day</span>
                </div>
              </div>
            </div>

            <div className="sch-setting-card">
              <div className="sch-setting-icon">📅</div>
              <div className="sch-setting-body">
                <label className="sch-setting-label">Booking Window</label>
                <p className="sch-setting-hint">
                  How far in advance customers can schedule appointments.
                </p>
                <div className="sch-setting-control">
                  <select
                    className="sch-select"
                    value={settings.bookingWindowDays}
                    onChange={e => setSetting('bookingWindowDays', Number(e.target.value))}
                  >
                    {[7,14,21,30,60,90].map(d => (
                      <option key={d} value={d}>{d} days ahead</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="sch-setting-card">
              <div className="sch-setting-icon">🔔</div>
              <div className="sch-setting-body">
                <label className="sch-setting-label">Minimum Notice Period</label>
                <p className="sch-setting-hint">
                  Minimum time before an appointment that a customer can book it.
                </p>
                <div className="sch-setting-control">
                  <select
                    className="sch-select"
                    value={settings.minNoticeHours}
                    onChange={e => setSetting('minNoticeHours', Number(e.target.value))}
                  >
                    {[1,2,3,4,6,12,24,48].map(h => (
                      <option key={h} value={h}>{h} {h === 1 ? 'hour' : 'hours'} notice</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* Summary */}
          <div className="sch-settings-summary">
            <h3>Current Configuration</h3>
            <ul>
              <li>Customers can book up to <strong>{settings.bookingWindowDays} days</strong> in advance</li>
              <li>Minimum <strong>{settings.minNoticeHours} hour{settings.minNoticeHours > 1 ? 's' : ''}</strong> notice required</li>
              <li>Maximum <strong>{settings.maxBookingsPerDay} bookings</strong> per day</li>
              <li><strong>{settings.bufferMinutes === 0 ? 'No buffer' : `${settings.bufferMinutes}-minute buffer`}</strong> between appointments</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Footer actions ── */}
      <div className="sch-footer">
        <button className="sch-btn secondary" onClick={() => {
          setWeek(DEFAULT_WEEK);
          setSettings(DEFAULT_SETTINGS);
        }}>
          Reset to Defaults
        </button>
        <button
          className="sch-btn primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <><span className="sch-btn-spinner" /> Saving…</>
          ) : saved ? (
            '✅ Saved'
          ) : (
            'Save Schedule'
          )}
        </button>
      </div>

    </div>
  );
};

export default ServiceProviderAvailability;
