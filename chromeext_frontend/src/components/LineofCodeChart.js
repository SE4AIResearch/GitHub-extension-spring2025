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
  const [selectedLocClass, setSelectLocClass] = useState("All");
  

  useEffect(() => {
    fetch("/Java_4185549.json")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        console.log("Fetched LOC data:", data);
        const LineofCodedata = data.class_metrics.map((item)=> ({
          className: item.name,
          totalLOC : item.line,
        }));
        setLocData(LineofCodedata);
      })
      .catch((err) => console.error("Failed to load LOC data:", err));
  }, []);


  const locfilteredData = locData.filter((item) => {
    const classMatch = selectedLocClass === "All" || item.className === selectedLocClass;
    return classMatch;
  });


  const data = {
    labels: locfilteredData.map((item) => item.className),
    datasets: [
      {
        label: "Total LOC",
        data: locfilteredData.map((item) => item.totalLOC),
        backgroundColor:  "rgba(209, 236, 244, 0.5)",
        borderColor: "rgb(16, 110, 80)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    // indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    /*scales: {
      x: {
        title: { display: true, text: "Lines of Code" },
      },
      y: {
        title: { display: true, text: "Class Name" },
      },
    },*/

    
    scales: {
      x: {
        type: "category",
        ticks: {
          callback: function (value, index) {
            const label = data.labels[index];
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
      <div className="loc-filter">
        <div>
          <label>Filter by Class</label>
          <select value ={selectedLocClass} onChange ={(e) => setSelectLocClass(e.target.value)}>
          <option value ="All">All</option>
          {locData.map((item,index) =>(
            <option key={index} value ={item.className}> {item.className}</option>
          ))}
          </select>
        </div>
      </div>
      
      <h2>Line of Code (Total LOC per Class)</h2>
      <div style={{ height: "500px" }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default LOCBarChart;