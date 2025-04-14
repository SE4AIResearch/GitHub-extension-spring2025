import React, { useEffect, useState } from "react";
import Header from "./components/Header.js";
import ChartTabs from "./components/ChartTabs.js";
import Footer from "./components/Footer.js";
import { useParams, useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

const Dashboard = () => {
  const { metricName } = useParams();
  const navigate = useNavigate();
  const decodedTab = metricName ? decodeURIComponent(metricName) : "";

  const [metricData, setMetricData] = useState([]);
  const [selectedTab, setSelectedTab] = useState(decodedTab); 

  useEffect(() => {
    fetch("/Java_4185549.json")
      .then((res) => res.json())
      .then((data) => {
        const extracted = data.class_metrics.map((item) => ({
          className: item.name,
          totalLOC: item.line,
          lackOfCohesion: item.metrics.PercentLackOfCohesion,
          coupling: item.metrics.CountClassCoupled,
          cyclomatic: item.metrics.SumCyclomatic,
        }));
        setMetricData(extracted);
      })
      .catch((err) => console.error("Error loading JSON:", err));
  }, []);

  const getTopRecords = (key, limit = 5) => {
    return [...metricData]
      .sort((a, b) => b[key] - a[key])
      .slice(0, limit);
  };

  const createBarChartData = (records, key) => ({
    labels: records.map((item) => item.className),
    datasets: [
      {
        label: key,
        data: records.map((item) => item[key]),
        backgroundColor: "rgba(209, 236, 244, 0.5)",
        borderColor: "rgb(16, 110, 80)",
        borderWidth: 1,
      },
    ],
  });

  const overviewCharts = [
    { title: "Line of Code", key: "totalLOC", route: "Line of Code" },
    { title: "Lack of Cohesion (LCOM)", key: "lackOfCohesion", route: "Lack of Cohesion of Methods" },
    { title: "Coupling Between Objects (CBO)", key: "coupling", route: "Coupling Between Objects" },
    { title: "Cyclomatic Complexity", key: "cyclomatic", route: "Quality Metrics" },
  ];

  const handleChartClick = (route) => {
    navigate(`/dashboard/${encodeURIComponent(route)}`);
  };

  return (
    <div className="dashboard-container">
      <Header />

      <ChartTabs activeTab={decodedTab} setActiveTabInParent={setSelectedTab} />

      {!selectedTab && (
        <div className="overview-charts-section">
          <h2 className="overview-heading">Metric Overviews</h2>
          <div className="overview-charts-container">
            {overviewCharts.map((metric, index) => {
              const topData = getTopRecords(metric.key);
              const chartData = createBarChartData(topData, metric.key);
              const options = {
                onClick: () => handleChartClick(metric.route),
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) =>
                        `${context.dataset.label}: ${context.raw}`,
                    },
                  },
                },
                /*scales: {
                  x: {
                    type: "category",
                    title: { display: false },
                  },
                  y: { beginAtZero: true },
                }, */

                scales: {
                  x: {
                    type: "category",
                    ticks: {
                      callback: function (value, index) {
                        const label = chartData.labels[index];
                        return label.length > 25 ? label.slice(0, 22) + "..." : label;
                      },
                    },
                    title: { display: false },
                  },
                  y: {
                    beginAtZero: true,
                  },
                },
                
              };

              return (
                <div
                  key={index}
                  className="overview-chart"
                  onClick={() => handleChartClick(metric.route)}
                >
                  <h4 className="overview-chart-title">{metric.title} (Top 5)</h4>
                  <Bar data={chartData} options={options} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Dashboard;
