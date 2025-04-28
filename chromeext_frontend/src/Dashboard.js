import React, { useEffect, useState, useCallback } from "react";
import Header from "./components/Header.js";
import ChartTabs from "./components/ChartTabs.js";
import Footer from "./components/Footer.js";
import RepoAnalysis from "./components/RepoAnalysis.js";
import QualityMetrics from "./components/QualityMetrics.js";
import LargestClassesChart from "./components/LargestClassesChart.js";
import MostComplexFunctionsChart from "./components/MostComplexFunctionsChart.js";
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
  const [showImpactedOnly, setShowImpactedOnly] = useState(true); 
  const [commitData, setCommitData] = useState(null);

  // Exposing metrics data for chart download
  useEffect(() => {
    window.appMetricsData = metricData;
    return () => {
      window.appMetricsData = null;
    };
  }, [metricData]);

  useEffect(() => {
    setSelectedTab(decodedTab);
  }, [decodedTab]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const forceFromUrl = queryParams.get('forceReanalysis') === 'true';
    if (forceFromUrl) {
      setForceReanalysis(true);
      const newUrl = window.location.pathname + window.location.hash.split('?')[0];
      window.history.replaceState({}, '', newUrl);
    }
  }, [location]);


  const fetchSummaryData = async (url, commitId) => {
    try {
      const encodedUrl = encodeURIComponent(url);
      const response = await fetch(`http://localhost:8000/api/commits/message?url=${encodedUrl}&id=${commitId}`);
      const data = await response.json();
      console.log("Response from fetchSummaryData:", data);
  
      if (response.ok) {
        setCommitData({
          commitMessage: data.commitMessage,
          refactorings: data.refactorings,
        });
      } else {
        setCommitData({
          commitMessage: null,
          refactorings: null,
          error: data.error || 'Failed to fetch commit summary',
        });
      }
    } catch (err) {
      console.error('Error fetching commit summary:', err);
      setCommitData({
        commitMessage: null,
        refactorings: null,
        error: err.message || 'Unknown error',
      });
    }
  };

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(
        ['github-extension-repoAnalysisUrl', 'github-extension-commitID', 'github-extension-summary', 'github-extension-forceReanalysis'],
        (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error accessing chrome.storage:', chrome.runtime.lastError);
            return;
          }
  
          console.log('Chrome storage result:', result);
  
          const { 
            'github-extension-repoAnalysisUrl': repoAnalysisUrl, 
            'github-extension-commitID': commitID, 
            'github-extension-summary': summary,
            'github-extension-forceReanalysis': forceReanalysis 
          } = result;
  
          if (repoAnalysisUrl) {
            setRepoUrl(repoAnalysisUrl);
            setShowRepoAnalysis(true);
          }
  
          if (summary) {
            console.log('Loaded commit summary:', summary);
            setCommitData({
              commitMessage: summary,
              refactorings: null,
            });
          } else {
            console.warn('No commit summary found in chrome.storage.local.');
          }
  
          if (forceReanalysis) {
            setForceReanalysis(true);
            chrome.storage.local.remove('github-extension-forceReanalysis');
          }
  
          if (commitID) {
            console.log("Fetching with commitID:", commitID);
            // You disabled fetching from localhost (good).
          } else {
            console.warn('No commitID found in chrome.storage.local');
          }
        }
      );
    } else {
      console.error('Chrome APIs not available. This is not running inside a Chrome extension.');
    }
  }, []); 
  

  const getLatestRepositoryUrl = useCallback(() => {
    const appNamespace = 'github-extension-';
    const fromLocalStorage = localStorage.getItem(`${appNamespace}repoAnalysisUrl`);
    let fromChromeStorage = null;
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['repoAnalysisUrl'], function(result) {
          if (chrome.runtime.lastError) {
            console.error("Error accessing chrome.storage:", chrome.runtime.lastError);
          } else if (result && result.repoAnalysisUrl) {
            fromChromeStorage = result.repoAnalysisUrl;
            if (fromChromeStorage && fromChromeStorage !== fromLocalStorage) {
              localStorage.setItem(`${appNamespace}repoAnalysisUrl`, fromChromeStorage);
              if (fromChromeStorage !== repoUrl) {
                setRepoUrl(fromChromeStorage);
              }
            }
          }
        });
      }
    } catch (error) {
      console.error("Error checking chrome.storage:", error);
    }
    return fromLocalStorage;
  }, [repoUrl]);

  useEffect(() => {
    const getRepositoryUrl = async () => {
      try {
        const latestUrl = getLatestRepositoryUrl();
        if (latestUrl) {
          setRepoUrl(latestUrl);
          setShowRepoAnalysis(true);
          const appNamespace = 'github-extension-';
          const shouldForceReanalysis = localStorage.getItem(`${appNamespace}forceReanalysis`) === 'true';
          if (shouldForceReanalysis) {
            setForceReanalysis(true);
            localStorage.removeItem(`${appNamespace}forceReanalysis`);
          }
          const commitID = localStorage.getItem(`${appNamespace}commitID`);
          if (commitID) {
            console.log("Calling fetchSummaryData with repoUrl and commitID:", latestUrl, commitID);
            // fetchSummaryData(latestUrl, commitID);
          } else {
            console.warn("No commitID found in localStorage");
          }
          return;
        }
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          try {
            chrome.storage.local.get(['repoAnalysisUrl'], function(result) {
              if (chrome.runtime.lastError) {
                console.error("Error accessing chrome.storage:", chrome.runtime.lastError);
              } else if (result && result.repoAnalysisUrl) {
                setRepoUrl(result.repoAnalysisUrl);
                setShowRepoAnalysis(true);
                const appNamespace = 'github-extension-';
                localStorage.setItem(`${appNamespace}repoAnalysisUrl`, result.repoAnalysisUrl);
              } else {
                setMetricError("No repository URL found. Please navigate to a GitHub repository and use the Repository Analysis link.");
              }
            });
          } catch (err) {
            console.error("Error accessing chrome.storage:", err);
          }
        } else {
          setMetricError("No repository URL found. Please navigate to a GitHub repository and use the Repository Analysis link.");
        }
      } catch (error) {
        setMetricError(`Failed to retrieve repository URL: ${error.message}`);
      }
    };

    getRepositoryUrl();

    const handleStorageChange = (event) => {
      const appNamespace = 'github-extension-';
      if (event.key === `${appNamespace}repoAnalysisUrl`) {
        const newRepoUrl = event.newValue;
        if (newRepoUrl && newRepoUrl !== repoUrl) {
          setRepoUrl(newRepoUrl);
          setShowRepoAnalysis(true);
          setAnalysisCompleted(false);
          setMetricData([]);
        }
      }
    };
    

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [repoUrl, getLatestRepositoryUrl]);

  const handleAnalysisComplete = useCallback((status) => {
    setAnalysisCompleted(true);
    setForceReanalysis(false);
    const appNamespace = 'github-extension-';
    const currentStoredUrl = localStorage.getItem(`${appNamespace}repoAnalysisUrl`);
    if (currentStoredUrl && currentStoredUrl !== repoUrl) {
      setRepoUrl(currentStoredUrl);
    }
  }, [repoUrl]);

  const handleMetricsLoaded = useCallback((data) => {
    setMetricData(data);
    setLoadingMetrics(false);
  }, []);

  const getMostImpactedRecords = (limit = 5) => {
    if (!metricData) return [];
    
    // If metricData is the full object with class_metrics and cyclomatic
    const classMetricsArray = Array.isArray(metricData.class_metrics) 
      ? metricData.class_metrics 
      : metricData;
      
    if (!classMetricsArray || classMetricsArray.length === 0) return [];
    
    return [...classMetricsArray]
      .map(cls => ({
        ...cls,
        impactScore: cls.totalLOC * 0.6 + cls.cyclomatic * 0.4
      }))
      .sort((a, b) => b.impactScore - a.impactScore)
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

  const handleChartClick = (route, highlightClasses = []) => {
    navigate(`/dashboard/${encodeURIComponent(route)}`, {
      state: { highlightClasses },
    });
  };
  
  const renderCharts = () => {
    if (loadingMetrics) return <div className="loading-metrics">Loading metrics data...</div>;
    if (metricError) return <div className="metrics-error">{metricError}</div>;
    if (!metricData || metricData.length === 0) {
      return <div className="no-metrics">No metrics data available. Please complete the repository analysis first.</div>;
    }

    return (
      <>
        {decodedTab && <h2 className="overview-heading">Viewing: {decodedTab}</h2>}
        <QualityMetrics metricData={metricData} />
        <ChartTabs
          activeTab={decodedTab}
          setActiveTabInParent={setSelectedTab}
          metricData={metricData}
        />
        {!decodedTab && (
          
          <div className="overview-charts-section">
            <h2 className="overview-heading">Metric Overviews</h2>
            <div className="toggle-filter">
              <label>
                <input
                  type="checkbox"
                  checked={showImpactedOnly}
                  onChange={() => setShowImpactedOnly(!showImpactedOnly)}
                />
                Show Only Most Impacted Classes
              </label>
            </div>

            <div className="overview-charts-container">
              {overviewCharts.map((metric, index) => {
                const topData = getMostImpactedRecords(5); 
                if (topData.length === 0) return null;
                const chartData = createBarChartData(topData, metric.key);
                const options = {
                  onClick: (event, elements) => {
                    if (elements.length > 0) {
                      const selected = topData.map((item) => item.className);
                      handleChartClick(metric.route, selected);
                    }
                  },
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.dataset.label}: ${context.raw}`,
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
                    y: { beginAtZero: true },
                  },
                };
                return (
                  <div
                    key={index}
                    className="overview-chart"
                    onClick={() => handleChartClick(metric.route)}
                  >
                    <h4 className="overview-chart-title">{metric.title}- Most Impacted Classes</h4>
                    <Bar data={chartData} options={options} />
                  </div>
                );
              })}
            </div>
            
            {/*Adding the charts for the largest classes and functions*/}
            <h2 className="overview-heading" style={{ marginTop: "30px" }}>Largest Code Entities</h2>
            <div className="overview-charts-container">
              <LargestClassesChart metricsData={metricData} />
              <MostComplexFunctionsChart metricsData={metricData} />
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="dashboard-container">
      <Header metricData={metricData} />

      <div className="commit-summary">
          {commitData && commitData.commitMessage ? (
            <div dangerouslySetInnerHTML={{ __html: commitData.commitMessage }} />
          ) : (
            <div>No commit summary available.</div>
          )}
      </div>
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
