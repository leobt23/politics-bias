import React from 'react';
import { BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar } from 'recharts';

const LatestPollsChart = () => {
  // Sample polling data - replace with your actual data
  const pollingData = [
    { name: 'New York', republican: 39, democrat: 54, independent: 7 },
    { name: 'Florida', republican: 51, democrat: 44, independent: 5 },
    { name: 'Pennsylvania', republican: 48, democrat: 47, independent: 5 },
    { name: 'Michigan', republican: 45, democrat: 49, independent: 6 },
    { name: 'Wisconsin', republican: 47, democrat: 48, independent: 5 },
    { name: 'Arizona', republican: 49, democrat: 46, independent: 5 },
  ];

  return (
    <div className="polling-chart-container">
      <h2>Últimas Sondagens</h2>
      <p className="chart-subtitle">Intenções de voto nos estados decisivos</p>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={pollingData}
          margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="republican" name="Republicano" fill="#E91D0E" />
          <Bar dataKey="democrat" name="Democrata" fill="#0027DE" />
          <Bar dataKey="independent" name="Independente" fill="#FFD700" />
        </BarChart>
      </ResponsiveContainer>
      
      <p className="poll-source">Fonte: Pesquisas realizadas entre 1-10 de março, 2025</p>
      <p className="poll-margin">Margem de erro: ±2.5 pontos percentuais</p>
    </div>
  );
};

export default LatestPollsChart;