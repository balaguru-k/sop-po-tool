import React from 'react';
import '../assets/css/emptystate.css';

const EmptyState = ({ type = 'chart' }) => {
  return (
    <div className="empty-state-container">
      <div className="empty-state-animation">
        {type === 'chart' && (
          <div className="chart-bars">
            <div className="bar bar-1"></div>
            <div className="bar bar-2"></div>
            <div className="bar bar-3"></div>
            <div className="bar bar-4"></div>
          </div>
        )}
        {type === 'doughnut' && (
          <div className="doughnut-ring">
            <div className="ring-segment"></div>
          </div>
        )}
        {type === 'polar' && (
          <div className="polar-circles">
            <div className="circle circle-1"></div>
            <div className="circle circle-2"></div>
            <div className="circle circle-3"></div>
          </div>
        )}
      </div>
      <p className="empty-state-text">No data available</p>
    </div>
  );
};

export default EmptyState;
