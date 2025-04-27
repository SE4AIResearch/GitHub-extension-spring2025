import React, { useState, useEffect } from 'react';
import { AnalysisManager } from '../services/ApiService.js';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import './TrendsHistory.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Define all metrics with their properties
const METRICS = {
  'CountLineCode': { 
    displayName: 'Lines of Code', 
    isInteger: true,
    isCommon: true
  },
  'CountClassCoupled': { 
    displayName: 'Coupling Between Objects', 
    isInteger: true,
    isCommon: true
  },
  'CountDeclMethod': { 
    displayName: 'Number of Methods', 
    isInteger: true,
    isCommon: true
  },
  'MaxInheritanceTree': { 
    displayName: 'Depth of Inheritance Tree', 
    isInteger: true,
    isCommon: true
  },
  'CountClassDerived': { 
    displayName: 'Number of Children', 
    isInteger: true,
    isCommon: false
  },
  'CountDeclClass': { 
    displayName: 'Number of Classes', 
    isInteger: true,
    isCommon: false
  },
  'SumCyclomatic': { 
    displayName: 'Weighted Methods per Class', 
    isInteger: false,
    isCommon: true
  },
  'PercentLackOfCohesion': { 
    displayName: 'Lack of Cohesion of Methods', 
    isInteger: false,
    isCommon: true
  }
};

// Derive the specific metric arrays from the METRICS object
const COMMON_METRICS = Object.keys(METRICS).filter(key => METRICS[key].isCommon);

// Helper function to get the display name for a metric
const getMetricDisplayName = (metricKey) => {
  return METRICS[metricKey]?.displayName || metricKey;
};

// Helper function to check if a metric should display integer values
const isIntegerMetric = (metricKey) => {
  return METRICS[metricKey]?.isInteger || false;
};

