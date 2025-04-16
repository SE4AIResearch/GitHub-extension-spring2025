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

const CouplingChart = ({ metricData = [] }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Process metricData from props instead of fetching
    if (metricData && metricData.length > 0) {
      const parsed = metricData.map((cls, index) => ({
        x: cls.className || `Class ${index + 1}`,
        y: index + 1,
        r: cls.coupling || 0,
        label: cls.className || `Class ${index + 1}`,
      }));
      console.log("Parsed bubble data:", parsed);
      setChartData(parsed);
    }
    setLoading(false);
  }, [metricData]);

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
