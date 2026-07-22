import React from 'react';

export default function PhoneCallButton({ phoneNumber, label = 'Phone' }) {
  if (!phoneNumber) {
    return (
      <span className="phone-none" style={{ color: '#888', fontSize: '0.875rem' }}>
        No phone number on file
      </span>
    );
  }

  return (
    <div className="phone-call-container" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <span className="phone-number" style={{ fontFamily: 'monospace', fontWeight: 600, color: '#333' }}>
        {label ? `${label}: ` : ''}{phoneNumber}
      </span>
      <a
        href={`tel:${phoneNumber}`}
        className="phone-call-btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          backgroundColor: '#25d366',
          color: '#ffffff',
          borderRadius: '20px',
          textDecoration: 'none',
          fontSize: '0.85rem',
          fontWeight: 600,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        Call
      </a>
    </div>
  );
}
