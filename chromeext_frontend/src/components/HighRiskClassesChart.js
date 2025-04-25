import React, { useEffect, useState, useMemo } from "react";
import { Bubble } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BubbleController,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(BubbleController, LinearScale, PointElement, Tooltip, Legend, Title);

const RISK_LEVELS = {
  ALL: "All Classes",
  HIGH: "High Risk",
  MODERATE: "Moderate Risk",
  LOW: "Low Risk"
};

const HighRiskClassesChart = ({ metricData = [] }) => {
  const [chartData, setChartData] = useState([]);
  const [classMetricsArray, setClassMetricsArray] = useState([]);
  const [selectedBubbleIndex, setSelectedBubbleIndex] = useState(null);
  const [riskFilter, setRiskFilter] = useState(RISK_LEVELS.ALL);
  const [processedData, setProcessedData] = useState([]);

  useEffect(() => {
    console.log("HighRiskClassesChart: metricData received:", { 
      exists: !!metricData, 
      length: metricData?.length || 0,
      hasClassMetrics: !!metricData?.class_metrics
    });
    
    if (!metricData) return;

    const classMetrics = Array.isArray(metricData.class_metrics) 
      ? metricData.class_metrics 
      : metricData;
    
    setClassMetricsArray(classMetrics);
    
    if (!classMetrics || classMetrics.length === 0) {
      console.log("HighRiskClassesChart: No class metrics data available");
      return;
    }

    console.log("array length:", classMetrics.length);

    const cleaned = classMetrics
      .filter(cls => cls?.metrics)
      .map(cls => ({
        className: cls.className || cls.name || "Unnamed",
        CBO: Number(cls.metrics?.CountClassCoupled) || 0,
        CC: Number(cls.metrics?.SumCyclomatic) || 0,
        LCOM: Number(cls.metrics?.PercentLackOfCohesion || cls.lackOfCohesion) || 0
      }))
      .filter(cls =>
        typeof cls.CBO === "number" &&
        typeof cls.CC === "number" &&
        typeof cls.LCOM === "number" &&
        (cls.CBO > 0 || cls.CC > 0 || cls.LCOM > 0)
      );
  
 //   console.log("HighRiskClassesChart: Cleaned data →", cleaned);
    setChartData(cleaned);
  }, [metricData]);
  
  useEffect(() => {
    if (!chartData.length) return;
    
    const maxCBO = Math.max(...chartData.map(cls => cls.CBO));
    const maxCC = Math.max(...chartData.map(cls => cls.CC));
    const maxLCOM = Math.max(...chartData.map(cls => cls.LCOM));
    
    const withRiskScores = chartData.map(cls => {
      const normalizedCBO = maxCBO ? (cls.CBO / maxCBO * 100) : 0;
      const normalizedCC = maxCC ? (cls.CC / maxCC * 100) : 0;
      const normalizedLCOM = maxLCOM ? (cls.LCOM / maxLCOM * 100) : 0;
      
      const riskScore = (normalizedCBO + normalizedCC + normalizedLCOM) / 3;
      
      let riskLevel;
      if (riskScore > 89) {
        riskLevel = RISK_LEVELS.HIGH;
      } else if (riskScore > 50) {
        riskLevel = RISK_LEVELS.MODERATE;
      } else {
        riskLevel = RISK_LEVELS.LOW;
      }
      
      return {
        ...cls,
        riskScore,
        riskLevel
      };
    });
    
    //console.log("HighRiskClassesChart: Data with risk scores →", withRiskScores);
    setProcessedData(withRiskScores);
  }, [chartData]);
  
  const filteredData = useMemo(() => {
    if (riskFilter === RISK_LEVELS.ALL) {
      return processedData;
    }
    return processedData.filter(cls => cls.riskLevel === riskFilter);
  }, [processedData, riskFilter]);
  
  const data = {
    datasets: [
      {
        label: "Classes",
        data: filteredData.map(cls => ({
          x: cls.CBO,
          y: cls.CC,
          r: Math.max(6, cls.LCOM * 0.3),
          className: cls.className,
          riskScore: Math.round(cls.riskScore),
          riskLevel: cls.riskLevel
        })),
        backgroundColor: filteredData.map(cls => {
          if (cls.riskLevel === RISK_LEVELS.HIGH) {
            return "rgba(255, 99, 132, 0.5)"; 
          } else if (cls.riskLevel === RISK_LEVELS.MODERATE) {
            return "rgba(255, 206, 86, 0.5)"; 
          } else {
            return "rgba(75, 192, 192, 0.5)"; 
          }
        }),
        borderColor: filteredData.map(cls => {
          if (cls.riskLevel === RISK_LEVELS.HIGH) {
            return "rgb(255, 99, 132)";
          } else if (cls.riskLevel === RISK_LEVELS.MODERATE) {
            return "rgb(255, 206, 86)";
          } else {
            return "rgb(75, 192, 192)";
          }
        }),
        borderWidth: 1.5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const item = ctx.raw;
            return [
              `Class: ${item.className}`,
              `CBO: ${item.x}, CC: ${item.y}, LCOM: ${Math.round(item.r / 0.3)}`,
              `Risk Score: ${item.riskScore}% (${item.riskLevel})`
            ];
          }
        }
      },
      legend: { display: false },
      title: {
        display: true,
        text: `Refactoring Risk: ${riskFilter} Classes`,
        font: { size: 14, weight: 'bold' }
      }
    },
    scales: {
      x: {
        title: { display: true, text: "CBO (CountClassCoupled)" },
        beginAtZero: true
      },
      y: {
        title: { display: true, text: "Cyclomatic Complexity (SumCyclomatic)" },
        beginAtZero: true
      }
    }
  };
  
  const handleRiskFilterChange = (event) => {
    setRiskFilter(event.target.value);
  };
  
  const riskCounts = useMemo(() => {
    if (!processedData.length) return {};
    
    const counts = {
      [RISK_LEVELS.ALL]: processedData.length,
      [RISK_LEVELS.HIGH]: 0,
      [RISK_LEVELS.MODERATE]: 0,
      [RISK_LEVELS.LOW]: 0
    };
    
    processedData.forEach(cls => {
      counts[cls.riskLevel]++;
    });
    
    return counts;
  }, [processedData]);

  return (
    <div className="high-risk-bubble-wrapper">
        <h1>High Risk CLasses Metric</h1>
        <p>Click on the bubble to get more details</p>
      <div className="risk-filter-controls" style={{ marginBottom: "10px", display: "flex", justifyContent: "center" }}>
        <select
          value={riskFilter}
          onChange={handleRiskFilterChange}
          style={{
            padding: "5px 10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            backgroundColor: "#fff",
            fontSize: "14px"
          }}
        >
          {Object.values(RISK_LEVELS).map(level => (
            <option key={level} value={level}>
              {level} ({riskCounts[level] || 0})
            </option>
          ))}
        </select>
      </div>
      
      <div style={{ height: "250px", position: "relative" }}>
        {filteredData.length === 0 ? (
          <div className="no-data-message" style={{ textAlign: "center", marginTop: "100px" }}>
            {processedData.length === 0 
              ? "No valid class metrics found." 
              : `No ${riskFilter} classes found.`}
          </div>
        ) : (
          <Bubble
            data={data}
            options={{
              ...options,
              onClick: (event, elements) => {
                if (elements.length > 0) {
                  const idx = elements[0].index;
                  setSelectedBubbleIndex(idx);
                }
              },
            }}
          />

        )}
      </div>
    </div>
  );
};

