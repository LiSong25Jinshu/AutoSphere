import React from 'react';

export default function GaugeArc({ value = 0.5, size = 140 }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Semi-circle arc length
  const strokeDashoffset = circumference * (1 - Math.min(Math.max(value, 0), 1));
  const angle = -90 + value * 180; // Needle angle from -90deg to +90deg

  return (
    <div className="gauge-arc-wrapper" style={{ width: size, height: size / 2 + 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        {/* Background Track Arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Active Value Arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="#1976d2"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        {/* Center Pivot */}
        <circle cx={size / 2} cy={size / 2} r="6" fill="#1976d2" />
        {/* Sweeping Needle */}
        <line
          x1={size / 2}
          y1={size / 2}
          x2={size / 2 + (radius - 12) * Math.cos((angle * Math.PI) / 180)}
          y2={size / 2 + (radius - 12) * Math.sin((angle * Math.PI) / 180)}
          stroke="#1976d2"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ transition: 'all 0.6s ease' }}
        />
      </svg>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1976d2', marginTop: '4px' }}>
        {Math.round(value * 100)}% Complete
      </span>
    </div>
  );
}
