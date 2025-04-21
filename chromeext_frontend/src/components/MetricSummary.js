import React from "react";

const shortenClassName = (fullName) => {
  if (!fullName || typeof fullName !== "string") return "";
  const parts = fullName.split(".");
  return parts.slice(-2).join(".");
};

const getTopImportantClasses = (data, limit = 5) => {
  if (!data || data.length === 0) return [];

  const maxLOC = Math.max(...data.map((d) => d.totalLOC || 0));
  const maxCyclo = Math.max(...data.map((d) => d.cyclomatic || 0));

  return [...data]
    .map((item) => {
      const normalizedLOC = (item.totalLOC || 0) / (maxLOC || 1);
      const normalizedCyclo = (item.cyclomatic || 0) / (maxCyclo || 1);
      return {
        ...item,
        impactScore: (normalizedLOC + normalizedCyclo).toFixed(2),
      };
    })
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, limit);
};

const MetricsTable = ({ metricData = [] }) => {
  const topClasses = getTopImportantClasses(metricData);

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