const TrendsHistory = ({ metricData = null }) => {
  const [previousData, setPreviousData] = useState(null);
  const [latestData, setLatestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [error, setError] = useState(null);
  const [previousFileExists, setPreviousFileExists] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('CountLineCode'); 
  const [metricOptions, setMetricOptions] = useState(COMMON_METRICS); 
  const [chartData, setChartData] = useState(null);
  const [changedClassNames, setChangedClassNames] = useState(new Set());

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // Get repository URL from localStorage
        const appNamespace = 'github-extension-';
        const repoUrl = localStorage.getItem(`${appNamespace}repoAnalysisUrl`);
        
        if (!repoUrl) {
          setError("No repository URL found. Please complete a repository analysis first.");
          setLoading(false);
          return;
        }
        
        // Get analysis status to retrieve list of output files
        const statusResponse = await AnalysisManager.checkAnalysisStatus(repoUrl);
        
        if (statusResponse && statusResponse.status === 'COMPLETED' && statusResponse.outputFiles) {
          //console.log("TrendsHistory: Available files:", statusResponse.outputFiles);
          
          // For debugging, list all JSON files
          const jsonFiles = statusResponse.outputFiles.filter(filename => filename.endsWith('.json'));
          //console.log("TrendsHistory: Found JSON files:", jsonFiles);
          
          // Get latest file
          let latestFile = jsonFiles.find(filename => filename.includes('_latest.json'));
          
          // Check if metricData is already provided
          if (metricData) {
            //console.log("TrendsHistory - Got metricData");
            setLatestData(metricData);
            
            // once able to find latest then find previous file
            if (latestFile) {
              const prevFile = latestFile.replace('_latest.json', '_previous.json');
              
              // Checking previous file actually exists in the available files
              if (statusResponse.outputFiles.includes(prevFile)) {
                //console.log("TrendsHistory- Found matching previous file:", prevFile);
                
                // Set loading state for previous file
                setLoadingPrevious(true);
                
                // Fetch the previous file
                try {
                  const prevData = await AnalysisManager.loadMetricsData(prevFile);
                  //console.log("TrendsHistory- Previous file loaded successfully");
                  setPreviousData(prevData);
                  setPreviousFileExists(true);
                } catch (err) {
                  //console.error("TrendsHistory- Error loading previous file:", err);
                  setError("Could not load previous version data. " + err.message);
                  setPreviousFileExists(false);
                } finally {
                  setLoadingPrevious(false);
                }
              } else {
                //console.log("TrendsHistory- No matching previous file found for:", latestFile);
                setError("Previous version data not found. Please ensure both 'latest' and 'previous' files exist.");
                setPreviousFileExists(false);
              }
            } else {
              setError("Cannot identify file pattern for comparison. Please complete a repository analysis first.");
              setPreviousFileExists(false);
            }
          } 
          // If metricData is not provided, fetch both latest and previous
          else if (latestFile) {
            //console.log("TrendsHistory- Fetching latest file:", latestFile);
            
            const prevFile = latestFile.replace('_latest.json', '_previous.json');
            
            // Check if previous file exists in the available files
            if (statusResponse.outputFiles.includes(prevFile)) {
              //console.log("TrendsHistory- Found matching previous file:", prevFile);
              
              // Set loading state for both files
              setLoadingPrevious(true);
              
              // Fetch both files
              try {
                const [latestData, prevData] = await Promise.all([
                  AnalysisManager.loadMetricsData(latestFile),
                  AnalysisManager.loadMetricsData(prevFile)
                ]);
                
                //console.log("TrendsHistory- Both files loaded");
                setLatestData(latestData);
                setPreviousData(prevData);
                setPreviousFileExists(true);
              } catch (err) {
                //console.error("TrendsHistory- Error loading files:", err);
                setError("Error loading metrics data: " + err.message);
                setPreviousFileExists(false);
              } finally {
                setLoadingPrevious(false);
              }
            } else {
              // If no previous file exists, just fetch latest
              try {
                const latestData = await AnalysisManager.loadMetricsData(latestFile);
                setLatestData(latestData);
                setError("Previous version data not found. Showing only latest data.");
                setPreviousFileExists(false);
              } catch (err) {
                //console.error("TrendsHistory- Error loading latest file:", err);
                setError("Error loading metrics data: " + err.message);
              }
            }
          } else {
            setError("No metrics files found. Please complete a repository analysis first.");
          }
        } else {
          setError("Repository analysis not complete. Please complete an analysis first.");
        }
      } catch (err) {
        //console.error("TrendsHistory- Error fetching analysis status:", err);
        setError("Error fetching analysis status: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatus();
  }, [metricData]);

  // Effect to calculate changed classes when data is ready
  useEffect(() => {
    if (latestData && previousData && !loadingPrevious && previousFileExists) {
      console.log("TrendsHistory: Calculating changed classes...");
      const latestClasses = latestData.class_metrics || [];
      const previousClasses = previousData.class_metrics || [];

      const latestMetricsMap = new Map(latestClasses.map(cls => [cls.name, cls.metrics || {}]));
      const previousMetricsMap = new Map(previousClasses.map(cls => [cls.name, cls.metrics || {}]));

      const allClassNames = new Set([...latestClasses.map(cls => cls.name), ...previousClasses.map(cls => cls.name)]);
      const classesWithChanges = new Set();

      allClassNames.forEach(className => {
        const latestMetrics = latestMetricsMap.get(className);
        const previousMetrics = previousMetricsMap.get(className);

        let hasChanged = false;

        if (latestMetrics && previousMetrics) {
          // Class exists in both, compare metrics
          const allMetricKeys = new Set([...Object.keys(latestMetrics), ...Object.keys(previousMetrics)]);
          for (const key of allMetricKeys) {
            if (latestMetrics[key] !== previousMetrics[key]) {
              hasChanged = true;
              break;
            }
          }
        } else {
          // Class added or removed
          hasChanged = true;
        }

        if (hasChanged) {
          classesWithChanges.add(className);
        }
      });

      console.log("TrendsHistory: Found changed classes:", classesWithChanges);
      setChangedClassNames(classesWithChanges);
    } else if (latestData && !previousFileExists && !loadingPrevious) {
       // If only latest data exists, technically all classes are 'new' or 'changed' from nothing
       // Depending on desired behavior, you might want to highlight all, or none.
       // Let's default to highlighting none if there's no comparison baseline.
       setChangedClassNames(new Set());
    }
  }, [latestData, previousData, loadingPrevious, previousFileExists]);

  // Extract metrics when data is loaded
  useEffect(() => {
    if (!latestData || !latestData.class_metrics || latestData.class_metrics.length === 0) return;

    try {
      // Create a set to store unique metrics
      const allMetrics = new Set();
      latestData.class_metrics.forEach(cls => {
        if (cls && cls.metrics) {
          // Add all numeric metrics from this class
          Object.entries(cls.metrics).forEach(([key, value]) => {
            if (typeof value === 'number') {
              allMetrics.add(key);
            }
          });
        }
      });

      // Convert to array and sort
      const metrics = Array.from(allMetrics).sort();
      
      //console.log("TrendsHistory- Found metrics in data:", metrics);
      
      if (metrics.length > 0) {
        setMetricOptions(metrics);
        
        if (!metrics.includes(selectedMetric) && metrics.length > 0) {
          //console.log(`TrendsHistory- Selected metric ${selectedMetric} not found, switching to ${metrics[0]}`);
          setSelectedMetric(metrics[0]);
        }
      } else {
        //console.warn("TrendsHistory- No metrics found in data, using common metrics");
        setMetricOptions(COMMON_METRICS);
        
        if (!COMMON_METRICS.includes(selectedMetric)) {
          setSelectedMetric(COMMON_METRICS[0]);
        }
      }
      
      // Debugging - analysing the structure of json data
      console.log("TrendsHistory- Sample class data structure:", 
        latestData.class_metrics.slice(0, 3).map(cls => ({
          name: cls.name,
          hasMetrics: !!cls.metrics,
          metricKeys: cls.metrics ? Object.keys(cls.metrics) : []
        }))
      );
    } catch (err) {
      //console.error("TrendsHistory- Error extracting metric options:", err);
      setMetricOptions(COMMON_METRICS);
    }
  }, [latestData, selectedMetric]);

  // Prepare chart data when data, selected metric, or changed classes change
  useEffect(() => {
    if (!latestData || loadingPrevious) return;

    console.log("TrendsHistory: Preparing chart data for metric:", selectedMetric);

    const prepareChartData = () => {
      const latestClasses = latestData.class_metrics || [];
      const previousClasses = previousData?.class_metrics || [];

      const classNames = new Set();
      latestClasses.forEach(cls => classNames.add(cls.name));
      if (previousClasses.length > 0 && previousFileExists) { // Only add previous if it exists
        previousClasses.forEach(cls => classNames.add(cls.name));
      }
      const uniqueFullClassNames = Array.from(classNames).sort(); // Store full names

      const latestMap = new Map();
      latestClasses.forEach(cls => {
        if (cls.metrics && cls.metrics[selectedMetric] !== undefined) {
          latestMap.set(cls.name, cls.metrics[selectedMetric] || 0);
        }
      });

      const previousMap = new Map();
      if (previousClasses.length > 0 && previousFileExists) { // Only map previous if it exists
         previousClasses.forEach(cls => {
           if (cls.metrics && cls.metrics[selectedMetric] !== undefined) {
             previousMap.set(cls.name, cls.metrics[selectedMetric] || 0);
           }
         });
      }

      // Generate labels (short names)
      const labels = uniqueFullClassNames.map(name => name.split('.').pop());

      // Generate values
      const latestValues = uniqueFullClassNames.map(name => latestMap.get(name) || 0);
      // Only include previous values if the file exists
      const previousValues = previousFileExists
                             ? uniqueFullClassNames.map(name => previousMap.get(name) || 0)
                             : uniqueFullClassNames.map(() => 0); // Or null/undefined if preferred


      // --- Highlighting Logic ---
      const highlightColorLatest = 'rgba(16, 110, 80, 0.9)'; // More opaque green
      const standardColorLatest = 'rgba(209, 236, 244, 0.6)';
      const highlightColorPrevious = 'rgba(100, 100, 100, 0.9)'; // More opaque gray
      const standardColorPrevious = 'rgba(150, 150, 150, 0.6)'; // Slightly more opaque standard
      
      // Determine colors based on whether the class name is in the changed set
      const latestBackgroundColors = uniqueFullClassNames.map(name =>
        changedClassNames.has(name) ? highlightColorLatest : standardColorLatest
      );
      const previousBackgroundColors = uniqueFullClassNames.map(name =>
        changedClassNames.has(name) ? highlightColorPrevious : standardColorPrevious
      );

       // Highlight borders too (optional, example below keeps borders consistent but slightly darker for previous highlight)
       const latestBorderColors = uniqueFullClassNames.map(name => 'rgb(16, 110, 80)'); // Consistent latest border
       const previousBorderColors = uniqueFullClassNames.map(name =>
         changedClassNames.has(name) ? 'rgb(80, 80, 80)' : 'rgb(120, 120, 120)' // Darker border for highlighted previous
       );

      const datasets = [
        // Only include previous dataset if the file exists
        ...(previousFileExists ? [{
          label: 'Previous Version',
          data: previousValues,
          backgroundColor: previousBackgroundColors,
          borderColor: previousBorderColors,
          borderWidth: 1,
        }] : []),
        {
          label: 'Latest Version',
          data: latestValues,
          backgroundColor: latestBackgroundColors,
          borderColor: latestBorderColors,
          borderWidth: 1,
        }
      ];


      return {
        labels,
        datasets,
        metricName: getMetricDisplayName(selectedMetric),
        fullClassNames: uniqueFullClassNames // Pass full names for tooltip lookup
      };
    };

    setChartData(prepareChartData());
  }, [latestData, previousData, selectedMetric, loadingPrevious, changedClassNames, previousFileExists]);

  if (loading || loadingPrevious) {
    return <div className="trends-history-loading">
      {loadingPrevious ? "Loading previous version data..." : "Loading metrics data..."}
    </div>;
  }

  if (error && !latestData) {
    return <div className="trends-history-error">{error}</div>;
  }

  const barWidth = 30; 
  const totalBars = chartData?.labels?.length || 0;
  const minimumChartWidth = Math.max(1200, totalBars * barWidth);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 15,
          padding: 15
        }
      },
      title: {
        display: true,
        text: chartData ? `${chartData.metricName} Comparison` : 'Metrics Comparison',
        font: {
          size: 16
        },
        padding: {
          bottom: 10
        }
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            const index = tooltipItems[0]?.dataIndex;
            // Use the full class name stored in chartData
            if (index !== undefined && chartData?.fullClassNames?.[index]) {
               return chartData.fullClassNames[index];
            }
            return tooltipItems[0]?.label || ''; // Fallback to label
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          autoSkip: false,
          maxRotation: 45, 
          minRotation: 45,
          font: {
            size: 10
          },
          padding: 10
        },
        grid: {
          offset: true
        }
      },
      y: {
        title: {
          display: true,
          text: chartData?.metricName || getMetricDisplayName(selectedMetric)
        },
        beginAtZero: true,
        ticks: {
          stepSize: isIntegerMetric(selectedMetric) ? 1 : undefined,
          callback: function(value) {
            if (isIntegerMetric(selectedMetric)) {
              return Math.floor(value);
            }
            return value;
          }
        }
      }
    },
    layout: {
      padding: {
        bottom: 15
      }
    }
  };

  return (
    <div className="trends-history">
      <h2>Trends History: Metric Comparison</h2>
      
      {error && <div className="warning-message">{error}</div>}

      <div className="metric-selector">
        <label htmlFor="metric-select">Select Metric to Compare:</label>
        <select 
          id="metric-select"
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="metric-selector-dropdown"
        >
          {metricOptions.map(metric => (
            <option key={metric} value={metric}>
              {getMetricDisplayName(metric)}
            </option>
          ))}
        </select>
        </div>

      {chartData ? (
        <div className="chart-container">
          {/* Fixed header with legend - adjusted to handle missing previous data */}
          <div className="legend-container">
            {previousFileExists && (
              <div className="legend-item legend-item-previous">
                <div className="legend-color legend-color-previous"></div>
                <span>Previous Version</span>
              </div>
            )}
            <div className="legend-item">
              <div className="legend-color legend-color-latest"></div>
              <span>Latest Version</span>
            </div>
          </div>

          <div className="chart-title">
            {chartData.metricName} Comparison
      </div>

          <div className="chart-scroll-wrapper">
            <button 
              onClick={() => {
                const scrollContainer = document.getElementById('chart-scroll-container');
                if (scrollContainer) {
                  scrollContainer.scrollBy({ left: -300, behavior: 'smooth' });
                }
              }}
              className="chart-arrow chart-arrow-left"
            >
              &lt;
            </button>
            
            <button 
              onClick={() => {
                const scrollContainer = document.getElementById('chart-scroll-container');
                if (scrollContainer) {
                  scrollContainer.scrollBy({ left: 300, behavior: 'smooth' });
                }
              }}
              className="chart-arrow chart-arrow-right"
            >
              &gt;
            </button>
            
            <div className="chart-padding-container">
              <div id="chart-scroll-container">
                <div className="chart-inner-container" style={{ minWidth: `${minimumChartWidth}px` }}>
                  <Bar data={{
                    ...chartData,
                    datasets: chartData.datasets
                  }} options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        display: false
                      },
                      title: {
                        display: false
                      }
                    }
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-data-message">
          No data available for visualization
      </div>
      )}
    </div>
  );
};

export default TrendsHistory;
