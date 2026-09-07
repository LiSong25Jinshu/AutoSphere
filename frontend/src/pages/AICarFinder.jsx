/**
 * AI Car Finder
 *
 * The backend /api/recommendations endpoint now resolves all AI vehicle IDs
 * (including "kaggle_N" synthetic IDs) to real PostgreSQL integer IDs and
 * sets canInteract=true|false on each recommendation.
 *
 * - canInteract: true  → vehicle exists in DB; all buttons work
 * - canInteract: false → vehicle only exists in AI CSV data; show info only
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveImageUrl } from '../utils/imageUtils';
import { favoritesAPI, rentalAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// ─── helpers ──────────────────────────────────────────────────────────────────
const parseBudget = (budget) => ({
  'under-200k': { min: 0,      max: 200000  },
  '200k-300k':  { min: 200000, max: 300000  },
  '300k-400k':  { min: 300000, max: 400000  },
  '400k-500k':  { min: 400000, max: 500000  },
  '500k-plus':  { min: 500000, max: 9999999 },
}[budget] || {});

const getMatchLabel = (ms) => ({
  exact:          { label: 'Exact match',    color: '#00cc66' },
  closest_match:  { label: 'Closest match',  color: '#ff9800' },
  best_available: { label: 'Best available', color: '#4f46e5' },
}[ms] || { label: 'Recommended', color: '#666' });

const TODAY      = new Date().toISOString().split('T')[0];
const TIME_SLOTS = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'];

// ─── TestDriveModal ───────────────────────────────────────────────────────────
const TestDriveModal = ({ car, onClose, onSuccess }) => {
  const [form, setForm]           = useState({ date: '', time: '', notes: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr]             = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date || !form.time) { setErr('Please select a date and time.'); return; }
    if (new Date(form.date) < new Date()) { setErr('Please choose a future date.'); return; }
    setSubmitting(true);
    setErr('');
    try {
      await rentalAPI.scheduleTestDrive({
        vehicleId:     car.id,          // always a real DB integer at this point
        scheduledDate: form.date,
        scheduledTime: form.time,
        notes:         form.notes   || undefined,
        contactPhone:  form.phone   || undefined,
      });
      onSuccess(`Test drive for ${car.year} ${car.make} ${car.model} scheduled! The dealer will confirm shortly.`);
      onClose();
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Failed to schedule test drive. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHead}>
          <h3 style={{ margin: 0 }}>🔑 Schedule Test Drive</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>
        <p style={{ margin: '0 0 16px', color: '#555', fontSize: 14 }}>
          <strong>{car.year} {car.make} {car.model}</strong>
        </p>

        {err && <div style={styles.errBox}>{err}</div>}

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Date <span style={{ color:'#e53935' }}>*</span></label>
          <input type="date" min={TODAY} required style={styles.input}
            value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />

          <label style={styles.label}>Time <span style={{ color:'#e53935' }}>*</span></label>
          <select required style={styles.input}
            value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}>
            <option value="">Select a time…</option>
            {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <label style={styles.label}>Contact Phone (optional)</label>
          <input type="tel" placeholder="+233 …" style={styles.input}
            value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />

          <label style={styles.label}>Notes (optional)</label>
          <textarea rows={3} placeholder="Any special requests…"
            style={{ ...styles.input, resize: 'vertical' }}
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />

          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <button type="button" onClick={onClose} style={styles.btnSecondary}>Cancel</button>
            <button type="submit" disabled={submitting} style={styles.btnPrimary}>
              {submitting ? 'Scheduling…' : '✅ Confirm Test Drive'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const AICarFinder = () => {
  const navigate          = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [preferences, setPreferences] = useState({
    budget:'', bodyType:'', fuelType:'', transmission:'',
    usage:'', features:[], lifestyle:'',
  });
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState('');
  const [toast, setToast]           = useState('');
  const [favIds, setFavIds]         = useState(new Set());
  const [favLoading, setFavLoading] = useState(new Set());
  const [tdCar, setTdCar]           = useState(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }, []);

  // Load favorited IDs on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    favoritesAPI.getIds()
      .then(res => { if (res.data?.success) setFavIds(new Set(res.data.data)); })
      .catch(() => {});
  }, [isAuthenticated]);

  const setField      = (k, v) => setPreferences(p => ({ ...p, [k]: v }));
  const toggleFeature = (f) => setPreferences(p => ({
    ...p,
    features: p.features.includes(f) ? p.features.filter(x => x !== f) : [...p.features, f],
  }));

  // ── Get recommendations ───────────────────────────────────────────────────
  const handleFindCars = async () => {
    if (!isAuthenticated) { setError('Please sign in before requesting recommendations.'); return; }
    setIsLoading(true);
    setError('');
    try {
      const { default: axios } = await import('../utils/axiosConfig.js');
      const userId = user?.id;
      if (!userId) { setError('Please sign in.'); return; }

      const budget = parseBudget(preferences.budget);
      const params = {
        ...(budget.min !== undefined && { budget_min: budget.min }),
        ...(budget.max !== undefined && { budget_max: budget.max }),
        ...(preferences.fuelType     && { fuel_type:    preferences.fuelType.toLowerCase() }),
        ...(preferences.bodyType     && { body_type:    preferences.bodyType.toLowerCase() }),
        ...(preferences.transmission && { transmission: preferences.transmission.toLowerCase() }),
        ...(preferences.usage        && { usage:        preferences.usage }),
        ...(preferences.lifestyle    && { lifestyle:    preferences.lifestyle }),
        ...(preferences.features.length > 0 && { features: preferences.features.join(',') }),
      };

      const { data } = await axios.get(`/api/recommendations/${userId}`, { params });

      if (!data.success && data.source === 'unavailable') {
        setError('AI recommendations are temporarily unavailable. Please try again later.');
        setRecommendations([]);
        return;
      }

      const recs = (data.recommendations || []).map((rec) => {
        const matchStatus = rec.match_status || (rec.relaxed ? 'closest_match' : 'exact');

        // vehicle_id is now always a DB integer (or null) — set by recommendations.js
        const dbId       = rec.vehicle_id != null ? Number(rec.vehicle_id) : null;
        const canInteract = rec.canInteract === true && dbId !== null && !isNaN(dbId);

        return {
          id:          dbId,          // integer PK used for all API calls
          canInteract,                // false → show info only, disable buttons
          make:        rec.make  || 'Unknown',
          model:       rec.model || '',
          year:        rec.year  || '',
          price:       rec.price || '',
          mpg:         rec.fuel_type || 'N/A',
          image:       resolveImageUrl(rec.image_url || rec.images?.[0]),
          aiScore:     Math.round((rec.score || 0) * 100) || 75,
          matchStatus,
          reasons:     rec.reasons || ['Recommended based on your activity'],
          pros: Array.isArray(rec.features)
            ? rec.features
            : (rec.features || '')
                .split(';').map(f => f.trim()).filter(Boolean)
              || ['Available now', 'Verified listing'],
          cons: [],
        };
      });

      setRecommendations(recs);
      if (recs.length === 0) setError('No matches found. Try adjusting your preferences.');
    } catch (ex) {
      console.error('AI recommendations error:', ex);
      setError(ex.response?.data?.message || 'Could not load recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Favorites ─────────────────────────────────────────────────────────────
  const handleFavorite = async (car) => {
    if (!isAuthenticated) { showToast('Please sign in to save favorites.'); return; }
    if (!car.canInteract || car.id == null) {
      showToast('This vehicle is not yet in the marketplace catalog.');
      return;
    }
    const isFav = favIds.has(car.id);
    setFavLoading(s => new Set([...s, car.id]));
    try {
      if (isFav) {
        await favoritesAPI.remove(car.id);
        setFavIds(s => { const n = new Set(s); n.delete(car.id); return n; });
        showToast(`Removed ${car.make} ${car.model} from favorites.`);
      } else {
        await favoritesAPI.save(car.id);
        setFavIds(s => new Set([...s, car.id]));
        showToast(`✅ ${car.make} ${car.model} saved to favorites!`);
      }
    } catch (ex) {
      showToast(ex.response?.data?.message || 'Could not update favorites.');
    } finally {
      setFavLoading(s => { const n = new Set(s); n.delete(car.id); return n; });
    }
  };

  // ── Test-drive ────────────────────────────────────────────────────────────
  const handleTestDrive = (car) => {
    if (!isAuthenticated) { showToast('Please sign in to schedule a test drive.'); return; }
    if (!car.canInteract || car.id == null) {
      showToast('This vehicle is not in the marketplace catalog and cannot be test-driven online.');
      return;
    }
    setTdCar(car);
  };

  const BODY_TYPES    = ['Sedan','SUV','Hatchback','Coupe','Convertible','Truck','Wagon'];
  const FUEL_TYPES    = ['Gasoline','Hybrid','Electric','Diesel'];
  const TRANSMISSIONS = ['Automatic','Manual','CVT'];
  const USAGE_TYPES   = ['Daily Commuting','Weekend Trips','Family Use','Business','Adventure'];
  const LIFESTYLE_OPTS= ['Urban Professional','Family Oriented','Adventure Seeker','Eco Conscious','Luxury Lover','Budget Conscious'];
  const FEATURE_OPTS  = ['Sunroof','Leather Seats','Navigation','Backup Camera','Bluetooth','Heated Seats','All-Wheel Drive','Premium Audio'];

  return (
    <div className="dashboard-page">
      {toast && <div style={styles.toast}>{toast}</div>}

      <div className="dashboard-page-header">
        <h1 className="dashboard-page-title">🤖 AI Car Finder</h1>
        <p className="dashboard-page-subtitle">
          Let our AI help you find the perfect car based on your preferences and lifestyle
        </p>
      </div>

      <div className="dashboard-page-content">
        <div className="dashboard-grid dashboard-grid-2">

          {/* Preferences */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title">Your Preferences</h2>
              <button
                onClick={() => {
                  setPreferences({ budget:'',bodyType:'',fuelType:'',transmission:'',usage:'',features:[],lifestyle:'' });
                  setRecommendations([]); setError('');
                }}
                className="autosphere-btn-secondary"
                style={{ padding:'8px 16px', fontSize:14 }}
              >Reset</button>
            </div>
            <div className="dashboard-card-content">
              <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
                {[
                  ['budget', 'Budget Range', [
                    ['','Select budget range'],['under-200k','Under GHC 200,000'],
                    ['200k-300k','GHC 200,000 – 300,000'],['300k-400k','GHC 300,000 – 400,000'],
                    ['400k-500k','GHC 400,000 – 500,000'],['500k-plus','GHC 500,000+'],
                  ]],
                  ['bodyType',     'Body Type',    [['','Select body type'], ...BODY_TYPES.map(t=>[t,t])]],
                  ['fuelType',     'Fuel Type',    [['','Select fuel type'], ...FUEL_TYPES.map(t=>[t,t])]],
                  ['transmission', 'Transmission', [['','Select transmission'], ...TRANSMISSIONS.map(t=>[t,t])]],
                  ['usage',        'Primary Usage',[['','Select primary usage'], ...USAGE_TYPES.map(t=>[t,t])]],
                  ['lifestyle',    'Lifestyle',    [['','Select lifestyle'], ...LIFESTYLE_OPTS.map(t=>[t,t])]],
                ].map(([field, label, opts]) => (
                  <div key={field}>
                    <label style={styles.label}>{label}</label>
                    <select value={preferences[field]}
                      onChange={e => setField(field, e.target.value)} style={styles.select}>
                      {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                ))}

                <div>
                  <label style={styles.label}>Desired Features</label>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginTop:6 }}>
                    {FEATURE_OPTS.map(f => (
                      <label key={f} style={{ display:'flex', alignItems:'center', cursor:'pointer', fontSize:14 }}>
                        <input type="checkbox" checked={preferences.features.includes(f)}
                          onChange={() => toggleFeature(f)} style={{ marginRight:8 }} />
                        {f}
                      </label>
                    ))}
                  </div>
                </div>

                <button onClick={handleFindCars} disabled={isLoading}
                  className="autosphere-btn-primary"
                  style={{ width:'100%', padding:16, fontSize:16, opacity: isLoading ? 0.7 : 1 }}>
                  {isLoading ? '🤖 AI is thinking…' : '🔍 Find My Perfect Car'}
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title">AI Recommendations</h2>
              {recommendations.length > 0 && (
                <span style={{ background:'#00cc66', color:'#fff', padding:'4px 12px', borderRadius:16, fontSize:14 }}>
                  {recommendations.length} match{recommendations.length !== 1 ? 'es' : ''} found
                </span>
              )}
            </div>
            <div className="dashboard-card-content">
              {error && (
                <div role="alert" style={{ color:'#b42318', background:'#fff1f0', padding:'12px 16px', borderRadius:8, marginBottom:16 }}>
                  {error}
                </div>
              )}

              {isLoading ? (
                <div style={{ textAlign:'center', padding:'60px 20px' }}>
                  <div style={{ fontSize:48, marginBottom:16 }}>🤖</div>
                  <h3>AI is analysing your preferences…</h3>
                  <p style={{ color:'#666', marginTop:8 }}>Comparing thousands of vehicles to find your perfect match</p>
                </div>
              ) : recommendations.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
                  {recommendations.map((car, idx) => {
                    const mi      = getMatchLabel(car.matchStatus);
                    const isFav   = car.id != null && favIds.has(car.id);
                    const favBusy = car.id != null && favLoading.has(car.id);

                    return (
                      <div key={car.id ?? `rec-${idx}`} style={styles.carCard}>
                        <div style={{ ...styles.scoreBadge, background: mi.color }}>
                          {mi.label}: {car.aiScore}%
                        </div>

                        <div style={{ display:'flex', gap:20 }}>
                          <img src={car.image}
                            alt={`${car.make} ${car.model}`}
                            onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/placeholder-car.svg'; }}
                            style={{ width:120, height:80, objectFit:'cover', borderRadius:8, background:'#f0f0f0', flexShrink:0 }}
                          />
                          <div style={{ flex:1, minWidth:0 }}>
                            <h3 style={{ margin:'0 0 4px', fontSize:18, paddingRight:110 }}>
                              {car.year} {car.make} {car.model}
                            </h3>
                            <div style={{ display:'flex', gap:16, marginBottom:10 }}>
                              <span style={{ fontWeight:700, fontSize:17 }}>{car.price}</span>
                              <span style={{ color:'#666', fontSize:14 }}>{car.mpg}</span>
                            </div>

                            <div style={{ marginBottom:10 }}>
                              <strong style={{ fontSize:13 }}>Why AI recommends this:</strong>
                              <ul style={{ margin:'4px 0 0 18px', fontSize:13, color:'#555' }}>
                                {(car.reasons || []).map((r, i) => <li key={i}>{r}</li>)}
                              </ul>
                            </div>

                            {car.pros.length > 0 && (
                              <div style={{ fontSize:13 }}>
                                <strong style={{ color:'#00cc66' }}>Pros: </strong>
                                {car.pros.slice(0, 3).join(' · ')}
                              </div>
                            )}

                            {/* ── Action buttons ── */}
                            <div style={{ marginTop:14, display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                              {car.canInteract ? (
                                <>
                                  {/* View Details — navigate to real vehicle page */}
                                  <button className="autosphere-btn-primary"
                                    style={{ padding:'8px 14px', fontSize:13 }}
                                    onClick={() => navigate(`/vehicles/${car.id}`)}>
                                    View Details
                                  </button>

                                  {/* Save to Favorites */}
                                  <button className="autosphere-btn-secondary"
                                    style={{ padding:'8px 14px', fontSize:13, opacity: favBusy ? 0.6 : 1 }}
                                    disabled={favBusy}
                                    onClick={() => handleFavorite(car)}>
                                    {favBusy ? '…' : isFav ? '❤️ Saved' : '🤍 Save'}
                                  </button>

                                  {/* Schedule Test Drive */}
                                  <button className="autosphere-btn-secondary"
                                    style={{ padding:'8px 14px', fontSize:13 }}
                                    onClick={() => handleTestDrive(car)}>
                                    🔑 Test Drive
                                  </button>
                                </>
                              ) : (
                                /* Vehicle exists in AI dataset only, not yet seeded to DB */
                                <span style={{
                                  fontSize:12, color:'#888', background:'#f5f5f5',
                                  padding:'6px 12px', borderRadius:6, display:'inline-block'
                                }}>
                                  🔍 AI-only suggestion — not yet in marketplace
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign:'center', padding:'60px 20px', color:'#666' }}>
                  <div style={{ fontSize:48, marginBottom:16 }}>🚗</div>
                  <h3>Ready to find your perfect car?</h3>
                  <p style={{ marginTop:8 }}>Fill out your preferences on the left and let our AI do the work!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {tdCar && (
        <TestDriveModal
          car={tdCar}
          onClose={() => setTdCar(null)}
          onSuccess={showToast}
        />
      )}
    </div>
  );
};

const styles = {
  label:       { display:'block', marginBottom:6, fontWeight:600, fontSize:14 },
  select:      { width:'100%', padding:'11px 12px', border:'1px solid #e6e6e6', borderRadius:8, fontSize:14 },
  input:       { width:'100%', padding:'11px 12px', border:'1px solid #ddd', borderRadius:8, fontSize:14, marginBottom:14, boxSizing:'border-box' },
  carCard:     { border:'1px solid #e6e6e6', borderRadius:12, padding:20, position:'relative' },
  scoreBadge:  { position:'absolute', top:14, right:14, color:'#fff', padding:'5px 11px', borderRadius:20, fontSize:13, fontWeight:600 },
  overlay:     { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  modal:       { background:'#fff', borderRadius:12, padding:28, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto' },
  modalHead:   { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 },
  closeBtn:    { background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#666', lineHeight:1 },
  errBox:      { background:'#fff1f0', color:'#b42318', padding:'10px 14px', borderRadius:8, fontSize:14, marginBottom:14 },
  btnPrimary:  { flex:1, padding:'11px 0', background:'#2c2c2c', color:'#fff', border:'none', borderRadius:8, fontSize:15, cursor:'pointer', fontWeight:600 },
  btnSecondary:{ flex:1, padding:'11px 0', background:'#f0f0f0', color:'#333', border:'none', borderRadius:8, fontSize:15, cursor:'pointer' },
  toast:       { position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'#1a1a1a', color:'#fff', padding:'12px 24px', borderRadius:8, fontSize:14, zIndex:2000, boxShadow:'0 4px 12px rgba(0,0,0,.3)', maxWidth:420, textAlign:'center' },
};

export default AICarFinder;
