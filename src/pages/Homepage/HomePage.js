import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import LatestPollsChart from './LatestPollsChart'; // Make sure this file exists in the same directory

const HomePage = () => {
  const featuredSections = [
    { title: "Presidential Race", path: "/", description: "Latest polls and electoral map projections" },
    { title: "Senate Battles", path: "/", description: "Current senate race forecasts and analysis" },
    { title: "House Elections", path: "/", description: "District-by-district breakdown of house races" },
    { title: "Gubernatorial Races", path: "/", description: "State governor election coverage" }
  ];

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Political Analysis & Election Forecasting</h1>
        <p>Unbiased coverage of the latest election polls, maps, and projections</p>
      </div>

      <div className="featured-grid">
        {featuredSections.map((section, index) => (
          <Link key={index} to={section.path} className="featured-card">
            <h3>{section.title}</h3>
            <p>{section.description}</p>
          </Link>
        ))}
      </div>

      {/* Gráfico com últimas sondagens */}
      <LatestPollsChart />
      
      <div className="news-section">
        <h2>Últimas Notícias</h2>
        <div className="news-list">
          <div className="news-item">
            <h3>Latest Poll Results</h3>
            <p>New polling data shows shifts in key battleground states...</p>
            <span className="news-date">March 15, 2025</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;