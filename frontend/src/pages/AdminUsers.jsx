import React, { useState, useEffect } from 'react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setError('Please login'); setLoading(false); return; }
    fetch('http://localhost:5000/api/admin/users', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
    .then(data => { setUsers(data); setLoading(false); })
    .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) return <div style={{padding:20,textAlign:'center'}}><h2>Loading...</h2></div>;
  if (error) return <div style={{padding:20,color:'red'}}><h2>Error: {error}</h2><button onClick={() => {localStorage.removeItem('token'); window.location.href='/login';}}>Login</button></div>;
  return <div style={{padding:20,maxWidth:1200,margin:'0 auto'}}>
    <h1>User Management</h1>
    <p>Total Users: <strong>{users.length}</strong></p>
    {users.length === 0 ? <p>No users found</p> : 
    <table style={{width:'100%',borderCollapse:'collapse',marginTop:20}}>
      <thead><tr style={{background:'#f0f0f0',borderBottom:'2px solid #ddd'}}>
        <th style={{padding:10,textAlign:'left'}}>Email</th>
        <th style={{padding:10,textAlign:'left'}}>Name</th>
        <th style={{padding:10,textAlign:'left'}}>Phone</th>
        <th style={{padding:10,textAlign:'left'}}>Role</th>
        <th style={{padding:10,textAlign:'left'}}>Status</th>
      </tr></thead>
      <tbody>{users.map((u,i) => <tr key={u.id} style={{borderBottom:'1px solid #eee',background:i%2===0?'#fafafa':'white'}}>
        <td style={{padding:10}}>{u.email}</td>
        <td style={{padding:10}}>{u.firstName||''} {u.lastName||''}</td>
        <td style={{padding:10}}>{u.phone ? <a href={'tel:'+u.phone} style={{color:'#1976d2',textDecoration:'none'}}>📞 {u.phone}</a> : 'N/A'}</td>
        <td style={{padding:10}}><span style={{background:u.role==='admin'?'#9c27b0':'#1976d2',color:'white',padding:'3px 10px',borderRadius:12,fontSize:12}}>{u.role||'user'}</span></td>
        <td style={{padding:10}}><span style={{background:u.isActive?'#4caf50':'#f44336',color:'white',padding:'3px 10px',borderRadius:12,fontSize:12}}>{u.isActive ? '✅ Active' : '❌ Inactive'}</span></td>
      </tr>)}</tbody>
    </table>}
  </div>;
};
export default AdminUsers;
