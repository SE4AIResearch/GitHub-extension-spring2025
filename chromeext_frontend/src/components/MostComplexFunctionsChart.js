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

const MostComplexFunctionsChart = ({ metricsData }) => {
  const [chartData, setChartData] = useState(null);
  const displayCount = 5; // Fixed display count

  useEffect(() => {
    // For debugging check if metricsData exists and its length
    console.log("MostComplexFunctionsChart: metricsData received:", { 
      exists: !!metricsData, 
      length: metricsData?.length || 0 
    });
    
    if (!metricsData || metricsData.length === 0) return;

    // Check if the cyclomatic_metrics array exists in the parent object
    // This is a hack to determine if metricsData is the direct array or the parent object
    const cyclomaticMetrics = Array.isArray(metricsData.cyclomatic_metrics) 
      ? metricsData.cyclomatic_metrics 
      : null;
    
    // Log if we found cyclomatic_metrics
    console.log("MostComplexFunctionsChart: cyclomatic_metrics found:", {
      exists: !!cyclomaticMetrics, 
      length: cyclomaticMetrics?.length || 0
    });
    
    // If we found cyclomatic_metrics, let's try to use that
    if (cyclomaticMetrics && cyclomaticMetrics.length > 0) {
      console.log("MostComplexFunctionsChart: Using cyclomatic_metrics for functions");
      
      // Extract function data from the cyclomatic_metrics array
      const functionData = cyclomaticMetrics
        .filter(item => {
          const kind = item.kind || '';
          const isFunction = kind === 'Pure Function' || 
                          kind.includes('Method') || 
                          kind === 'Constructor' || 
                          kind.endsWith('Constructor') || 
                          item.methodName;
          
          // For debugging, logging info about the first few items
          if (isFunction) {
            console.log("MostComplexFunctionsChart: Function found in cyclomatic_metrics:", { 
              name: item.name || item.methodName,
              kind: item.kind,
              methodName: item.methodName,
              linesOfCode: item.methodLOC || item.metrics?.CountLineCode || item.metrics?.Cyclomatic || 0
            });
          }
          
          return isFunction;
        })
        .map(item => ({
          name: formatName(item.methodName || item.name),
          lines: item.methodLOC || item.metrics?.CountLineCode || item.metrics?.Cyclomatic || 0,
          originalItem: item // Keep the original item for debugging
        }))
        .sort((a, b) => b.lines - a.lines)
        .slice(0, displayCount);
      
      // Log the filtered function data
      console.log("MostComplexFunctionsChart: Filtered cyclomatic function data:", functionData);
      console.log("MostComplexFunctionsChart: Cyclomatic function data length:", functionData.length);
      
      // Create chart data if we have functions to display
      if (functionData.length > 0) {
        const newChartData = {
          labels: functionData.map(item => item.name),
          datasets: [
            {
              label: "Complexity",
              data: functionData.map(item => item.lines),
              backgroundColor: "rgba(209, 236, 244, 0.5)",
              borderColor: "rgb(16, 110, 80)",
              borderWidth: 1,
            }
          ]
        };
        
        console.log("MostComplexFunctionsChart: Setting chart data from cyclomatic_metrics:", newChartData);
        setChartData(newChartData);
        return;
      }
    }
    
    // Log a sample of the data to see its structure
    console.log("MostComplexFunctionsChart: Sample data item:", metricsData[0]);
    
    // Get all unique 'kind' values to help with debugging
    const uniqueKinds = [...new Set(metricsData
      .map(item => item.kind)
      .filter(kind => !!kind))];
    console.log("MostComplexFunctionsChart: Unique 'kind' values in data:", uniqueKinds);

    // Fallback: Extract function data from the main metricsData array
    const functionData = metricsData
      .filter(item => {
        const kind = item.kind || '';
        const isFunction = kind === 'Pure Function' || 
                         kind.includes('Method') || 
                         kind === 'Constructor' || 
                         kind.endsWith('Constructor') || 
                         item.methodName;
        
        // For debugging, logging info about the first few items
        if (isFunction) {
          console.log("MostComplexFunctionsChart: Function found:", { 
            name: item.name || item.methodName,
            kind: item.kind,
            methodName: item.methodName,
            linesOfCode: item.methodLOC || item.metrics?.CountLineCode || 0
          });
        }
        
        return isFunction;
      })
      .map(item => ({
        name: formatName(item.methodName || item.name),
        lines: item.methodLOC || item.metrics?.CountLineCode || 0,
        originalItem: item // Keep the original item for debugging
      }))
      .sort((a, b) => b.lines - a.lines)
      .slice(0, displayCount);

    // Log the filtered function data
    console.log("MostComplexFunctionsChart: Filtered function data:", functionData);
    console.log("MostComplexFunctionsChart: Function data length:", functionData.length);

    // Create chart data only if we have functions to display
    if (functionData.length > 0) {
    // Prepare chart data
      const newChartData = {
        labels: functionData.map(item => item.name),
      datasets: [
        {
          label: "Complexity",
            data: functionData.map(item => item.lines),
            backgroundColor: "rgba(209, 236, 244, 0.5)",
            borderColor: "rgb(16, 110, 80)",
          borderWidth: 1,
        }
      ]
      };
      
      console.log("MostComplexFunctionsChart: Setting chart data:", newChartData);
      setChartData(newChartData);
    } else {
      console.log("MostComplexFunctionsChart: No function data found after filtering");
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

  const chartOptions = {
    indexAxis: 'y',  // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
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
            return `Complexity: ${value}`;
          }
        }
      },
      title: {
        display: true,
        text: 'Most Complex Functions',
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
          text: 'Complexity'
        },
        beginAtZero: true
      }
    }
  };

  // Log render state
  console.log("MostComplexFunctionsChart: Rendering with chartData:", !!chartData);

  return (
    <div className="overview-chart" style={{ height: "250px" }}>
      {chartData ? (
        <Bar data={chartData} options={chartOptions} />
      ) : (
        <div className="no-data-message" style={{ textAlign: "center", marginTop: "100px" }}>
          No function data available
        </div>
      )}
    </div>
  );
};

export default MostComplexFunctionsChart; 