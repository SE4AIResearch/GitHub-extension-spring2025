import React, { useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Legend, Title, Tooltip } from "chart.js";
import FunctionKPICards from './FunctionKPICards.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Legend, Title, Tooltip);

const MostComplexFunctionsChart = ({ metricsData }) => {

  const [chartData, setChartData] = useState(null);
  const [selectedFunctionKey, setSelectedFunctionKey] = useState(null);
  const chartRef = useRef();
  const displayCount = 5; // Fixed display count

  const formatName = (fullName) => {
    if (!fullName) return "Unnamed";

    const parts = fullName.split('.');
    if (parts.length >= 2) {
      const methodName = parts[parts.length - 1];
      const className = parts[parts.length - 2];
      return `${className}.${methodName}`;
    }

    return fullName;
  };

  const extractClassName = (fullName) => {
    if (!fullName) return "";
    
    const parts = fullName.split('.');
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
    
    return "";
  };

  const extractMethodName = (fullName) => {
    if (!fullName) return "Unnamed";
    const parts = fullName.split('.');
    return parts[parts.length - 1];
  };

  useEffect(() => {
    if (!metricsData) return;

    const cyclomaticMetrics = Array.isArray(metricsData.cyclomatic_metrics) 
      ? metricsData.cyclomatic_metrics 
      : [];
    
    if (cyclomaticMetrics.length === 0) {
      setChartData(null);
      setSelectedFunctionKey(null);
      return;
    }

    const processedFunctions = [];

    cyclomaticMetrics.forEach(item => {
      const kind = item.kind || '';
      const cyclomatic = item.metrics?.Cyclomatic || 0;
      
      if (cyclomatic > 0 && (
          kind === 'Function' ||
          kind === 'Pure Function' || 
          kind.includes('Method') || 
          kind === 'Constructor' || 
          kind.endsWith('Constructor')
        )) {
        const fullName = item.name || "";
        const key = fullName;
        const className = extractClassName(fullName);

        const existingIndex = processedFunctions.findIndex(f => f.key === key);
        if (existingIndex >= 0) {
          if (cyclomatic > processedFunctions[existingIndex].complexity) {
            processedFunctions[existingIndex] = {
              key,
              className,
              complexity: cyclomatic
            };
          }
        } else {
          processedFunctions.push({
            key,
            className,
            complexity: cyclomatic
          });
        }
      }
    });

    const sortedTopFunctions = processedFunctions
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, displayCount);

    if (sortedTopFunctions.length > 0) {
      const data = {
        datasets: [{
          label: "Cyclomatic Complexity",
          data: sortedTopFunctions.map(func => ({
            x: func.complexity,
            y: extractMethodName(func.key),
            key: func.key
          })),
          backgroundColor: "rgba(209, 236, 244, 0.5)",
          borderColor: "rgb(16, 110, 80)",
          borderWidth: 1
        }]
      };

      setChartData(data);
    } else {
      setChartData(null);
    }
    setSelectedFunctionKey(null); // Reset selection when data changes
  }, [metricsData]);

  const handleChartClick = (event, elements) => {
    //console.log("Chart click handler fired. Elements:", elements);

    if (elements && elements.length > 0) {
      const elementIndex = elements[0].index;
      const datasetIndex = elements[0].datasetIndex;
      //console.log(`Direct Element Info: Index=${elementIndex}, DatasetIndex=${datasetIndex}`);

      const clickedDataPoint = chartData?.datasets?.[datasetIndex]?.data?.[elementIndex];
      //console.log("Clicked data point:", clickedDataPoint);

      if (clickedDataPoint && clickedDataPoint.key) {
         //console.log("Setting selected function key:", clickedDataPoint.key);
         setSelectedFunctionKey(prevKey => {
            const newKey = prevKey === clickedDataPoint.key ? null : clickedDataPoint.key;
            //console.log("New selected key state:", newKey); 
            return newKey;
         });
      } else {
         setSelectedFunctionKey(null);
      }
    } else {
       setSelectedFunctionKey(null); // Reset if clicking outside bars
    }
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event, elements) => handleChartClick(event, elements),
    plugins: {
      legend: { display: false },
      title: {
        display: false,
      },
       tooltip: {
         callbacks: {
           label: function(context) {
             const fullFunctionName = context.raw?.key;
             const className = extractClassName(fullFunctionName);
             let label = `Classname: ${className || 'N/A'}`;
             return label;
           }
         }
       }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Cyclomatic Complexity'
        },
        beginAtZero: true
      },
      y: {
        title: {
          display: false
        }
      }
    }
  };

  const selectedFunctionDetails = selectedFunctionKey
    ? metricsData?.cyclomatic_metrics?.find(item => item.name === selectedFunctionKey)
    : null;

  return (
    <div className="overview-chart" style={{ minHeight: "250px" }}>
      <h4 className="overview-chart-title">Most Complex Functions (by Cyclomatic Complexity)</h4>
      <div style={{ height: "250px", position: "relative" }}>
        {chartData ? (
          <Bar
            ref={chartRef}
            data={chartData}
            options={options}
          />
        ) : (
          <div className="no-data-message" style={{ textAlign: "center", paddingTop: "100px" }}> 
            No function complexity data available
          </div>
        )}
      </div>

      {selectedFunctionDetails && (
        <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}> 
           <h3 style={{textAlign: 'center', marginBottom: '10px', fontSize: 14, fontWeight: 'bold', color: '#666'}}>
             Details for: {formatName(selectedFunctionDetails.name)}
           </h3>
           <FunctionKPICards metrics={selectedFunctionDetails.metrics} />
        </div>
      )}
    </div>
  );
};

export default MostComplexFunctionsChart;
