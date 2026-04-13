import { useState, useEffect } from 'react';
import { serviceAPI } from '../../services/api';
import './Availability.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_SCHEDULE = DAYS.reduce((acc, day) => {
  acc[day] = { enabled: day !== 'Sunday', start: '09:00', end: '17:00' };
  return acc;
}, {});

const ServiceProviderAvailability = () => {
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await serviceAPI.getSchedule();
        if (res.data.data) {
          setSchedule({ ...DEFAULT_SCHEDULE, ...res.data.data });
        }
      } catch (err) {
        console.error('Failed to load schedule:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  const toggle = (day) => {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }));
  };

  const setTime = (day, field, value) => {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await serviceAPI.saveSchedule(schedule);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="avail-loading">Loading schedule...</div>;

  return (
    <div className="availability-page">
      <div className="availability-header">
        <h1>Availability Schedule</h1>
        <p>Set your working hours for each day of the week</p>
      </div>

      {error && <div className="avail-error">{error}</div>}
      {saved && <div className="avail-success">Schedule saved!</div>}

      <div className="availability-card">
        {DAYS.map((day) => (
          <div key={day} className={`availability-row ${!schedule[day].enabled ? 'disabled' : ''}`}>
            <div className="availability-day">
              <label className="availability-toggle">
                <input type="checkbox" checked={schedule[day].enabled} onChange={() => toggle(day)} />
                <span className="toggle-slider" />
              </label>
              <span className="day-name">{day}</span>
            </div>
            {schedule[day].enabled ? (
              <div className="availability-times">
                <input
                  type="time"
                  className="time-input"
                  value={schedule[day].start}
                  onChange={(e) => setTime(day, 'start', e.target.value)}
                />
                <span className="time-separator">to</span>
                <input
                  type="time"
                  className="time-input"
                  value={schedule[day].end}
                  onChange={(e) => setTime(day, 'end', e.target.value)}
                />
              </div>
            ) : (
              <span className="unavailable-label">Unavailable</span>
            )}
          </div>
        ))}
      </div>

      <div className="availability-actions">
        <button className="save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Schedule'}
        </button>
      </div>
    </div>
  );
};

export default ServiceProviderAvailability;
