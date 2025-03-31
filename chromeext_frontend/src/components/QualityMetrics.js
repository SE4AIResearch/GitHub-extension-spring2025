import React from "react";

const QualityMetrics = () => {
  console.log("inside Quality Metrics")
  const metrics = [
    { name: "Total CC ", value: 120 },
    { name: "Average CC per Function", value: 6.8 },
    { name: "Max CC (Most Complex Fucntion)", value: 15},
    { name: "Total LOC", value: 15004},
    { name: "Average LOC per File", value: 750},
    { name: "Max LOC in File", value: 2050},
    { name: "Total WMC", value: 42},
    { name: "Average WMC Per Class", value: 6},
  ];

  return (
    <div className="quality-metrics">
      <h2>Quality Metrics</h2>
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

export default QualityMetrics;
