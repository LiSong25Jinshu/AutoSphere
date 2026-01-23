import React, { useState } from "react";
import "./Profile.css";

function Profile() {
  const [profilePic, setProfilePic] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(URL.createObjectURL(file));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      alert("Please fill in all fields.");
      return;
    }

    // Mock save action
    alert(`Profile saved successfully!\nName: ${name}\nEmail: ${email}\nPhone: ${phone}`);
  };

  const handleCancel = () => {
    // Reset fields
    setName("");
    setEmail("");
    setPhone("");
    setProfilePic(null);
  };

  return (
    <div className="profile-container">
      <h1 className="profile-title">Profile Settings</h1>

      <div className="profile-card">
        <div className="profile-pic-section">
          <img
            src={profilePic || "/images/default-avatar.png"}
            alt="Profile"
            className="profile-pic"
          />
          <label className="upload-btn">
            Change Photo
            <input type="file" accept="image/*" onChange={handlePicChange} />
          </label>
        </div>

        <form className="profile-form" onSubmit={handleSave}>
          <label>Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Phone</label>
          <input
            type="tel"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div className="form-buttons">
            <button type="submit" className="btn primary">Save Changes</button>
            <button type="button" className="btn secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile;
