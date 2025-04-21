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


ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title, zoomPlugin);

const LOCofMethosChart = ({ metricData = [] }) => {
  const [lcomData, setLcomData] = useState([]);
  const [selectedLcomClass, setSelectLcomClass] = useState("All");
  const [range, setRange] = useState([0, 100]);
  const location = useLocation();
  const highlightClasses = location.state?.highlightClasses || [];
  

  const shortenClassName = (fullName) => {
    const parts = fullName.split(".");
    if (parts.length >= 2) {
      return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    }
    return fullName;
  };  

  useEffect(() => {
    fetch("/Java_4185549.json")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json()
      })
      .then((data) => {
        const mapped = data.class_metrics
        .filter(item => item.metrics.PercentLackOfCohesion !== null)
        .map((item) => ({
          className: item.name,
          lcom: item.metrics.PercentLackOfCohesion ?? 0,
        }));
      setLcomData(mapped);
      })
      .catch((err) => console.error("Failed to load LCOM data", err));
  }, []);

  const filteredData = lcomData.filter((item) => {
    const classMatch = selectedLcomClass === "All" || item.className === selectedLcomClass;
    const rangeMatch = item.lcom >= range[0] && item.lcom <= range[1];
    return classMatch && rangeMatch;
  });

  const chartData = {
    labels: filteredData.map((item) => item.className),
    datasets: [
      {
        label: "Lack of Cohesion Method",
        data: filteredData.map((item) => item.lcom),
        backgroundColor: filteredData.map((item) =>
          highlightClasses.includes(item.className) ? "#cc0000" : "rgba(209, 236, 244, 0.5)"
        ),
        borderColor: filteredData.map((item) =>
          highlightClasses.includes(item.className) ? "#cc0000" : "rgb(16, 110, 80)"
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
          callback: function (value, index) {
            const label = chartData.labels[index];
            //return label.length > 25 ? label.slice(0, 22) + "..." : label;
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
          label: (ctx) => //`${ctx.dataset.label}: LCOM = ${ctx.raw}`,
          {
            const originalLabel = chartData.labels[context.dataIndex];
            const shortLabel = shortenClassName(originalLabel);
            const rawScore = ctx.raw;
            let interpretation = "";
            if (rawScore === 0) interpretation = "Perfect cohesion";
            else if (rawScore > 0 && rawScore <= 1) interpretation = "Good cohesion";
            else interpretation = "Low cohesion";
      
            return `${context.dataset.label}: ${context.raw} | Class: ${shortLabel}`;
          }
        },
      },
      legend: { display: false },
    },
  };

  return (
    <div className="lcom-dashboard">
      <div className="metrics-filter">
        <label>
          Filter by Class
          <select value={selectedLcomClass} onChange={(e) => setSelectLcomClass(e.target.value)}>
            <option value="All">All</option>
            {lcomData.map((item, idx) => (
              <option key={idx} value={item.className}>{item.className}</option>
            ))}
          </select>
        </label>
      </div>
      
      <h2>Lack of Cohesion per Method Metric</h2>

      <div className="lcom-top-section horizontal-layout">
        <div className="vertical-slider-container">
          <div className="slider-wrapper">
          <div className="slider-text">
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
                { borderColor: "#007b5e", backgroundColor: "#fff" }
              ]}
            />
             <div>0</div>

          </div>

        </div>

        <div className="bubble-chart">
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
        <h2>LCOM Metrics (Top 5)</h2>
        <table>
          <thead>
            <tr><th>Class Name</th><th>LCOM Score</th></tr>
          </thead>
          <tbody>
            {lcomData.slice(0, 5).map((item, index) => (
              <tr key={index}>
                <td>{item.className}</td>
                <td>{item.lcom}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LOCofMethosChart;
