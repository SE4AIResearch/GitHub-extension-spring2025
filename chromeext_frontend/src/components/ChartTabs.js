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
      {/* Dropdown instead of buttons */}
      <div className="chart-tab-dropdown">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
        >
          {tabs.map((tab) => (
            <option key={tab} value={tab}>
              {tab}
            </option>
          ))}
        </select>
      </div>

      <div className="chart-display">{renderChart()}</div>
    </div>
  );
};

export default ChartTabs;
