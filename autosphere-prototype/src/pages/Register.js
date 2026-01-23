import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";

function Register({ setUserRole }) {
const [role, setRole] = useState("customer");
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [company, setCompany] = useState(""); // for dealer/service provider
const [phone, setPhone] = useState(""); // vital info
const navigate = useNavigate();

const handleRegister = () => {
if(!name || !email || !password || (role !== "customer" && !company) || !phone){
alert("Please fill all required fields");
return;
}
// Set role and navigate to dashboard
setUserRole(role);
navigate("/dashboard");
};

return ( <div className="login-container"> <div className="login-card"> <h1>Register</h1> <div className="login-subtitle">Create your account</div>

```
    <select value={role} onChange={(e) => setRole(e.target.value)}>
      <option value="customer">Customer</option>
      <option value="dealer">Dealer</option>
      <option value="serviceProvider">Service Provider</option>
      <option value="admin">Admin</option>
    </select>

    <input type="text" placeholder="Full Name" value={name} onChange={(e)=>setName(e.target.value)}/>
    <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)}/>
    <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)}/>
    {role !== "customer" && <input type="text" placeholder="Company/Organization" value={company} onChange={(e)=>setCompany(e.target.value)}/>}
    <input type="text" placeholder="Phone Number" value={phone} onChange={(e)=>setPhone(e.target.value)}/>

    <button onClick={handleRegister} className="login-btn">
      Register
    </button>
  </div>
</div>


);
}

export default Register;
