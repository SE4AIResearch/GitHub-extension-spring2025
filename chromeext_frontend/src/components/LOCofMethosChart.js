import React, { useEffect, useState } from "react";
import { Bubble } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BubbleController,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title
} from "chart.js";

ChartJS.register(BubbleController, LinearScale, PointElement, Tooltip, Legend, Title);

const LOCofMethosChart = () => {
  const [lcomData, setLcomData] = useState([]);

  useEffect(() => {
    fetch("/lcom_metrics.json")
      .then((res) => res.json())
      .then((data) => setLcomData(data))
      .catch((err) => console.error("Error loading JSON:", err));
  }, []);

  const data = {
    datasets: [
      {
        label: "Lack of Cohesion per Class",
        data: lcomData.map((item, index) => ({
          x: index + 1,
          y: item.lcom,
          r: Math.max(10, item.lcom * 10),
          label: item.className,
        })),
        backgroundColor: "rgba(209, 236, 244, 0.5)",
        borderColor: "rgb(16, 110, 80)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: "Classes" },
        ticks: {
          callback: function (val, i) {
            return lcomData[i]?.className || "";
          },
        },
        grid: { display: false },
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
            const d = ctx.raw;
            return `${d.label}: LCOM = ${d.y}`;
          },
        },
      },
      legend: { display: false },
    },
  };

  return (
    <div className="lcom-dashboard">
      <div className="lcom-top-section">
        <div className="bubble-chart" style={{ height: "400px" }}>
          <Bubble data={data} options={options} />
        </div>
        <div className="lcom-legend">
          <h4>LCOM Interpretation</h4>
          <table className="legend-table">
            <thead>
              <tr><th>LCOM Value</th><th>Interpretation</th></tr>
            </thead>
            <tbody>
              <tr><td>0</td><td>Perfect cohesion</td></tr>
              <tr><td>0 &lt; LCOM ≤ 1</td><td>Good cohesion</td></tr>
              <tr><td>&gt; 1</td><td style={{ color: "#cc0000" }}>Low cohesion </td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="metrics-table">
        <h2>LCOM Metrics(Top 5)</h2>
        <table>
          <thead>
            <tr>
              <th>Class Name</th>
              <th>LCOM Score</th>
            </tr>
          </thead>
          <tbody>
            {lcomData.slice(0,5).map((item, index) => (
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
