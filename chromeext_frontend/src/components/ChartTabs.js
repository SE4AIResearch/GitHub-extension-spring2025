import React, { useState, useEffect } from "react";

import MetricSummary from "./MetricSummary.js";
import QualityMetrics from "./QualityMetrics.js";
import CouplingChart from "./CouplingChart.js";
import LOCofMethosChart from "./LOCofMethosChart.js";
import LineofCode from "./LineofCodeChart.js";
import TrendHistoryChart from "./TrendsHistory.js";
import CBOHistogram from "./CBOHistogram.js";

const ChartTabs = ({ activeTab: initialTab, setActiveTabInParent }) => {
  const [activeTab, setActiveTab] = useState(initialTab || "");

  useEffect(() => {
    setActiveTabInParent && setActiveTabInParent(activeTab);
  }, [activeTab, setActiveTabInParent]);

  const tabs = [
    "",
    "Metric Summary",
    "Quality Metrics",
    "Lack of Cohesion of Methods",
    "Line of Code",
    "Coupling Between Objects Coupling",
    "Coupling Between Objects Histogram",
    "Trend History"
  ];

  const renderChart = () => {
    switch (activeTab) {
      case "Metric Summary":
        return <MetricSummary />;
      case "Quality Metrics":
        return <QualityMetrics />;
      case "Coupling Between Objects Coupling":
        return <CouplingChart />;
        case "Coupling Between Objects Histogram":
        return <CBOHistogram />;
      case "Lack of Cohesion of Methods":
        return <LOCofMethosChart />;
      case "Line of Code":
        return <LineofCode />;
      case "Trend History":
        return <TrendHistoryChart />;
      
      default:
        return null;
    }
  };

  return (
    <div className="chart-tabs-wrapper">
      <div className="chart-tab-dropdown">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
        >
         {/*} {tabs.map((tab) => (
            <option key={tab} value={tab}>
              {tab}
            </option>
          ))}*/}
          <option value="">-- Select a Metric --</option>
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
