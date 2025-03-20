// src/components/Navbar/Navbar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { name: "News", path: "/" },
    { name: "President", path: "/president" },
    { name: "Senate", path: "/senate" },
    { name: "House", path: "/house" },
    { name: "Governor", path: "/governor" },
    { name: "States", path: "/states" },
    { name: "More", path: "/more" }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <div className="logo">115<span className="win"> e meio</span></div>
        </Link>
        <div className="nav-menu">
          {navItems.map((item, index) => (
            <Link 
              key={index} 
              to={item.path} 
              className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
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
