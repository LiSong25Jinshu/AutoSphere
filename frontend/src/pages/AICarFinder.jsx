import React, { useState } from 'react';
import { resolveImageUrl } from '../utils/imageUtils';

const AICarFinder = () => {
  const [preferences, setPreferences] = useState({
    budget: '',
    bodyType: '',
    fuelType: '',
    transmission: '',
    usage: '',
    features: [],
    lifestyle: ''
  });

  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const bodyTypes = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Truck', 'Wagon'];
  const fuelTypes = ['Gasoline', 'Hybrid', 'Electric', 'Diesel'];
  const transmissionTypes = ['Automatic', 'Manual', 'CVT'];
  const usageTypes = ['Daily Commuting', 'Weekend Trips', 'Family Use', 'Business', 'Adventure'];
  const featureOptions = ['Sunroof', 'Leather Seats', 'Navigation', 'Backup Camera', 'Bluetooth', 'Heated Seats', 'All-Wheel Drive', 'Premium Audio'];
  const lifestyleOptions = ['Urban Professional', 'Family Oriented', 'Adventure Seeker', 'Eco Conscious', 'Luxury Lover', 'Budget Conscious'];

  const handleInputChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFeatureToggle = (feature) => {
    setPreferences(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const parseBudget = (budget) => {
    const map = {
      'under-200k': { min: 0, max: 200000 },
      '200k-300k': { min: 200000, max: 300000 },
      '300k-400k': { min: 300000, max: 400000 },
      '400k-500k': { min: 400000, max: 500000 },
      '500k-plus': { min: 500000, max: 9999999 }
    };
    return map[budget] || {};
  };

  const getMatchLabel = (matchStatus) => {
    switch (matchStatus) {
      case 'exact':
        return { label: 'Exact match', color: '#00cc66', description: 'This vehicle matches your preferences closely.' };
      case 'closest_match':
        return { label: 'Closest match', color: '#ff9800', description: 'This is the closest fit, with a few preferences not fully met.' };
      case 'best_available':
        return { label: 'Best available', color: '#4f46e5', description: 'This is the strongest option available from the current dataset.' };
      default:
        return { label: 'Recommended', color: '#666', description: 'Recommended based on your activity and preferences.' };
    }
  };

  const handleFindCars = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { default: axios } = await import('../utils/axiosConfig.js');

      // Get current user from localStorage
      const userStr = localStorage.getItem('user') ||localStorage.getItem('userData');
      const user = userStr ? JSON.parse(userStr): null;
      const userId = user?.id || user?._id;

      console.log('User from localStorage:', user); // debug line
      console.log('userId:', userId); // debug line
      
      if (!userId){
        setError('Please sign in before requesting recommendations.');
        return;
      }

      const budget = parseBudget(preferences.budget);

      const params = {
        ...(budget.min !== undefined && { budget_min: budget.min }),
        ...(budget.max !== undefined && { budget_max: budget.max }),
        ...(preferences.fuelType && { fuel_type: preferences.fuelType.toLowerCase() }),
        ...(preferences.bodyType && { body_type: preferences.bodyType.toLowerCase() }),
        ...(preferences.transmission && { transmission: preferences.transmission.toLowerCase() }),
        ...(preferences.usage && { usage: preferences.usage }),
        ...(preferences.lifestyle && { lifestyle: preferences.lifestyle }),
        ...(preferences.features.length > 0 && { features: preferences.features.join(',') }),
      };

      const res = await axios.get(`/api/recommendations/${userId}`, { params });
      
      const recs = (res.data.recommendations || []).map((rec) => {
        const matchStatus = rec.match_status || (rec.relaxed ? 'closest_match' : 'exact');
        return {
          id: rec.vehicle_id,
          make: rec.make || 'Unknown',
          model: rec.model || '',
          year: rec.year || '',
          price: rec.price || '',
          mpg: rec.fuel_type || 'N/A',
          image: resolveImageUrl(rec.image_url || rec.images?.[0]),
          images: rec.images || (rec.image_url ? [rec.image_url] : []),
          condition: rec.condition || null,
          aiScore: Math.round(rec.score * 100) || 75,
          matchStatus,
          relaxed: Boolean(rec.relaxed) || matchStatus !== 'exact',
          reasons: rec.reasons || ['Recommended based on your activity'],
          pros: Array.isArray(rec.features)
            ? rec.features
            : rec.features
              ? rec.features.split(';').map(f => f.trim()).filter(Boolean)
              : ['Available now', 'Verified listing'],
          cons: [],
        };
      });
      setRecommendations(recs.length > 0 ? recs : []);
      if (recs.length === 0) {
        setRecommendations([{ id: 0, make: 'No', model: 'matches found', year: '', price: '', mpg: '', image: '', aiScore: 0, reasons: ['Try adjusting your preferences'], pros: [], cons: [] }]);
      }
      
    } catch (err) {
      console.error('AI recommendations error:', err);
      setRecommendations([]);
      setError(err.response?.data?.message || 'Could not load AI recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPreferences = () => {
    setPreferences({
      budget: '',
      bodyType: '',
      fuelType: '',
      transmission: '',
      usage: '',
      features: [],
      lifestyle: ''
    });
    setRecommendations([]);
    setError('');
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <h1 className="dashboard-page-title">🤖 AI Car Finder</h1>
        <p className="dashboard-page-subtitle">
          Let our AI help you find the perfect car based on your preferences and lifestyle
        </p>
      </div>

      <div className="dashboard-page-content">
        <div className="dashboard-grid dashboard-grid-2">
          {/* Preferences Panel */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title">Your Preferences</h2>
              <button 
                onClick={resetPreferences}
                className="autosphere-btn-secondary"
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                Reset
              </button>
            </div>
            <div className="dashboard-card-content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Budget */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Budget Range
                  </label>
                  <select
                    value={preferences.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #e6e6e6', borderRadius: '8px' }}
                  >
                    <option value="">Select budget range</option>
                    <option value="under-200k">Under GHC200,000</option>
                    <option value="200k-300k">GHC200,000 - GHC300,000</option>
                    <option value="300k-400k">GHC300,000 - GHC400,000</option>
                    <option value="400k-500k">GHC400,000 - GHC500,000</option>
                    <option value="500k-plus">GHC500,000+</option>
                  </select>
                </div>

                {/* Body Type */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Body Type
                  </label>
                  <select
                    value={preferences.bodyType}
                    onChange={(e) => handleInputChange('bodyType', e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #e6e6e6', borderRadius: '8px' }}
                  >
                    <option value="">Select body type</option>
                    {bodyTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Fuel Type */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Fuel Type
                  </label>
                  <select
                    value={preferences.fuelType}
                    onChange={(e) => handleInputChange('fuelType', e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #e6e6e6', borderRadius: '8px' }}
                  >
                    <option value="">Select fuel type</option>
                    {fuelTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Primary Usage */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Primary Usage
                  </label>
                  <select
                    value={preferences.usage}
                    onChange={(e) => handleInputChange('usage', e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #e6e6e6', borderRadius: '8px' }}
                  >
                    <option value="">Select primary usage</option>
                    {usageTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Lifestyle */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Lifestyle
                  </label>
                  <select
                    value={preferences.lifestyle}
                    onChange={(e) => handleInputChange('lifestyle', e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #e6e6e6', borderRadius: '8px' }}
                  >
                    <option value="">Select lifestyle</option>
                    {lifestyleOptions.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Features */}
                <div>
                  <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>
                    Desired Features
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {featureOptions.map(feature => (
                      <label key={feature} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={preferences.features.includes(feature)}
                          onChange={() => handleFeatureToggle(feature)}
                          style={{ marginRight: '8px' }}
                        />
                        <span style={{ fontSize: '14px' }}>{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Find Cars Button */}
                <button
                  onClick={handleFindCars}
                  disabled={isLoading}
                  className="autosphere-btn-primary"
                  style={{ 
                    width: '100%', 
                    padding: '16px', 
                    fontSize: '16px',
                    opacity: isLoading ? 0.7 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isLoading ? '🤖 AI is thinking...' : '🔍 Find My Perfect Car'}
                </button>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title">AI Recommendations</h2>
              {recommendations.length > 0 && (
                <span style={{ 
                  backgroundColor: '#00cc66', 
                  color: 'white', 
                  padding: '4px 12px', 
                  borderRadius: '16px', 
                  fontSize: '14px' 
                }}>
                  {recommendations.length} matches found
                </span>
              )}
            </div>
            <div className="dashboard-card-content">
              {error && (
                <div role="alert" style={{ color: '#b42318', backgroundColor: '#fff1f0', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
                  {error}
                </div>
              )}
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
                  <h3>AI is analyzing your preferences...</h3>
                  <p style={{ color: '#666', marginTop: '8px' }}>
                    Comparing thousands of vehicles to find your perfect match
                  </p>
                  <div style={{ 
                    width: '100%', 
                    height: '4px', 
                    backgroundColor: '#e6e6e6', 
                    borderRadius: '2px', 
                    marginTop: '24px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: '30%', 
                      height: '100%', 
                      backgroundColor: '#2c2c2c',
                      animation: 'loading 2s infinite'
                    }}></div>
                  </div>
                </div>
              ) : recommendations.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {recommendations.map((car) => {
                    const matchInfo = getMatchLabel(car.matchStatus);
                    return (
                    <div key={car.id} style={{ 
                      border: '1px solid #e6e6e6', 
                      borderRadius: '12px', 
                      padding: '20px',
                      position: 'relative'
                    }}>
                      {/* AI Score Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        backgroundColor: matchInfo.color,
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        {matchInfo.label}: {car.aiScore}%
                      </div>

                      <div style={{ display: 'flex', gap: '20px' }}>
                        <img
                          src={car.image} 
                          alt={`${car.make} ${car.model}`}
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = '/images/placeholder-car.svg';
                          }}
                          style={{ 
                            width: '120px', 
                            height: '80px', 
                            objectFit: 'cover', 
                            borderRadius: '8px',
                            backgroundColor: '#f0f0f0'
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>
                            {car.year} {car.make} {car.model}
                          </h3>
                          <div style={{ marginBottom: '8px', fontSize: '12px', color: matchInfo.color, fontWeight: 600 }}>
                            {matchInfo.description}
                          </div>
                          <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
                            <span style={{ fontWeight: '600', fontSize: '18px', color: '#2c2c2c' }}>
                              {car.price}
                            </span>
                            <span style={{ color: '#666' }}>{car.mpg}</span>
                          </div>
                          
                          <div style={{ marginBottom: '12px' }}>
                            <strong style={{ fontSize: '14px', color: '#2c2c2c' }}>Why AI recommends this:</strong>
                            <ul style={{ margin: '4px 0 0 20px', fontSize: '14px', color: '#666' }}>
                              {car.reasons.map((reason, index) => (
                                <li key={index}>{reason}</li>
                              ))}
                            </ul>
                          </div>

                          <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
                            <div>
                              <strong style={{ color: '#00cc66' }}>Pros:</strong>
                              <ul style={{ margin: '4px 0 0 16px', color: '#666' }}>
                                {car.pros.map((pro, index) => (
                                  <li key={index}>{pro}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <strong style={{ color: '#ff6600' }}>Cons:</strong>
                              <ul style={{ margin: '4px 0 0 16px', color: '#666' }}>
                                {car.cons.map((con, index) => (
                                  <li key={index}>{con}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                            <button className="autosphere-btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                              View Details
                            </button>
                            <button className="autosphere-btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                              Save to Favorites
                            </button>
                            <button className="autosphere-btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                              Schedule Test Drive
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚗</div>
                  <h3>Ready to find your perfect car?</h3>
                  <p style={{ marginTop: '8px' }}>
                    Fill out your preferences on the left and let our AI do the work!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
};

export default AICarFinder;