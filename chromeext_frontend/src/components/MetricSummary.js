import React from "react";

const MetricsTable = () => {
  const metrics = [
      { name: "Total Line of Code (All Classes)", value: 13045 },
      { name: "Average Line Of Code per Class", value: 434.83 },
      { name: "Max Line Of Code in a Class", value: 700 },
      { name: "Average Coupling Between Objects (CBO) per Class", value: 7.53 },
      { name: "Classes with High Coupling (CBO > 10)", value: 9 }
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
