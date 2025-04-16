import React, { useEffect, useState, useCallback } from "react";
import Header from "./components/Header.js";
import ChartTabs from "./components/ChartTabs.js";
import Footer from "./components/Footer.js";
import RepoAnalysis from "./components/RepoAnalysis.js";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const decodedTab = metricName ? decodeURIComponent(metricName) : "";

  const [metricData, setMetricData] = useState([]);
  const [selectedTab, setSelectedTab] = useState(decodedTab);
  const [repoUrl, setRepoUrl] = useState('');
  const [showRepoAnalysis, setShowRepoAnalysis] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metricError, setMetricError] = useState(null);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [forceReanalysis, setForceReanalysis] = useState(false);

  /* Check for forceReanalysis in URL query parameters
  * For fixing the issue of analysis results not being updated for latest repository 
  */
  useEffect(() => {
    // Parse query parameters from the URL
    const queryParams = new URLSearchParams(location.search);
    const forceFromUrl = queryParams.get('forceReanalysis') === 'true';
    
    // Set forceReanalysis state if URL parameter exists
    if (forceFromUrl) {
      console.log("ForceReanalysis flag found in URL, setting state to force reanalysis");
      setForceReanalysis(true);
      
      // Update the URL without the parameter to prevent reloading with force flag
      const newUrl = window.location.pathname + window.location.hash.split('?')[0];
      window.history.replaceState({}, '', newUrl);
    }
  }, [location]);

  /* Function to check the URL from all possible locations and return the most recent one
  * For fixing the issue of the URL not being updated in the localStorage and analysis 
  * not being updated for latest repository
  */
  const getLatestRepositoryUrl = useCallback(() => {
    // Define a simple way to get the URL from different sources
    const appNamespace = 'github-extension-';
    const fromLocalStorage = localStorage.getItem(`${appNamespace}repoAnalysisUrl`);
    let fromChromeStorage = null;
    
    try {
      // Try to get the URL from chrome.storage.local synchronously if we're in a Chrome extension
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        // This will update fromChromeStorage asynchronously, but won't block execution
        chrome.storage.local.get(['repoAnalysisUrl'], function(result) {
          if (chrome.runtime.lastError) {
            console.error("Error accessing chrome.storage:", chrome.runtime.lastError);
          } else if (result && result.repoAnalysisUrl) {
            fromChromeStorage = result.repoAnalysisUrl;
            console.log("Retrieved URL from chrome.storage:", fromChromeStorage);
            
            // If we got a value from chrome.storage and it's different from localStorage,
            // update localStorage to keep them in sync
            if (fromChromeStorage && fromChromeStorage !== fromLocalStorage) {
              localStorage.setItem(`${appNamespace}repoAnalysisUrl`, fromChromeStorage);
              console.log("Updated localStorage with URL from chrome.storage");
              
              // Update our state if needed
              if (fromChromeStorage !== repoUrl) {
                console.log("Updating repository URL to match chrome.storage:", fromChromeStorage);
                setRepoUrl(fromChromeStorage);
              }
            }
          }
        });
      }
    } catch (error) {
      console.error("Error checking chrome.storage:", error);
    }
    
    // For immediate return, use the localStorage value which is synchronously available
    return fromLocalStorage;
  }, [repoUrl]);

  useEffect(() => {
    // Function to get repository URL from multiple sources
    const getRepositoryUrl = async () => {
      try {
        // Use our new function to get the latest URL
        const latestUrl = getLatestRepositoryUrl();
        
        if (latestUrl) {
          console.log("Retrieved repository URL:", latestUrl);
          setRepoUrl(latestUrl);
          setShowRepoAnalysis(true);
          
          // Check if forceReanalysis flag is set in localStorage
          const appNamespace = 'github-extension-';
          const shouldForceReanalysis = localStorage.getItem(`${appNamespace}forceReanalysis`) === 'true';
          if (shouldForceReanalysis) {
            console.log("ForceReanalysis flag found in localStorage, setting state to force reanalysis");
            setForceReanalysis(true);
            // Clear the flag once it's read
            localStorage.removeItem(`${appNamespace}forceReanalysis`);
          }
          
          return;
        }
        
        // If there's no URL in localStorage, then try chrome.storage if available
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          try {
            chrome.storage.local.get(['repoAnalysisUrl'], function(result) {
              if (chrome.runtime.lastError) {
                console.error("Error accessing chrome.storage:", chrome.runtime.lastError);
              } else if (result && result.repoAnalysisUrl) {
                console.log("Retrieved repository URL from chrome.storage:", result.repoAnalysisUrl);
                setRepoUrl(result.repoAnalysisUrl);
                setShowRepoAnalysis(true);
                
                // Also save to localStorage for future use
                const appNamespace = 'github-extension-';
                localStorage.setItem(`${appNamespace}repoAnalysisUrl`, result.repoAnalysisUrl);
              } else {
                console.warn("No repository URL found in storage");
                setMetricError("No repository URL found. Please navigate to a GitHub repository and use the Repository Analysis link.");
              }
            });
          } catch (err) {
            console.error("Error accessing chrome.storage:", err);
          }
        } else {
          // Only show error if we couldn't find the URL anywhere
          console.warn("No repository URL found and chrome.storage not available");
          setMetricError("No repository URL found. Please navigate to a GitHub repository and use the Repository Analysis link.");
        }
      } catch (error) {
        console.error("Error retrieving repository URL:", error);
        setMetricError(`Failed to retrieve repository URL: ${error.message}`);
      }
    };

    // Call the function
    getRepositoryUrl();
    
    // Add event listener for storage changes
    const handleStorageChange = (event) => {
      const appNamespace = 'github-extension-';
      if (event.key === `${appNamespace}repoAnalysisUrl`) {
        const newRepoUrl = event.newValue;
        if (newRepoUrl && newRepoUrl !== repoUrl) {
          console.log("Repository URL changed in localStorage. Updating from:", repoUrl, "to:", newRepoUrl);
          setRepoUrl(newRepoUrl);
          setShowRepoAnalysis(true);
          setAnalysisCompleted(false); // Reset analysis state
          setMetricData([]); // Clear previous metric data
        }
      }
    };
    
    // Add event listener
    window.addEventListener('storage', handleStorageChange);
    
    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [repoUrl, getLatestRepositoryUrl]);

  const handleAnalysisComplete = useCallback((status) => {
    console.log("Analysis completed with status:", status);
    setAnalysisCompleted(true);
    
    // Reset forceReanalysis flag after analysis is complete
    setForceReanalysis(false);
    
    // After analysis completes, check if the repository URL in storage has changed
    const appNamespace = 'github-extension-';
    const currentStoredUrl = localStorage.getItem(`${appNamespace}repoAnalysisUrl`);
    
    // If the stored URL changed and is different from our current repoUrl, update it
    if (currentStoredUrl && currentStoredUrl !== repoUrl) {
      console.log("Repository URL changed in storage, updating from:", repoUrl, "to:", currentStoredUrl);
      setRepoUrl(currentStoredUrl);
    }
  }, [repoUrl]);

  const handleMetricsLoaded = useCallback((data) => {
    console.log("Metrics data loaded:", data);
    setMetricData(data);
    setLoadingMetrics(false);
  }, []);

  const getTopRecords = (key, limit = 5) => {
    if (!metricData || metricData.length === 0) return [];
    
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

  const renderCharts = () => {
    if (loadingMetrics) {
      return <div className="loading-metrics">Loading metrics data...</div>;
    }
    
    if (metricError) {
      return <div className="metrics-error">{metricError}</div>;
    }
    
    if (!metricData || metricData.length === 0) {
      return (
        <div className="no-metrics">
          <p>No metrics data available. Please complete the repository analysis first.</p>
        </div>
      );
    }
    
    return (
      <>
        <ChartTabs
          activeTab={decodedTab}
          setActiveTabInParent={setSelectedTab}
          metricData={metricData}
        />

        {!selectedTab && (
          <div className="overview-charts-section">
            <h2 className="overview-heading">Metric Overviews</h2>
            <div className="overview-charts-container">
              {overviewCharts.map((metric, index) => {
                const topData = getTopRecords(metric.key);
                if (topData.length === 0) return null;
                
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
      </>
    );
  };

  return (
    <div className="dashboard-container">
      <Header />

      {showRepoAnalysis && repoUrl ? (
        <>
          <RepoAnalysis 
            repoUrl={repoUrl} 
            onAnalysisComplete={handleAnalysisComplete}
            onMetricsLoaded={handleMetricsLoaded}
            forceReanalysis={forceReanalysis}
          />

          {analysisCompleted && renderCharts()}
        </>
      ) : (
        renderCharts()
      )}

      <Footer />
    </div>
  );
};

export default Dashboard;
