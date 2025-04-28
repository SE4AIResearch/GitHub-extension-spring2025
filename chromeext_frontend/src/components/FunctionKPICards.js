import React from 'react';
//import '../styles.css'; // Ensure styles.css is imported if not already done globally

// Helper function to format metric names
const formatMetricName = (name) => {
  // Add specific cases if needed
  switch (name) {
    case 'Cyclomatic': return 'Cyclomatic Complexity'; 
    case 'CountLineCode': return 'Lines of Code'; 
    case 'CountPackageCoupled': return 'Package Coupling'; 
  }
  // Auto-format CamelCase or snake_case to Title Case
  return name
    //.replace(/_/g, ' ') // Replace underscores with spaces
    //.replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim();
};

const FunctionKPICards = ({ metrics }) => {
  if (!metrics || Object.keys(metrics).length === 0) {
    // Use a card-like style for the message for consistency
    return (
      <div className="summary-cards-container">
          <div className="summary-card" style={{width: 'auto', padding: '20px', color: '#666'}}>
             No detailed metrics available for this function.
          </div>
      </div>
    );
  }

  // Get all keys from the metrics object
  const metricKeys = Object.keys(metrics);

  return (
    <div className="summary-cards-container">
      {metricKeys.map(key => {
        if (metrics[key] != null) {
          let displayValue = metrics[key];
          if (typeof displayValue === 'object') {
             displayValue = JSON.stringify(displayValue); // Simple display for objects in json format
          }

          return (
            <div key={key} className="summary-card">
              <h3>{formatMetricName(key)}</h3>
              <p>{String(displayValue)}</p>
            </div>
          );
        }
        // Return null if the value is null/undefined
        return null;
      })}
    </div>
  );
};

export default FunctionKPICards; 