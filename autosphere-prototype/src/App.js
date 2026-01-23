import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Public pages
import LandingPage from "./pages/public/LandingPage";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import About from "./pages/public/About";
import Contact from "./pages/public/Contact";

// User pages
import Dashboard from "./pages/user/Dashboard";
import Profile from "./pages/user/Profile";
import Messages from "./pages/user/Messages";
import Appointments from "./pages/user/Appointments";
import Notifications from "./pages/user/Notifications";
import Settings from "./pages/user/Settings";
import BookService from "./pages/user/BookService";
import VehicleInsights from "./pages/user/VehicleInsights.jsx";

// AI page
import AICarFinder from "./pages/AICarFinder";

// Components
import Sidebar from "./components/Sidebar";

function App() {
  const [userRole, setUserRole] = useState(null);

  return (
    <Router>
      {!userRole ? (
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login setUserRole={setUserRole} />} />
          <Route path="/register" element={<Register setUserRole={setUserRole} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      ) : (
        <div style={{ display: "flex" }}>
          <Sidebar />
          <div style={{ flex: 1, padding: "20px" }}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard role={userRole} />} />
              <Route path="/profile" element={<Profile role={userRole} />} />
              <Route path="/messages" element={<Messages role={userRole} />} />
              <Route path="/ai-car-finder" element={<AICarFinder />} /> {/* correct path */}
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/book-service" element={<BookService />} />
              <Route path="/vehicle-insights" element={<VehicleInsights />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </div>
      )}
    </Router>
  );
}

export default App;
