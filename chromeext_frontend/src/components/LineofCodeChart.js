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
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import zoomPlugin from "chartjs-plugin-zoom";


ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

const LOCBarChart = () => {
  const [locData, setLocData] = useState([]);
  const [selectedLocClass, setSelectLocClass] = useState("All");
  const [range, setRange] = useState([0, 100]);
  

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
    const rangeMatch = item.totalLOC >= range[0] && item.totalLOC <= range[1];
    return classMatch && rangeMatch;
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
    responsive: true,
    maintainAspectRatio: false, 
    scales: {
      x: {
        type: "category",
        ticks: {
          callback: function (value, index) {
            const label = data.labels[index];
            return label.length > 25 ? label.slice(0, 22) + "..." : label;
          },
        },
        title: { display: true, text: "Classes" },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: "Lines per class" },
      },
    },
    
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => `LOC: ${context.raw}`,
        },
      },
      legend: { display: false },
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
      <div className="loc-top-section horizontal-layout">
        <div className="loc-vertical-slider-container">
          <div className="loc-slider-wrapper">
          <div className="loc-slider-text">
              LOC Range: {range[0]} – {range[1]}
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

      <div className="loc-chart">
        <Bar data={data} options={options} />
      </div>
    </div>
    
    </div>
  );
};

export default LOCBarChart;