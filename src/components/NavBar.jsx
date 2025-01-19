import React from "react";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="logo">
        <img src="blob:https://www.figma.com/257a18cb-5289-464c-9bcb-a439c08682ed" alt="Logo" className="logo-image" />
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
        <img src="blob:https://www.figma.com/c268c517-db40-4d38-a528-6d38d0fc4151" alt="Profile" className="profile-icon" />
      </div>
    </nav>
  );
};

export default Navbar;