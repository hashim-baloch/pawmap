import React from "react";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="logo">
        <img src="/path-to-your-logo/logo.png" alt="Logo" className="logo-image" />
        <span>PawMap</span>
      </div>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search location..."
          className="search-input"
        />
      </div>
      <div className="user-profile">
        <img src="/path-to-profile-icon/profile.png" alt="Profile" className="profile-icon" />
      </div>
    </nav>
  );
};

export default Navbar;