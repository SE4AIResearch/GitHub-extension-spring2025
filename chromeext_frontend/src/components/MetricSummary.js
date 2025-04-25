import React from "react";

const shortenClassName = (fullName) => {
  if (!fullName || typeof fullName !== "string") return "";
  const parts = fullName.split(".");
  return parts.slice(-2).join(".");
};

const getTopImportantClasses = (data, limit = 5) => {
  if (!Array.isArray(data) || data.length === 0) return [];

  const parsedData = data.map(cls => ({
    className: cls.className || cls.name || "Unnamed",
    totalLOC: cls.totalLOC || cls.line || cls.metrics?.CountLineCode || 0,
    cyclomatic: cls.cyclomatic || cls.metrics?.SumCyclomatic || 0,
  })).filter(cls =>
    (cls.totalLOC || 0) > 0 || (cls.cyclomatic || 0) > 0
  );

  const maxLOC = Math.max(...parsedData.map((d) => d.totalLOC || 0), 1);
  const maxCyclo = Math.max(...parsedData.map((d) => d.cyclomatic || 0), 1);

  return parsedData
    .map((item) => {
      const normalizedLOC = (item.totalLOC || 0) / maxLOC;
      const normalizedCyclo = (item.cyclomatic || 0) / maxCyclo;
      return {
        ...item,
        impactScore: (normalizedLOC + normalizedCyclo).toFixed(2),
      };
    })
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, limit);
};

const MetricsTable = ({ metricData = [] }) => {
  const safeData = Array.isArray(metricData.class_metrics)
    ? metricData.class_metrics
    : Array.isArray(metricData) ? metricData : [];

  const topClasses = getTopImportantClasses(safeData);

  return (
    <div className="metrics-table">
      <h2>Metric Summary</h2>

      <h3>Top 5 Most Important Classes (by LOC + Cyclomatic)</h3>
      <table>
        <thead>
          <tr>
            <th>Class</th>
            <th>LOC</th>
            <th>Cyclomatic</th>
            <th>Impact Score</th>
          </tr>
        </thead>
        <tbody>
          {topClasses.map((cls, index) => (
            <tr key={index}>
              <td>{shortenClassName(cls.className)}</td>
              <td>{cls.totalLOC}</td>
              <td>{cls.cyclomatic}</td>
              <td>{cls.impactScore}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MetricsTable;
