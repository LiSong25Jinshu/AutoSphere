import { useState } from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const defaultSchedule = DAYS.reduce((acc, day) => {
  acc[day] = { enabled: day !== 'Sunday', start: '09:00', end: '17:00' };
  return acc;
}, {});

const ServiceProviderAvailability = () => {
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [saved, setSaved] = useState(false);

  const toggle = (day) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  const setTime = (day, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '700px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '24px' }}>
        Availability Schedule
      </h1>
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {DAYS.map((day) => (
          <div key={day} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #f0f0f0', opacity: schedule[day].enabled ? 1 : 0.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '160px' }}>
              <input type="checkbox" checked={schedule[day].enabled} onChange={() => toggle(day)} />
              <span style={{ fontWeight: 500 }}>{day}</span>
            </div>
            {schedule[day].enabled ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="time" value={schedule[day].start} onChange={(e) => setTime(day, 'start', e.target.value)} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: '6px' }} />
                <span>to</span>
                <input type="time" value={schedule[day].end} onChange={(e) => setTime(day, 'end', e.target.value)} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>
            ) : (
              <span style={{ color: '#999', fontStyle: 'italic' }}>Unavailable</span>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleSave} style={{ padding: '10px 28px', background: '#2c2c2c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
          {saved ? 'Saved' : 'Save Schedule'}
        </button>
      </div>
    </div>
  );
};

export default ServiceProviderAvailability;
