import React from "react";

const QualityMetrics = () => {
  console.log("inside Quality Metrics")
  /*const CyclomaticMetrics = [
    { name: "Total CC ", value: 120 },
    { name: "Average CC per Function", value: 6.8 },
    { name: "Max CC (Most Complex Fucntion)", value: 15},
  ];*/
  const LOCMMetrics = [
    { name: "Total Lack of Cohesion", value: '25%' },
    { name: "Average Lack of cohesion per Class", value: '7.5%' },
    { name: "Max Lack of Cohesion", value: '15%' },
  ];
  
  const LOCMetrics = [
    { name: "Total LOC", value: 13045 },
    { name: "Average LOC per Class", value: 434.83 },
    { name: "Max LOC in Class", value: 700 },
  ];
  
  const WeightedMethodsperClass = [
    { name: "Total WMC", value: 42 },
    { name: "Average WMC Per Class", value: 6 },
  ];
  

  return (
    
    <div className="quality-metrics">

      <div className="metrics-filter">
        <input type="text" placeholder="Filter metrics..." />
      </div>
      <h2>Quality Metrics</h2>
      <table>
        <thead>
          <tr>
            <th>Lack of Cohesion</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {LOCMMetrics.map((LOCMMetrics, index) => (
            <tr key={index}>
              <td>{LOCMMetrics.name}</td>
              <td>{LOCMMetrics.value}</td>
            </tr>
          ))}
        </tbody>
          </table>
          <table>
        <thead>
          <tr>
            <th>Line Of Code Metrics</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {LOCMetrics.map((LOCMetrics, index) => (
            <tr key={index}>
              <td>{LOCMetrics.name}</td>
              <td>{LOCMetrics.value}</td>
            </tr>
          ))}
        </tbody>
    </table>
    <table>    
        <thead>
          <tr>
            <th>Weighted Methods per Class</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {WeightedMethodsperClass.map((WeightedMethodsperClass, index) => (
            <tr key={index}>
              <td>{WeightedMethodsperClass.name}</td>
              <td>{WeightedMethodsperClass.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="metrics-summary">
        <h4>Summary</h4>
        <p>
          These metrics show an overall healthy structure. While cyclomatic complexity is manageable,
          consider refactoring the most complex functions and monitoring LOC in outlier files.
        </p>
      </div>

    </div>
  );
};

export default QualityMetrics;
