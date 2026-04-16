import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';

const STATUS_COLORS = {
  pending: '#ff9800',
  approved: '#4caf50',
  flagged: '#f44336',
  blocked: '#9e9e9e',
};

const ContentModeration = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getModerationItems();
      setItems(res.data?.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load moderation queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openAction = (item, act) => {
    setSelected(item);
    setAction(act);
    setReason('');
    setActionMsg(null);
  };

  const closeDialog = () => {
    setSelected(null);
    setAction('');
    setReason('');
    setActionMsg(null);
  };

  const handleSubmit = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await adminAPI.moderateContent(selected.id, action, reason);
      setItems((prev) =>
        prev.map((i) =>
          i.id === selected.id
            ? { ...i, status: action === 'approve' ? 'approved' : action === 'block' ? 'blocked' : i.status }
            : i
        ).filter((i) => action !== 'delete' || i.id !== selected.id)
      );
      setActionMsg({ type: 'success', text: `Content ${action}d successfully` });
      setTimeout(closeDialog, 1500);
    } catch (e) {
      setActionMsg({ type: 'error', text: e.response?.data?.message || 'Action failed' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Content Moderation</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.875rem' }}>
            Review flagged vehicle listings, reviews, and messages
          </p>
        </div>
        <button
          onClick={fetchItems}
          disabled={loading}
          style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', background: '#fff' }}
        >
          {loading ? '...' : '🔄 Refresh'}
        </button>
      </div>

      {loading && <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Loading moderation queue...</div>}
      {error && (
        <div style={{ padding: '1rem', background: '#ffebee', color: '#c62828', borderRadius: 8, marginBottom: '1rem' }}>
          {error} <button onClick={fetchItems} style={{ marginLeft: 8 }}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {['Type', 'Title', 'Author', 'Status', 'Reports', 'Date', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #e0e0e0' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ padding: '2px 8px', background: '#e3f2fd', color: '#1565c0', borderRadius: 12, fontSize: '0.75rem' }}>
                      {item.type}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#555' }}>{item.author}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      padding: '2px 8px',
                      background: STATUS_COLORS[item.status] || '#9e9e9e',
                      color: '#fff',
                      borderRadius: 12,
                      fontSize: '0.75rem',
                      textTransform: 'capitalize',
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      padding: '2px 8px',
                      background: item.reportCount > 3 ? '#ffebee' : item.reportCount > 0 ? '#fff3e0' : '#e8f5e9',
                      color: item.reportCount > 3 ? '#c62828' : item.reportCount > 0 ? '#e65100' : '#2e7d32',
                      borderRadius: 12,
                      fontSize: '0.75rem',
                    }}>
                      {item.reportCount}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#666', fontSize: '0.8125rem' }}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => openAction(item, 'view')}
                        style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', background: '#fff', fontSize: '0.75rem' }}>
                        👁️
                      </button>
                      {item.status === 'pending' && (
                        <>
                          <button onClick={() => openAction(item, 'approve')}
                            style={{ padding: '4px 8px', border: 'none', borderRadius: 4, cursor: 'pointer', background: '#4caf50', color: '#fff', fontSize: '0.75rem' }}>
                            ✓
                          </button>
                          <button onClick={() => openAction(item, 'block')}
                            style={{ padding: '4px 8px', border: 'none', borderRadius: 4, cursor: 'pointer', background: '#ff9800', color: '#fff', fontSize: '0.75rem' }}>
                            🚫
                          </button>
                        </>
                      )}
                      <button onClick={() => openAction(item, 'delete')}
                        style={{ padding: '4px 8px', border: 'none', borderRadius: 4, cursor: 'pointer', background: '#f44336', color: '#fff', fontSize: '0.75rem' }}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    No items in moderation queue
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Action dialog */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
        }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', width: 480, maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 1rem' }}>
              {action === 'view' ? 'Content Details' : `${action.charAt(0).toUpperCase() + action.slice(1)} Content`}
            </h3>

            <div style={{ marginBottom: '1rem' }}>
              <strong>{selected.title}</strong>
              <div style={{ color: '#666', fontSize: '0.875rem', marginTop: 4 }}>By: {selected.author}</div>
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f5f5f5', borderRadius: 8, fontSize: '0.875rem' }}>
                {selected.content}
              </div>
            </div>

            {actionMsg && (
              <div style={{
                padding: '0.75rem', borderRadius: 8, marginBottom: '1rem',
                background: actionMsg.type === 'success' ? '#e8f5e9' : '#ffebee',
                color: actionMsg.type === 'success' ? '#2e7d32' : '#c62828',
              }}>
                {actionMsg.text}
              </div>
            )}

            {action !== 'view' && !actionMsg && (
              <textarea
                placeholder="Reason (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: 8, resize: 'vertical', boxSizing: 'border-box', marginBottom: '1rem' }}
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={closeDialog}
                style={{ padding: '8px 20px', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', background: '#fff' }}>
                {action === 'view' ? 'Close' : 'Cancel'}
              </button>
              {action !== 'view' && !actionMsg && (
                <button
                  onClick={handleSubmit}
                  disabled={actionLoading}
                  style={{
                    padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer',
                    background: action === 'delete' ? '#f44336' : action === 'approve' ? '#4caf50' : '#ff9800',
                    color: '#fff', fontWeight: 600,
                  }}>
                  {actionLoading ? 'Processing...' : action.charAt(0).toUpperCase() + action.slice(1)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentModeration;
