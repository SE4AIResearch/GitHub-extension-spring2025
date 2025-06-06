import React, { useState, useEffect, memo, useCallback } from "react";

import MetricSummary from "./MetricSummary.js";
import LOCofMethosChart from "./LOCofMethosChart.js";
import LineofCode from "./LineofCodeChart.js";
import TrendHistoryChart from "./TrendsHistory.js";
import CBOChart from "./CouplingBetweenObjectChart.js";
import HighRiskClassesChart from "./HighRiskClassesChart.js";
import { useNavigate } from "react-router-dom";

const ChartTabs = ({ activeTab: initialTab, setActiveTabInParent, metricData = [] }) => {
  const [activeTab, setActiveTab] = useState(initialTab || "");
  const navigate = useNavigate();

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (setActiveTabInParent) {
      setActiveTabInParent(activeTab);
    }
  }, [activeTab, setActiveTabInParent]);

  const tabs = [
    "Metric Summary",
    "Line of Code",
    "Lack of Cohesion of Methods",
    "Coupling Between Objects",
    "Trend History",
    "High Risk Classes Chart"
  ];

  const renderChart = useCallback(() => {
    switch (activeTab) {
      case "Metric Summary":
        return <MetricSummary metricData={metricData} />;
      case "Line of Code":
        return <LineofCode metricData={metricData} />;
      case "Lack of Cohesion of Methods":
        return <LOCofMethosChart metricData={metricData} />;
      case "Coupling Between Objects":
          return <CBOChart metricData={metricData} />;  
      case "Trend History":
        return <TrendHistoryChart metricData={metricData} />;
      case "High Risk Classes Chart" :
          return < HighRiskClassesChart metricData={metricData}/>
      default:
        return null;
    }
  }, [activeTab, metricData]);

  const handleTabChange = useCallback((e) => {
    const selected = e.target.value;
    setActiveTab(selected);
    if (selected === "") {
      navigate("/dashboard");
    } else {
      navigate(`/dashboard/${encodeURIComponent(selected)}`);
    }
  }, [navigate]);

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
