import React, { useState } from "react";

import MetricSummary from "./MetricSummary.js";
import QualityMetrics from "./QualityMetrics.js";
import CouplingChart from "./CouplingChart.js";
import LOCofMethosChart from "./LOCofMethosChart.js";
import TrendHistoryChart from "./TrendsHistory.js";

const ChartTabs = () => {
  const [activeTab, setActiveTab] = useState("Metric Summary");

  const tabs = [
    "Metric Summary",
    "Quality Metrics",
    "Coupling Between Objects",
    "Lack of Cohesion of Methods",
    "Trend History",
  ];

  const renderChart = () => {
    switch (activeTab) {
      case "Metric Summary":
        return <MetricSummary />;
      case "Quality Metrics":
        return <QualityMetrics />;
      case "Coupling Between Objects":
        return <CouplingChart />;
      case "Lack of Cohesion of Methods":
        return <LOCofMethosChart />;
      case "Trend History":
        return <TrendHistoryChart />;
      default:
        return null;
    }
  };

  return (
    <div className="chart-tabs-wrapper">
      <div className="chart-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="chart-display">{renderChart()}</div>
    </div>
  );
};

export default ChartTabs;
