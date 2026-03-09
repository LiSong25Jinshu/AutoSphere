import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import GoogleLoginButton from '../../components/GoogleLoginButton';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Demo credentials for different roles
  const demoCredentials = {
    user: { email: 'user@autosphere.com', password: 'user123' },
    dealer: { email: 'dealer@autosphere.com', password: 'dealer123' },
    'service-provider': { email: 'provider@autosphere.com', password: 'provider123' },
    admin: { email: 'admin@autosphere.com', password: 'admin123' }
  };

  useEffect(() => {
    // Auto-fill demo credentials when role changes
    const demo = demoCredentials[formData.role];
    setFormData(prev => ({
      ...prev,
      email: demo.email,
      password: demo.password
    }));
  }, [formData.role]);

  const validateForm = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    setError('');
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check demo credentials
      const demo = demoCredentials[formData.role];
      if (formData.email !== demo.email || formData.password !== demo.password) {
        throw new Error('Invalid credentials');
      }
      
      // Mock successful login with selected role
      const mockUser = {
        id: Math.floor(Math.random() * 1000),
        email: formData.email,
        firstName: formData.role === 'user' ? 'John' : 
                   formData.role === 'dealer' ? 'Sarah' :
                   formData.role === 'service-provider' ? 'Mike' : 'Admin',
        lastName: formData.role === 'user' ? 'Doe' : 
                  formData.role === 'dealer' ? 'Johnson' :
                  formData.role === 'service-provider' ? 'Chen' : 'User',
        role: formData.role,
        avatar: null,
        joinedDate: new Date().toISOString()
      };
      
      login(mockUser);
      
      // Store remember me preference
      if (formData.rememberMe) {
        localStorage.setItem('autosphere_remember', 'true');
      }
      
      // Navigate based on role
      switch (formData.role) {
        case 'admin':
          navigate('/admin-dashboard');
          break;
        case 'dealer':
          navigate('/dealer-dashboard');
          break;
        case 'service-provider':
          navigate('/service-provider-dashboard');
          break;
        case 'user':
        default:
          navigate('/dashboard');
          break;
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    setFormData(prev => ({
      ...prev,
      role,
      email: demoCredentials[role].email,
      password: demoCredentials[role].password
    }));
  };

  const handleSocialLogin = (provider) => {
    setError(`${provider} login is not implemented yet. Use demo credentials instead.`);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Welcome Back</h1>
            <p>Sign in to your AutoSphere account</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select Your Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="user">👤 User - Browse & Book Services</option>
                <option value="dealer">🏪 Dealer - Manage Inventory</option>
                <option value="service-provider">🔧 Service Provider - Offer Services</option>
                <option value="admin">⚙️ Admin - System Management</option>
              </select>
            </div>

            <div className="form-group">
              <label>Email Address {validationErrors.email && <span style={{color: '#d32f2f'}}>- {validationErrors.email}</span>}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${validationErrors.email ? 'error' : ''}`}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label>Password {validationErrors.password && <span style={{color: '#d32f2f'}}>- {validationErrors.password}</span>}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input ${validationErrors.password ? 'error' : ''}`}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#666666'
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="btn primary full-width"
              disabled={loading}
            >
              {loading ? (
                <span>
                  <span style={{ marginRight: '8px' }}>⏳</span>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="social-login">
            <button 
              className="btn social google"
              onClick={() => handleSocialLogin('Google')}
              type="button"
            >
              <span>🔍</span>
              Continue with Google
            </button>
            <button 
              className="btn social facebook"
              onClick={() => handleSocialLogin('Facebook')}
              type="button"
            >
              <span>📘</span>
              Continue with Facebook
            </button>
          </div>

          <div className="demo-section" style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#666666', textAlign: 'center' }}>
              <strong>Demo Mode:</strong> Try different roles with pre-filled credentials
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleDemoLogin('user')}
                className="btn"
                style={{ fontSize: '0.75rem', padding: '0.5rem', backgroundColor: formData.role === 'user' ? '#2c2c2c' : 'white', color: formData.role === 'user' ? 'white' : '#2c2c2c', border: '1px solid #2c2c2c' }}
              >
                👤 User Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('dealer')}
                className="btn"
                style={{ fontSize: '0.75rem', padding: '0.5rem', backgroundColor: formData.role === 'dealer' ? '#2c2c2c' : 'white', color: formData.role === 'dealer' ? 'white' : '#2c2c2c', border: '1px solid #2c2c2c' }}
              >
                🏪 Dealer Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('service-provider')}
                className="btn"
                style={{ fontSize: '0.75rem', padding: '0.5rem', backgroundColor: formData.role === 'service-provider' ? '#2c2c2c' : 'white', color: formData.role === 'service-provider' ? 'white' : '#2c2c2c', border: '1px solid #2c2c2c' }}
              >
                🔧 Provider Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="btn"
                style={{ fontSize: '0.75rem', padding: '0.5rem', backgroundColor: formData.role === 'admin' ? '#2c2c2c' : 'white', color: formData.role === 'admin' ? 'white' : '#2c2c2c', border: '1px solid #2c2c2c' }}
              >
                ⚙️ Admin Demo
              </button>
            </div>
          </div>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        <div className="auth-info">
          <h2>Join AutoSphere Today</h2>
          <div className="role-benefits">
            <div className="role-benefit">
              <h3>👤 Users</h3>
              <ul>
                <li>✅ Book automotive services instantly</li>
                <li>✅ Browse thousands of vehicles</li>
                <li>✅ Get AI-powered recommendations</li>
                <li>✅ Track service history & maintenance</li>
                <li>✅ Real-time messaging with providers</li>
              </ul>
            </div>
            <div className="role-benefit">
              <h3>🏪 Dealers</h3>
              <ul>
                <li>✅ Manage vehicle inventory efficiently</li>
                <li>✅ Connect with potential customers</li>
                <li>✅ Track sales performance & analytics</li>
                <li>✅ Automated lead management</li>
                <li>✅ Customer relationship tools</li>
              </ul>
            </div>
            <div className="role-benefit">
              <h3>🔧 Service Providers</h3>
              <ul>
                <li>✅ Offer automotive services online</li>
                <li>✅ Manage appointments & scheduling</li>
                <li>✅ Grow your business reach</li>
                <li>✅ Customer review system</li>
                <li>✅ Payment processing integration</li>
              </ul>
            </div>
            <div className="role-benefit">
              <h3>⚙️ Administrators</h3>
              <ul>
                <li>✅ Complete system management</li>
                <li>✅ User & content moderation</li>
                <li>✅ Analytics & reporting tools</li>
                <li>✅ Platform configuration</li>
                <li>✅ Security & compliance monitoring</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;