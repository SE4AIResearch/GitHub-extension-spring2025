import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const QualityMetrics = ({ metricData = [] }) => {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    totalLOC: 0,
    maxLOC: 0,
    maxLOCClass: "",
    avgCyclomatic: 0,
    maxCyclomatic: 0,
    maxCyclomaticClass: "",
    cohesionBest: {},
    cohesionWorst: {},
    couplingBest: {},
    couplingWorst: {},
  });

  useEffect(() => {
    if (!metricData.length) return;

    const totalLOC = metricData.reduce((acc, cls) => acc + cls.totalLOC, 0);
    const maxLOCObj = metricData.reduce((max, cls) =>
      cls.totalLOC > max.totalLOC ? cls : max
    );
    const maxLOC = maxLOCObj.totalLOC;
    const maxLOCClass = maxLOCObj.className;

    const avgCyclomatic = (
      metricData.reduce((sum, cls) => sum + cls.cyclomatic, 0) / metricData.length
    ).toFixed(2);

    const maxCyclomaticObj = metricData.reduce((max, cls) =>
      cls.cyclomatic > max.cyclomatic ? cls : max
    );
    const maxCyclomatic = maxCyclomaticObj.cyclomatic;
    const maxCyclomaticClass = maxCyclomaticObj.className;

    const cohesionBest = metricData.reduce((min, cls) =>
      cls.lackOfCohesion < min.lackOfCohesion ? cls : min
    );
    const cohesionWorst = metricData.reduce((max, cls) =>
      cls.lackOfCohesion > max.lackOfCohesion ? cls : max
    );

    const couplingBest = metricData.reduce((min, cls) =>
      cls.coupling < min.coupling ? cls : min
    );
    const couplingWorst = metricData.reduce((max, cls) =>
      cls.coupling > max.coupling ? cls : max
    );

    setMetrics({
      totalLOC,
      maxLOC,
      maxLOCClass,
      avgCyclomatic,
      maxCyclomatic,
      maxCyclomaticClass,
      cohesionBest,
      cohesionWorst,
      couplingBest,
      couplingWorst,
    });
  }, [metricData]);

  const shortenClassName = (fullName) => {
    if (!fullName || typeof fullName !== "string") return "";
    const parts = fullName.split(".");
    return parts.slice(-2).join(".");
  };

  /*const interpretCyclomatic = (value) => {
    if (value <= 10) return "Low Risk";
    if (value <= 20) return "Moderate Risk";
    return "High Risk";
  }; */

  const handleRedirect = (path) => {
    navigate(`/dashboard/${encodeURIComponent(path)}`);
  };

  const cardStyle = (isPositive) => ({
    color: isPositive ? '#007b5e' : '#cc0000',
    fontWeight: 600,
  });

  return (
    <div className="summary-cards-container">
      <div className="summary-card" onClick={() => handleRedirect("Line of Code")}>
        <h3>Total LOC</h3>
        <p>{metrics.totalLOC.toLocaleString()}</p>
        <h4>Max LOC Class</h4>
        <p>
          {shortenClassName(metrics.maxLOCClass)} ({metrics.maxLOC})
        </p>
      </div>

      {/*<div className="summary-card" onClick={() => handleRedirect("Quality Metrics")}>
        <h3>Avg. Cyclomatic Complexity</h3>
        <p>{metrics.avgCyclomatic}</p>
        <h4>Max</h4>
        <p>
          {shortenClassName(metrics.maxCyclomaticClass)} ({metrics.maxCyclomatic}) –{" "}
          {interpretCyclomatic(metrics.maxCyclomatic)}
        </p>
      </div> */}

      <div className="summary-card" onClick={() => handleRedirect("Lack of Cohesion of Methods")}>
        <h3>Best Cohesive Class</h3>
        <p style={cardStyle(true)}>
          {shortenClassName(metrics.cohesionBest.className)} ({metrics.cohesionBest.lackOfCohesion}%)
        </p>
        <h4>Worst</h4>
        <p style={cardStyle(false)}>
          {shortenClassName(metrics.cohesionWorst.className)} ({metrics.cohesionWorst.lackOfCohesion}%)
        </p>
      </div>

      <div className="summary-card" onClick={() => handleRedirect("Coupling Between Objects")}>
        <h3>Most Coupled Class</h3>
        <p style={cardStyle(false)}>
          {shortenClassName(metrics.couplingWorst.className)} ({metrics.couplingWorst.coupling})
        </p>
        <h4>Least Coupled</h4>
        <p style={cardStyle(true)}>
          {shortenClassName(metrics.couplingBest.className)} ({metrics.couplingBest.coupling})
        </p>
      </div>
    </div>
  );
};

export default QualityMetrics;
