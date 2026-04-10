import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';

const ServiceProviderSearch = ({ onProviderSelect, selectedServiceType }) => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await userAPI.getServiceProviders();
        if (res.data.success) {
          setProviders(res.data.data);
        }
      } catch (err) {
        setError('Failed to load service providers');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = providers.filter((p) => {
    const name = `${p.firstName} ${p.lastName}`.toLowerCase();
    return !search || name.includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <div style={{ padding: '1rem', textAlign: 'center' }}>Loading providers...</div>;
  if (error) return <div style={{ padding: '1rem', color: '#d32f2f' }}>{error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <input
        type="text"
        placeholder="Search service providers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: '0.75rem 1rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem' }}
      />

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          No service providers found
        </div>
      ) : (
        filtered.map((p) => (
          <div
            key={p.id}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#fff',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                {p.firstName} {p.lastName}
              </div>
              <div style={{ color: '#666', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {p.email}
                {p.phone && ` · ${p.phone}`}
              </div>
              {p.bio && (
                <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  {p.bio}
                </div>
              )}
            </div>
            <button
              onClick={() => onProviderSelect?.(p)}
              style={{
                background: '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1.25rem',
                cursor: 'pointer',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              Select
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default ServiceProviderSearch;
