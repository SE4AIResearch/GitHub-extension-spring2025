// import React from "react";
// import { Bubble } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   Tooltip,
//   Legend,
//   PointElement,
//   LinearScale,
//   Title,
//   CategoryScale,
// } from "chart.js";

// ChartJS.register(
//   Tooltip,
//   Legend,
//   PointElement,
//   LinearScale,
//   CategoryScale,    
//   Title
// );

// const CouplingChart = () => {
//   const data = {
//     datasets: [
//       {
//         label: "Coupling Between Classes",
//         data: [
//           { x: "Class A", y: 1, r: 10, label: "Class A" },
//           { x: "Class B", y: 2, r: 5, label: "Class B" },
//           { x: "Class C", y: 3, r: 19, label: "Class C" },
//           { x: "Class D", y: 4, r: 8, label: "Class D" },
//           { x: "Class E", y: 5, r: 12, label: "Class E" },
//         ],
//         backgroundColor: "rgba(75, 192, 192, 0.5)",
//         borderColor: "#007b83",
//         borderWidth: 1,
//       },
//     ],
//   };

//   const options = {
//     plugins: {
//       tooltip: {
//         callbacks: {
//           label: (context) => {
//             const point = context.raw;
//             return `${point.label}: ${point.r} CBO`;
//           },
//         },
//       },
//       legend: { display: false },
//       title: {
//         display: true,
//         text: "Coupling Between Objects",
//         font: { size: 20 },
//       },
//     },
//     scales: {
//       x: {
//         type: "category", 
//         title: { display: true, text: "Classes" },
//       },
//       y: {
//         title: { display: true, text: "Y Axis (arbitrary)" },
//         ticks: { stepSize: 1 },
//       },
//     },
//     maintainAspectRatio: false,
//   };

//   return (
//     <div className="metrics-table bubble-chart">
//       <Bubble data={data} options={options} />
//     </div>
//   );
// };

// export default CouplingChart;


import React, { useState, useEffect } from "react";
import { Bubble } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
} from "chart.js";

ChartJS.register(Tooltip, Legend, PointElement, LinearScale, CategoryScale, Title);

const CouplingChart = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the JSON file from the public folder.
    fetch("/Java_4185549.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Network response was not ok: " + res.status);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Fetched JSON:", data);
        const classMetrics = data.class_metrics || [];
        if (classMetrics.length === 0) {
          console.warn("No class metrics found in the JSON.");
        }
        const parsed = classMetrics.map((cls, index) => ({
          x: cls.name || `Class ${index + 1}`,
          y: index + 1,
          r: cls.metrics?.CountClassCoupled || 0,
          label: cls.name || `Class ${index + 1}`,
        }));
        console.log("Parsed bubble data:", parsed);
        setChartData(parsed);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load CBO data:", error);
        setLoading(false);
      });
  }, []);

  const dataConfig = {
    datasets: [
      {
        label: "Coupling Between Objects (CBO)",
        data: chartData,
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        borderColor: "#007b83",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const point = context.raw;
            return `${point.label}: ${point.r} CBO`;
          },
        },
      },
      legend: { display: false },
      title: {
        display: true,
        text: "Coupling Between Objects (CBO)",
        font: { size: 20 },
      },
    },
    scales: {
      x: {
        type: "category",
        title: { display: true, text: "Classes" },
      },
      y: {
        title: { display: true, text: "Class Index" },
        ticks: { stepSize: 1 },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="metrics-table bubble-chart">
      {loading ? (
        <p>Loading CBO data...</p>
      ) : chartData.length === 0 ? (
        <p>No CBO data available.</p>
      ) : (
        <Bubble data={dataConfig} options={options} />
      )}
    </div>
  );
};

export default CouplingChart;
