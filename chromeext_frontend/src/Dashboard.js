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

    return (
        <div className="dashboard-container">
            {/* Header */} 
            <Header />
            
            {/* Display repo URL with better formatting */}
            <div style={{ margin: '15px', textAlign: 'center' }}>
                <h2 style={{ wordBreak: 'break-all', margin: '0 0 5px 0' }}>
                    {repoUrl ? 'Analyzing Repository:' : 'Repository Analysis Dashboard'}
                </h2>
                {repoUrl && (
                    <a 
                        href={repoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                            color: '#0366d6', 
                            textDecoration: 'underline',
                            fontSize: '16px',
                            wordBreak: 'break-all'
                        }}
                    >
                        {repoUrl}
                    </a>
                )}
            </div>

            {/* Status message (warning/info) */}
            {renderStatusMessage(errorMessage)}

            {/* Error message with better styling */}
            {errorMessage && (errorMessage.startsWith('Error:') || errorMessage.startsWith('Analysis failed:')) && (
                <div style={{ 
                    margin: '15px auto', 
                    padding: '10px 15px', 
                    backgroundColor: '#fff8f8', 
                    border: '1px solid #ffcdd2',
                    borderRadius: '4px',
                    color: '#d32f2f',
                    maxWidth: '80%'
                }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Error:</p>
                    <p style={{ margin: 0 }}>{errorMessage}</p>
                    
                    {/* Add troubleshooting tips */}
                    {errorMessage.includes('backend') && (
                        <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                            <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>Troubleshooting:</p>
                            <ul style={{ margin: '0', paddingLeft: '20px' }}>
                                <li>Ensure the backend server is running</li>
                                <li>Check that you have proper network connectivity</li>
                                <li>Try returning to GitHub and clicking the link again</li>
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Show progress bar while loading/running */} 
            {(isLoading || status === 'RUNNING' || status === 'PENDING') && renderProgressBar()}

            {/* Show completion message with better styling */} 
            {status === 'COMPLETED' && !isLoading && (
                <div style={{ 
                    margin: '15px auto', 
                    padding: '10px 15px', 
                    backgroundColor: '#f1f8e9', 
                    border: '1px solid #c5e1a5',
                    borderRadius: '4px',
                    color: '#33691e',
                    maxWidth: '80%',
                    textAlign: 'center'
                }}>
                    <p style={{ fontWeight: 'bold', fontSize: '16px', margin: '0 0 5px 0' }}>
                        Analysis Completed Successfully!
                    </p>
                    <p style={{ margin: 0 }}>
                        Review the charts below to see repository metrics.
                    </p>
                </div>
            )}

            {/* Show charts section with better visibility indicator */}
            <div style={{ 
                opacity: status === 'COMPLETED' ? 1 : 0.4, 
                transition: 'opacity 0.3s ease',
                pointerEvents: status === 'COMPLETED' ? 'auto' : 'none'
            }}>
                <ChartTabs />
            </div>

            <Footer />
        </div>
    );
}

export default Dashboard;
