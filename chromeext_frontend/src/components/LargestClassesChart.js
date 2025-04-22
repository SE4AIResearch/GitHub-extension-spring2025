import React, { useState, useEffect } from "react";
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

const LargestClassesChart = ({ metricsData }) => {
  const [chartData, setChartData] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classDetailsVisible, setClassDetailsVisible] = useState(false);
  const [allClassData, setAllClassData] = useState([]);
  const displayCount = 5; // Fixed display count

  useEffect(() => {
    console.log("LargestClassesChart: metricsData received:", { 
      exists: !!metricsData, 
      length: metricsData?.length || 0,
      hasClassMetrics: !!metricsData?.class_metrics
    });
    
    if (!metricsData) return;

    // Check if we're receiving the full metrics object or just the class_metrics array
    const classMetricsArray = Array.isArray(metricsData.class_metrics) 
      ? metricsData.class_metrics 
      : metricsData;
    
    if (!classMetricsArray || classMetricsArray.length === 0) {
      console.log("LargestClassesChart: No class metrics data available");
      return;
    }

    console.log("LargestClassesChart: Using class metrics array with length:", classMetricsArray.length);

    // Extract class data
    const classData = classMetricsArray
      .filter(item => {
        const kind = item.kind || '';
        return (kind.endsWith('Class') && !kind.includes('Unknown') && !kind.includes('Method') && !kind.includes('Constructor')) 
          || item.className;
      })
      .map(item => ({
        name: formatName(item.className || item.name),
        originalName: item.className || item.name,
        lines: item.totalLOC || item.metrics?.CountLineCode || 0,
        // Save all available metrics for detailed view
        allMetrics: item
      }))
      .sort((a, b) => b.lines - a.lines)
      .slice(0, displayCount);

    // Store all class data for detailed view access
    setAllClassData(classData);

    console.log("LargestClassesChart: Filtered class data:", classData);
    console.log("LargestClassesChart: Class data length:", classData.length);

    // Prepare chart data
    if (classData.length > 0) {
      const newChartData = {
        labels: classData.map(item => item.name),
        datasets: [
          {
            label: "Lines of Code",
            data: classData.map(item => item.lines),
            backgroundColor: "rgba(209, 236, 244, 0.5)",
            borderColor: "rgb(16, 110, 80)",
            borderWidth: 1,
          }
        ]
      };
      
      console.log("LargestClassesChart: Setting chart data");
      setChartData(newChartData);
    } else {
      console.log("LargestClassesChart: No class data found after filtering");
      setChartData(null);
    }
  }, [metricsData]);

  // Helper function to format and truncate long names
  const formatName = (name) => {
    if (!name) return "Unnamed";
    
    // Remove package names for cleaner display
    const shortName = name.split('.').pop();
    
    // Truncate if too long
    return shortName.length > 25 ? shortName.substring(0, 22) + "..." : shortName;
  };

  const handleBarClick = (event, elements) => {
    if (elements.length > 0) {
      const clickedIndex = elements[0].index;
      const clickedClass = allClassData[clickedIndex];
      console.log("LargestClassesChart: Class clicked:", clickedClass);
      setSelectedClass(clickedClass);
      setClassDetailsVisible(true);
    }
  };

  const handleBackClick = () => {
    setSelectedClass(null);
    setClassDetailsVisible(false);
  };

  const chartOptions = {
    indexAxis: 'y',  // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleBarClick, // Add click handler for bars
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            return tooltipItems[0].label;
          },
          label: (context) => {
            const value = context.raw;
            return `Lines of Code: ${value}`;
          }
        }
      },
      title: {
        display: true,
        text: 'Largest Classes (by Size)',
        font: { size: 14, weight: 'bold' }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function(value, index) {
            const label = this.getLabelForValue(index);
            return label;
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Lines of Code'
        },
        beginAtZero: true
      }
    }
  };

  // Function to render detailed metrics for selected class
  const renderClassDetails = () => {
    if (!selectedClass) return null;
    
    const metrics = selectedClass.allMetrics;
    
    // Display available metrics (adapt this based on your actual data structure)
    return (
      <div className="class-details-container">
        <div className="class-details-header">
          <button 
            className="back-button" 
            onClick={handleBackClick}
            style={{
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              padding: "5px 10px",
              marginBottom: "10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              fontSize: "14px"
            }}
          >
            <span style={{ marginRight: "5px" }}>←</span> Back to chart
          </button>
          <h3 style={{ marginTop: "10px" }}>{selectedClass.originalName}</h3>
        </div>
        
        <div className="metrics-grid" style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "10px",
          marginTop: "15px"
        }}>
          {/* Lines of Code */}
          <div className="metric-card" style={{ 
            background: "#f9fafb", 
            padding: "10px", 
            borderRadius: "4px",
            border: "1px solid #e5e7eb"
          }}>
            <div className="metric-title" style={{ fontWeight: "bold", marginBottom: "5px" }}>Lines of Code</div>
            <div className="metric-value">{selectedClass.lines}</div>
          </div>
          
          {/* Cyclomatic Complexity */}
          {metrics.cyclomatic !== undefined && (
            <div className="metric-card" style={{ 
              background: "#f9fafb", 
              padding: "10px", 
              borderRadius: "4px",
              border: "1px solid #e5e7eb"
            }}>
              <div className="metric-title" style={{ fontWeight: "bold", marginBottom: "5px" }}>Cyclomatic Complexity</div>
              <div className="metric-value">{metrics.cyclomatic}</div>
            </div>
          )}
          
          {/* Coupling */}
          {metrics.coupling !== undefined && (
            <div className="metric-card" style={{ 
              background: "#f9fafb", 
              padding: "10px", 
              borderRadius: "4px",
              border: "1px solid #e5e7eb"
            }}>
              <div className="metric-title" style={{ fontWeight: "bold", marginBottom: "5px" }}>Coupling (CBO)</div>
              <div className="metric-value">{metrics.coupling}</div>
            </div>
          )}
          
          {/* Lack of Cohesion */}
          {metrics.lackOfCohesion !== undefined && (
            <div className="metric-card" style={{ 
              background: "#f9fafb", 
              padding: "10px", 
              borderRadius: "4px",
              border: "1px solid #e5e7eb"
            }}>
              <div className="metric-title" style={{ fontWeight: "bold", marginBottom: "5px" }}>Lack of Cohesion (LCOM)</div>
              <div className="metric-value">{metrics.lackOfCohesion}</div>
            </div>
          )}
          
          {/* File path */}
          {metrics.file && (
            <div className="metric-card" style={{ 
              background: "#f9fafb", 
              padding: "10px", 
              borderRadius: "4px",
              border: "1px solid #e5e7eb",
              gridColumn: "1 / -1"  // Make this span full width
            }}>
              <div className="metric-title" style={{ fontWeight: "bold", marginBottom: "5px" }}>File Path</div>
              <div className="metric-value" style={{ wordBreak: "break-all" }}>{metrics.file}</div>
            </div>
          )}
          
          {/* Other metrics from the metrics object if available */}
          {metrics.metrics && Object.entries(metrics.metrics).map(([key, value]) => {
            // Skip metrics we've already displayed or null values
            if (key === 'CountLineCode' || value === null || value === undefined) return null;
            
            return (
              <div key={key} className="metric-card" style={{ 
                background: "#f9fafb", 
                padding: "10px", 
                borderRadius: "4px",
                border: "1px solid #e5e7eb"
              }}>
                <div className="metric-title" style={{ fontWeight: "bold", marginBottom: "5px" }}>{formatMetricName(key)}</div>
                <div className="metric-value">{value}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Helper to format metric names for display
  const formatMetricName = (name) => {
    // Split camelCase or PascalCase
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  console.log("LargestClassesChart: Rendering with chartData:", !!chartData, "detailsVisible:", classDetailsVisible);

  return (
    <div className="overview-chart" style={{ height: "250px", position: "relative" }}>
      {classDetailsVisible && selectedClass ? (
        // Render class details view
        renderClassDetails()
      ) : (
        // Render chart view
        chartData ? (
          <Bar data={chartData} options={chartOptions} />
        ) : (
          <div className="no-data-message" style={{ textAlign: "center", marginTop: "100px" }}>
            No class data available
          </div>
        )
      )}
    </div>
  );
};

export default LargestClassesChart; 