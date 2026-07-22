import React, { useState } from 'react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/admin/users';
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '48px',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '440px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', color: '#333', margin: '0 0 8px 0' }}>🚗 AutoSphere</h1>
          <p style={{ color: '#666', margin: '0' }}>Sign in to your account</p>
        </div>

        {error && <div style={{background:'#fee',color:'#c62828',padding:'12px',borderRadius:'8px',marginBottom:'16px',textAlign:'center'}}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required style={{width:'100%',padding:'12px',border:'2px solid #e0e0e0',borderRadius:'8px',fontSize:'16px'}} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required style={{width:'100%',padding:'12px',border:'2px solid #e0e0e0',borderRadius:'8px',fontSize:'16px'}} />
          </div>

          <button type="submit" disabled={loading} style={{width:'100%',padding:'14px',background:'#667eea',color:'white',border:'none',borderRadius:'8px',fontSize:'16px',fontWeight:'600',cursor:loading?'not-allowed':'pointer',opacity:loading?0.7:1}}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666' }}><strong>Demo Accounts:</strong></p>
          <p style={{ margin: '2px 0', fontSize: '12px', color: '#888' }}>Admin: admin@example.com / PASSWORD</p>
          <p style={{ margin: '2px 0', fontSize: '12px', color: '#888' }}>User: test@example.com / password123</p>
        </div>
      </div>
    </div>
  );
};
export default Login;
