import React from 'react';

// Helper function to format metric names
const formatMetricName = (name) => {
  switch (name) {
    case 'CountLineCode': return 'Lines of Code';
    case 'SumCyclomatic': return 'Weighted Methods per Class';
    case 'CountClassCoupled': return 'Coupling Between Objects';
    case 'PercentLackOfCohesion': return 'Lack of Cohesion of Methods';
    case 'MaxInheritanceTree': return 'Depth of Inheritance Tree';
    case 'CountClassDerived': return 'Number of Children';
  }
  return name
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim();
};

const ClassKPICards = ({ metrics }) => {
  if (!metrics || !metrics.metrics || Object.keys(metrics.metrics).length === 0) {
    return (
      <div className="summary-cards-container">
        <div className="summary-card" style={{ width: 'auto', padding: '20px', color: '#666' }}>
          No detailed metrics available for this class.
        </div>
      </div>
    );
  }

  const nestedMetrics = metrics.metrics;

  return (
    <div className="summary-cards-container">
      {Object.entries(nestedMetrics).map(([key, value]) => {
        let displayValue = value;
        if (value === null || value === undefined) {
          displayValue = 'N/A'; // Display N/A for null or undefined values
        } else if (typeof value === 'object') {
          displayValue = JSON.stringify(value); // Simple display for nested objects
        }

        return (
          <div key={key} className="summary-card">
            <h3>{formatMetricName(key)}</h3>
            <p>{String(displayValue)}</p>
          </div>
        );
      })}
    </div>
  );
};

export default ClassKPICards; 