export default HighRiskClassesChart;

  /*const HighRiskClassesChart = ({ metricData = [] }) => {
    // Derive only the valid class metrics once
    const cleanedData = useMemo(() => {
      if (!Array.isArray(metricData)) return [];
  
      return metricData
        .filter(item => item.metrics) // must have metrics object
        .map(item => ({
          name: item.name, 
          cbo: Number(item.metrics.CountClassCoupled) || 0,
          cc: Number(item.metrics.SumCyclomatic) || 0,
          lcom: Number(item.metrics.PercentLackOfCohesion) || 0,
        }))
        // keep only those with at least one non-zero metric
        .filter(({ cbo, cc, lcom }) => cbo > 0 || cc > 0 || lcom > 0);
    }, [metricData]);
  
    // If nothing to show, render a friendly message
    if (cleanedData.length === 0) {
      return <p>No valid class metrics found.</p>;
    }
  
    // Build the bubble chart’s data object
    const data = {
      datasets: [
        {
          label: "Classes",
          data: cleanedData.map(({ name, cbo, cc, lcom }) => ({
            x: cbo,
            y: cc,
            // Scale LCOM into a minimum radius of 6px
            r: Math.max(6, (lcom / 100) * 30),
            name,
          })),
          backgroundColor: "rgba(100, 180, 255, 0.5)",
          borderColor: "rgb(0, 102, 204)",
          borderWidth: 1.5,
        },
      ],
    };
  
    // Chart configuration
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "Refactoring Risk: CBO vs Cyclomatic Complexity (Bubble size = LCOM)",
        },
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const { name, x, y, r } = ctx.raw;
              // reverse the r → lcom scale for display
              const displayLcom = Math.round((r / 30) * 100);
              return `Class: ${name} | CBO: ${x}, CC: ${y}, LCOM: ${displayLcom}%`;
            },
          },
        },
      }, */
      