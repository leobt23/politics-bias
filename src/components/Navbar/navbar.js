// src/components/Navbar/Navbar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { name: "Noticias", path: "/" },
    { name: "Legislativas", path: "/legislativas" },
    { name: "Presidencia", path: "/presidencia" },
    { name: "Autarquicas", path: "/autarquicas" },
    { name: "Europeias", path: "/europeias" },
    { name: "EUA", path: "/eua" },
    { name: "Outros", path: "/outros" }
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
