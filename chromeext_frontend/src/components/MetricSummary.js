import React from "react";

const MetricsTable = () => {
  const metrics = [
    { name: "Cyclomatic Complexity (CC)", value: 6.5 },
    { name: "Lines of Code (LOC)", value: 15004 },
    { name: "Coupling Between Objects (CBO)", value: 18 },
  ];

  return (
    <div className="metrics-table">
      <h2>Metric Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Metrics</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric, index) => (
            <tr key={index}>
              <td>{metric.name}</td>
              <td>{metric.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MetricsTable;
