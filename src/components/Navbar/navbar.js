// src/components/Navbar/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navItems = [
    { name: "News", path: "/" },
    { name: "President", path: "/" },
    { name: "Senate", path: "/" },
    { name: "House", path: "/" },
    { name: "Governor", path: "/" },
    { name: "States", path: "/" },
    { name: "More", path: "/" }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <div className="logo">270<span className="win">toWIN</span></div>
        </Link>
        <div className="nav-menu">
          {navItems.map((item, index) => (
            <Link 
              key={index} 
              to={item.path} 
              className={`nav-item ${item.name === "President" ? "active" : ""}`}
            >
              {item.name}
            </Link>
          ))}
        </div>
        <div className="search-icon">
          <span>🔍</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;