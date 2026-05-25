import React, { useState } from 'react';

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

  const bodyTypes = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Truck', 'Wagon'];
  const fuelTypes = ['Gasoline', 'Hybrid', 'Electric', 'Diesel'];
  const transmissionTypes = ['Automatic', 'Manual', 'CVT'];
  const usageTypes = ['Daily Commuting', 'Weekend Trips', 'Family Use', 'Business', 'Adventure'];
  const featureOptions = ['Sunroof', 'Leather Seats', 'Navigation', 'Backup Camera', 'Bluetooth', 'Heated Seats', 'All-Wheel Drive', 'Premium Audio'];
  const lifestyleOptions = ['Urban Professional', 'Family Oriented', 'Adventure Seeker', 'Eco Conscious', 'Luxury Lover', 'Budget Conscious'];

  const mockRecommendations = [
    {
      id: 1,
      make: 'Toyota',
      model: 'Camry Hybrid',
      year: 2023,
      price: 'GH₵ 144,500',
      mpg: '52 city / 53 highway',
      image: '/placeholder-car.jpg',
      aiScore: 95,
      reasons: ['Excellent fuel economy', 'Reliable brand', 'Spacious interior', 'Advanced safety features'],
      pros: ['Outstanding reliability', 'Great resale value', 'Comfortable ride'],
      cons: ['Less exciting to drive', 'Road noise at highway speeds']
    },
    {
      id: 2,
      make: 'Honda',
      model: 'CR-V',
      year: 2023,
      price: 'GH₵ 161,750',
      mpg: '28 city / 34 highway',
      image: '/placeholder-car.jpg',
      aiScore: 92,
      reasons: ['Perfect for families', 'Great cargo space', 'All-wheel drive available', 'Honda reliability'],
      pros: ['Spacious interior', 'Good fuel economy', 'Strong resale value'],
      cons: ['CVT transmission feel', 'Engine noise under acceleration']
    },
    {
      id: 3,
      make: 'BMW',
      model: 'Model 3',
      year: 2023,
      price: 'GH₵ 194,950',
      mpg: '132 MPGe',
      image: '/placeholder-car.jpg',
      aiScore: 89,
      reasons: ['Zero emissions', 'Advanced technology', 'Supercharger network', 'Over-the-air updates'],
      pros: ['Instant acceleration', 'Minimal maintenance', 'Cutting-edge tech'],
      cons: ['Build quality concerns', 'Limited service centers']
    }
  ];

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

  const handleFindCars = async () => {
    setIsLoading(true);
    try {
      const { default: axios } = await import('../utils/axiosConfig.js');

      // Get current user from localStorage
      const userStr = localStorage.getItem('user') ||localStorage.getItem('userData');
      const user = userStr ? JSON.parse(userStr): null;
      const userId = user?.id || user?._id;

      console.log('User from localStorage:', user); // debug line
      console.log('userId:', userId); // debug line
      
      if (!userId){
        console.error('No user ID found');
        setIsLoading(false);
        return;
      }

      const res = await axios.get(`/api/recommendations/${userId}`);
      
      const recs = (res.data.recommendations || []).map((rec) => ({
        id: rec.vehicle_id,
        make: rec.make || 'Unknown',
        model: rec.model || '',
        year: rec.year || '',
        price: rec.price || '',
        mpg: rec.fuel_type || 'N/A',
        image: '/placeholder-car.jpg',
        aiScore: Math.round(rec.score *100) || 75,
        reasons: rec.reasons || ['Recommended based on your activity'],
        pros: ['Available now', 'Verified listing'],
        cons: [],
      }));
      setRecommendations(recs.length > 0 ? recs : []);
      if (recs.length === 0) {
        setRecommendations([{ id: 0, make: 'No', model: 'matches found', year: '', price: '', mpg: '', image: '', aiScore: 0, reasons: ['Try adjusting your preferences'], pros: [], cons: [] }]);
      }
      
    } catch (err) {
      console.error('AI recommendations error:', err);
      setRecommendations([]);
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
                    <option value="under-20k">Under $20,000</option>
                    <option value="20k-30k">$20,000 - $30,000</option>
                    <option value="30k-40k">$30,000 - $40,000</option>
                    <option value="40k-50k">$40,000 - $50,000</option>
                    <option value="50k-plus">$50,000+</option>
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
                  {recommendations.map((car) => (
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
                        backgroundColor: car.aiScore >= 90 ? '#00cc66' : car.aiScore >= 80 ? '#ff9800' : '#666',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        AI Score: {car.aiScore}%
                      </div>

                      <div style={{ display: 'flex', gap: '20px' }}>
                        <img 
                          src={car.image} 
                          alt={`${car.make} ${car.model}`}
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
                  ))}
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