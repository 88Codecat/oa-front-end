import React from 'react';

const StatCard = ({ number, label, change, positive }) => {
  return (
    <div className="card stat-card">
      <div className="stat-number">{number}</div>
      <div className="stat-label">{label}</div>
      {change && (
        <div className={`stat-change ${positive ? 'positive' : 'negative'}`}>
          {positive ? '↗' : '↘'} {change}
        </div>
      )}
    </div>
  );
};

export default StatCard;