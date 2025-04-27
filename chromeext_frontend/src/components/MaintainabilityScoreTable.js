import React from "react";

const MaintainabilityScoreTable = ({ metricData = [] }) => {
  const safeData = Array.isArray(metricData.class_metrics)
    ? metricData.class_metrics
    : Array.isArray(metricData)
      ? metricData
      : [];

  if (safeData.length === 0) {
    return <p>No data available to show Maintainability Scores.</p>;
  }

  const computeScore = (cls) => {
    const loc = cls.totalLOC || cls.line || cls.metrics?.CountLineCode || 0;
    const cbo = cls.coupling || cls.metrics?.CountClassCoupled || 0;
    const lcom = cls.lackOfCohesion || cls.metrics?.PercentLackOfCohesion || 0;
    const cyclo = cls.cyclomatic || cls.metrics?.SumCyclomatic || 0;
    const rawScore = 100 - (loc * 0.01 + cbo * 2 + lcom * 1.5 + cyclo * 1.5);
    return Math.max(0, Math.min(100, Math.round(rawScore)));
  };

  const getColor = (score) => {
    if (score > 70) return "green";
    if (score >= 50) return "orange";
    return "red";
  };

  const sortedClasses = [...safeData]
    .map(cls => ({
      name: cls.className || cls.name,
      score: computeScore(cls),
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="maintainability-score-table">
      <table>
        <thead>
          <tr>
            <th>Class</th>
            <th>Maintainability Score</th>
          </tr>
        </thead>
        <tbody>
          {sortedClasses.slice(0, 5).map((cls, idx) => (
            <tr key={idx}>
              <td>{cls.name}</td>
              <td style={{ color: getColor(cls.score), fontWeight: "bold" }}>
                {cls.score}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MaintainabilityScoreTable;
