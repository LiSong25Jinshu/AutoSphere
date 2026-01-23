import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

export default function Register() {
  const [role, setRole] = useState("customer");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
    carDetails: "",
    companyName: "",
    regNumber: "",
    serviceCenter: "",
    services: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = () => {
    // Here you would handle registration logic (API call)
    console.log("Registered user:", { role, ...formData });
    navigate("/login");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Register</h1>
        <p className="login-subtitle">Choose your role and fill in your details</p>

        {/* Role selection */}
        <select name="role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="customer">Customer</option>
          <option value="dealer">Dealer</option>
          <option value="serviceProvider">Service Provider</option>
          <option value="admin">Admin</option>
        </select>

        {/* Common fields */}
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
        />

        {/* Conditional fields by role */}
        {role === "customer" && (
          <>
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
            />
            <input
              type="text"
              name="carDetails"
              placeholder="Car Details (optional)"
              value={formData.carDetails}
              onChange={handleChange}
            />
          </>
        )}

        {role === "dealer" && (
          <>
            <input
              type="text"
              name="companyName"
              placeholder="Company Name"
              value={formData.companyName}
              onChange={handleChange}
            />
            <input
              type="text"
              name="regNumber"
              placeholder="Business Registration Number"
              value={formData.regNumber}
              onChange={handleChange}
            />
            <input
              type="text"
              name="address"
              placeholder="Business Address"
              value={formData.address}
              onChange={handleChange}
            />
          </>
        )}

        {role === "serviceProvider" && (
          <>
            <input
              type="text"
              name="serviceCenter"
              placeholder="Service Center Name"
              value={formData.serviceCenter}
              onChange={handleChange}
            />
            <input
              type="text"
              name="regNumber"
              placeholder="License / Registration Number"
              value={formData.regNumber}
              onChange={handleChange}
            />
            <input
              type="text"
              name="address"
              placeholder="Service Center Address"
              value={formData.address}
              onChange={handleChange}
            />
            <input
              type="text"
              name="services"
              placeholder="Services Provided (optional)"
              value={formData.services}
              onChange={handleChange}
            />
          </>
        )}

        {/* Admin: only common fields */}

        <button className="login-btn" onClick={handleRegister}>
          Register
        </button>

        <p className="register-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
