import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Title
} from "chart.js";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

const LOCofMethosChart = () => {
  const [lcomData, setLcomData] = useState([]);
  const [selectedLcomClass, setSelectLcomClass] = useState("All");
  const [range, setRange] = useState([0, 100]);

  useEffect(() => {
    fetch("/Java_4185549.json")
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.class_metrics.map((item) => ({
          className: item.name,
          lcom: item.metrics.PercentLackOfCohesion,
        }));
        setLcomData(mapped);
      })
      .catch((err) => console.error("Error loading JSON:", err));
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
        backgroundColor: "rgba(209, 236, 244, 0.5)",
        borderColor: "rgb(16, 110, 80)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    /*scales: {
      x: {
        type: "category",
        ticks: {
          maxRotation: 0,
          minRotation: 0,
          callback: function (label) {
            return label.length > 25 ? label.slice(0, 22) + "..." : label;
          },
        },
        title: { display: true, text: "Classes" },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: "Lack Cohesion Score" },
      },
    }, */

    
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
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: LCOM = ${ctx.raw}`,
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

      <div style={{ marginBottom: "30px", padding: "0 40px" }}>
        <label style={{ fontFamily: "Poppins, sans-serif" }}>
          Filter by LCOM Range: {range[0]} – {range[1]}
        </label>
        <Slider
          range
          min={0}
          max={100}
          defaultValue={[0, 100]}
          value={range}
          onChange={setRange}
          allowCross={false}
          trackStyle={[{ backgroundColor: "#007b5e" }]}
          handleStyle={[{ borderColor: "#007b5e" }, { borderColor: "#007b5e" }]}
        />
      </div>

      <div className="lcom-top-section">
        <div className="bubble-chart" style={{ overflowX: "auto", width: "100%" }}>
          <Bar data={chartData} options={options} />
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
