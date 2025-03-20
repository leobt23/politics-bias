import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import LatestPollsChart from '../../components/LatestPollsChart/LatestPollsChart';

const HomePage = () => {
  const featuredSections = [
    { title: "Eleições Legislativas", path: "/", description: "A luta pelo lugar de Primeiro-Ministro" },
    { title: "Corrida Presidencial", path: "/", description: "Sondagens sobre os candidatos a Belém" },
    { title: "Eleições Autárquicas", path: "/", description: "Lutas pelas autarquias do país" },
    { title: "Eleições Europeias", path: "/", description: "Os lugares que serão ocupados no Parlamente Europeu" }
  ];

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Análise e Dados Sobre Eleições</h1>
        <p>Últimas sondagens, mapas e projeções</p>
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