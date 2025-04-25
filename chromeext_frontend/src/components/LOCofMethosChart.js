import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import Slider from "rc-slider";
import zoomPlugin from "chartjs-plugin-zoom";
import { useLocation } from "react-router-dom";
import "rc-slider/assets/index.css";
import Select from "react-select";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title, zoomPlugin);

const LOCofMethosChart = ({ metricData = [] }) => {
  const [lcomData, setLcomData] = useState([]);
  const [selectedLcomClasses, setSelectedLcomClasses] = useState([]);
  const [range, setRange] = useState([0, 100]);
  const [sortOrder, setSortOrder] = useState("default");

  const location = useLocation();
  const highlightClasses = location.state?.highlightClasses || [];

  const shortenClassName = (fullName) => {
    if (typeof fullName !== "string") return "";
    const parts = fullName.split(".");
    if (parts.length >= 2) {
      return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    }
    return fullName;
  };

  useEffect(() => {
   if (!metricData) return;
   
   const classMetricsArray = Array.isArray(metricData.class_metrics) 
     ? metricData.class_metrics 
     : Array.isArray(metricData) ? metricData : [];
   
   if (classMetricsArray.length > 0) {
     const mapped = classMetricsArray.map(item => ({
       className: item.className || item.name,
       lcom: item.lackOfCohesion || item.metrics?.PercentLackOfCohesion || 0
     }));
     setLcomData(mapped);
   }
  }, [metricData]);
  

  const filteredData = lcomData.filter(item => {
    const classMatch =
    selectedLcomClasses.length === 0 || selectedLcomClasses.some(sel => sel.value === item.className);
    //selectedLcomClass === "All" || item.className === selectedLcomClass; this was for singlr selec
    const rangeMatch = item.lcom >= range[0] && item.lcom <= range[1];
    return classMatch && rangeMatch;
  });
  
  if (sortOrder === "asc") {
    filteredData.sort((a, b) => a.lcom - b.lcom);
  } else if (sortOrder === "desc") {
    filteredData.sort((a, b) => b.lcom - a.lcom);
  }

  const chartData = {
    labels: filteredData.map((item) => item.className),
    datasets: [
      {
        label: "Lack of Cohesion Method",
        data: filteredData.map((item) => item.lcom),
        backgroundColor: filteredData.map((item) =>
          highlightClasses.includes(item.className) ? "rgba(255, 99, 132, 0.7)"  : "rgba(209, 236, 244, 0.5)"
        ),
        borderColor: filteredData.map((item) =>
          highlightClasses.includes(item.className) ? "rgba(248, 3, 56, 0.7)" : "rgb(16, 110, 80)"
        ),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "category",
        ticks: {
          callback: (value, index) => {
            const label = chartData.labels[index];
            const shortLabel = shortenClassName(label);
            return shortLabel.length > 25 ? shortLabel.slice(0, 22) + "..." : shortLabel;
          },
        },
        title: { display: true, text: "Classes" },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: "Lack Cohesion Score" },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const originalLabel = chartData.labels[ctx.dataIndex];
            const shortLabel = shortenClassName(originalLabel);
            const rawScore = ctx.raw;
            let interpretation = "";
            if (rawScore === 0) interpretation = "Perfect cohesion";
            else if (rawScore > 0 && rawScore <= 1) interpretation = "Good cohesion";
            else interpretation = "Low cohesion";
            return `${ctx.dataset.label}: ${ctx.raw} | Class: ${shortLabel} | ${interpretation}`;
          },
        },
      },
      legend: { display: false },
    },
  };

  return (
    <div className="lcom-bar-chart">
      <div className="loc-filter">
        <div>
          <label>Filter by Class</label>
          <Select
            isMulti
            options={lcomData.map((item) => ({
              label: item.className,
              value: item.className,
            }))}
            value={selectedLcomClasses}
            onChange={setSelectedLcomClasses}
            placeholder="Select classes..."
          />
        </div>

        <div>
          <label>Sort by LCOM</label>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="default">Default</option>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>


  <h2>Lack of Cohesion per Method Metric</h2>
    <div className="lcom-top-section horizontal-layout">
      <div className="lcom-vertical-slider-container">
        <div className="lcom-slider-wrapper">
          <div className="lcom-slider-text">
            LCOM Range: {range[0]} – {range[1]}
          </div>
          <div>100</div>
          <Slider
            range
            vertical
            min={0}
            max={100}
            value={range}
            onChange={setRange}
            allowCross={false}
            trackStyle={[{ backgroundColor: "#007b5e" }]}
            handleStyle={[
              { borderColor: "#007b5e", backgroundColor: "#fff" },
              { borderColor: "#007b5e", backgroundColor: "#fff" },
            ]}
          />
          <div>0</div>
        </div>
      </div>

      <div className="lcom-chart">
        <Bar data={chartData} options={options} />
      </div>
    </div>

      <div className="lcom-legend">
        <h4>LCOM Interpretation</h4>
        <table className="LCOM-table">
          <thead>
            <tr><th>LCOM Value</th><th>Interpretation</th></tr>
          </thead>
          <tbody>
            <tr><td>0</td><td>Perfect cohesion</td></tr>
            <tr><td>0 &lt; LCOM ≤ 1</td><td>Good cohesion</td></tr>
            <tr><td>&gt; 1</td><td style={{ color: "#cc0000" }}>Low cohesion</td></tr>
          </tbody>
        </table>
      </div>

      <div className="metrics-table">
        <h2>LCOM Metrics (Top 10 Highest)</h2>

        <div className="metrics-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Class Name</th>
                <th>LCOM Score</th>
              </tr>
            </thead>
            <tbody>
              {[...lcomData]
                .sort((a, b) => b.lcom - a.lcom)
                .slice(0, 10)
                .map((item, index) => {
                  let color = "rgba(23, 227, 53, 0.7)"; 
                  if (item.lcom > 1) color = "rgba(248, 3, 56, 0.7)"; 
                  else if (item.lcom > 0 && item.lcom <= 1) color = "rgba(216, 238, 20, 0.7)"; 
                  return (
                    <tr key={index}>
                      <td>{item.className}</td>
                      <td style={{ color: color, fontWeight: "bold" }}>{item.lcom}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
};

export default LOCofMethosChart;
