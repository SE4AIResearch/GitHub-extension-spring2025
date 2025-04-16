import React, { useState, useEffect, memo, useCallback } from "react";

import MetricSummary from "./MetricSummary.js";
import QualityMetrics from "./QualityMetrics.js";
import CouplingChart from "./CouplingChart.js";
import LOCofMethosChart from "./LOCofMethosChart.js";
import LineofCode from "./LineofCodeChart.js";
import TrendHistoryChart from "./TrendsHistory.js";
import CBOHistogram from "./CBOHistogram.js";

const ChartTabs = ({ activeTab: initialTab, setActiveTabInParent, metricData = [] }) => {
  const [activeTab, setActiveTab] = useState(initialTab || "");

  useEffect(() => {
    if (setActiveTabInParent) {
      setActiveTabInParent(activeTab);
    }
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

  const renderChart = useCallback(() => {
    switch (activeTab) {
      case "Metric Summary":
        return <MetricSummary metricData={metricData} />;
      case "Quality Metrics":
        return <QualityMetrics metricData={metricData} />;
      case "Coupling Between Objects Coupling":
        return <CouplingChart metricData={metricData} />;
        case "Coupling Between Objects Histogram":
        return <CBOHistogram />;
      case "Lack of Cohesion of Methods":
        return <LOCofMethosChart metricData={metricData} />;
      case "Line of Code":
        return <LineofCode metricData={metricData} />;
      case "Trend History":
        return <TrendHistoryChart metricData={metricData} />;
      default:
        return null;
    }
  }, [activeTab, metricData]);

  const handleTabChange = useCallback((e) => {
    setActiveTab(e.target.value);
  }, []);

  return (
    <div className="chart-tabs-wrapper">
      <div className="chart-tab-dropdown">
        <select
          value={activeTab}
          onChange={handleTabChange}
        >
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

export default memo(ChartTabs);
