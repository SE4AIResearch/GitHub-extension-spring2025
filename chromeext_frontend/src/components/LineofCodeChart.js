import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

const LOCBarChart = () => {
  const [locData, setLocData] = useState([]);

  useEffect(() => {
    fetch("/lineofCode_metrics.json")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        console.log("Fetched LOC data:", data);
        setLocData(data);
      })
      .catch((err) => console.error("Failed to load LOC data:", err));
  }, []);

  const data = {
    labels: locData.map((item) => item.className),
    datasets: [
      {
        label: "Total LOC",
        data: locData.map((item) => item.totalLOC),
        backgroundColor: "rgba(30, 174, 81, 0.5)",
        borderColor: "rgb(90, 243, 182)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: "Lines of Code" },
      },
      y: {
        title: { display: true, text: "Class Name" },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `LOC: ${context.raw}`,
        },
      },
    },
  };

  return (
    <div className="loc-bar-chart">
      <h2>Line of Code (Total LOC per Class)</h2>
      <div style={{ height: "500px" }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default LOCBarChart;