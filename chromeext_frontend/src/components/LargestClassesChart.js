import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title } from "chart.js";
import ClassKPICards from './ClassKPICards.js'; // Import the new component

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

const LargestClassesChart = ({ metricsData }) => {
  const [chartData, setChartData] = useState(null);
  const [selectedClassDetails, setSelectedClassDetails] = useState(null); // Renamed state
  const [allClassData, setAllClassData] = useState([]);
  const displayCount = 5; // Fixed display count

  useEffect(() => {
    // console.log("LargestClassesChart: metricsData received:", 
    //   {
    //   exists: !!metricsData,
    //   length: metricsData?.length || 0,
    //   hasClassMetrics: !!metricsData?.class_metrics
    // }); 
    
    if (!metricsData) return;

    const classMetricsArray = Array.isArray(metricsData.class_metrics)
      ? metricsData.class_metrics
      : metricsData;

    if (!classMetricsArray || classMetricsArray.length === 0) {
      //console.log("LargestClassesChart: No class metrics data available");
      setChartData(null);
      setSelectedClassDetails(null); // Reset selection
      setAllClassData([]);
      return;
    }

    //console.log("LargestClassesChart: Using class metrics array with length:", classMetricsArray.length);

    const classData = classMetricsArray
      .filter(item => {
        const kind = item.kind || '';
        return (kind.endsWith('Class') && !kind.includes('Unknown') && !kind.includes('Method') && !kind.includes('Constructor'))
          || item.className;
      })
      .map(item => ({
        name: formatName(item.className || item.name),
        originalName: item.className || item.name,
        lines: item.metrics?.CountLineCode || 0,
        allMetrics: item 
      }))
      .sort((a, b) => b.lines - a.lines)
      .slice(0, displayCount);

    setAllClassData(classData); // Store full data for detail view

    //console.log("LargestClassesChart: Filtered class data:", classData);

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

      //console.log("LargestClassesChart: Setting chart data");
      setChartData(newChartData);
    } else {
      //console.log("LargestClassesChart: No class data found after filtering");
      setChartData(null);
    }
    setSelectedClassDetails(null); // Reset selection on data update
  }, [metricsData]);

  const formatName = (name) => {
    if (!name) return "Unnamed";
    const shortName = name.split('.').pop();
    return shortName.length > 25 ? shortName.substring(0, 22) + "..." : shortName;
  };

  const handleBarClick = (event, elements) => {
    if (elements.length > 0) {
      const clickedIndex = elements[0].index;
      const clickedClassData = allClassData[clickedIndex]; 

      if (clickedClassData) {
        setSelectedClassDetails(prevDetails =>
          prevDetails && prevDetails.originalName === clickedClassData.originalName
            ? null
            : clickedClassData 
        );
      } else {
        setSelectedClassDetails(null); 
      }
    } else {
       setSelectedClassDetails(null);
    }
  };

  const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleBarClick, 
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            const index = tooltipItems[0]?.dataIndex;
            if (index !== undefined && allClassData[index]) {
              return allClassData[index].originalName;
            }
            return tooltipItems[0]?.label || '' ; 
          },
          label: (context) => {
            const value = context.raw;
            return `Lines of Code: ${value}`;
          }
        }
      },
      title: {
        display: false,
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

  return (
    <div className="overview-chart" style={{ minHeight: "250px" }}> 
      <h4 className="overview-chart-title">Largest Classes (by Lines of Code)</h4>
      <div style={{ height: "250px", position: "relative" }}> 
        {chartData ? (
          <Bar data={chartData} options={chartOptions} />
        ) : (
          <div className="no-data-message" style={{ textAlign: "center", paddingTop: "100px" }}>
            No class data available
          </div>
        )}
      </div>
 
      {selectedClassDetails && (
         <div className="class-kpi-card-wrapper"> 
           <h3 style={{textAlign: 'center', marginBottom: '10px', fontSize: 14, fontWeight: 'bold', color: '#666'}}>
              Details for: {selectedClassDetails.originalName}
           </h3>
           <ClassKPICards metrics={selectedClassDetails.allMetrics} />
         </div>
      )}
    </div>
  );
}; 

export default LargestClassesChart; 