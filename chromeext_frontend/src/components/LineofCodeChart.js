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
import Select from "react-select";
import { Bar } from "react-chartjs-2";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { useLocation } from "react-router-dom";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

const LOCBarChart = ({ metricData = [] }) => {
  const [locData, setLocData] = useState([]);
  const [selectedLocClasses, setSelectedLocClasses] = useState([]);
  const [range, setRange] = useState([0, 100]);
  const [sortOrder, setSortOrder] = useState("default");

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
    if (metricData && metricData.length > 0) {
      const lineOfCodeData = metricData.map(item => ({
        className: item.className,
        totalLOC: item.totalLOC || 0
      }));
      setLocData(lineOfCodeData);
    }
  }, [metricData]);

  let locfilteredData = locData.filter((item) => {
        const classMatch = selectedLocClasses.length === 0 || selectedLocClasses.some(sel => sel.value === item.className);
        const rangeMatch = item.totalLOC >= range[0] && item.totalLOC <= range[1];
        return classMatch && rangeMatch;
      });

      if (sortOrder === "asc") {
        locfilteredData.sort((a, b) => a.totalLOC - b.totalLOC);
      } else if (sortOrder === "desc") {
        locfilteredData.sort((a, b) => b.totalLOC - a.totalLOC);
}

  const data = {
    labels: locfilteredData.map((item) => item.className),
    datasets: [
      {
        label: "Total LOC",
        data: locfilteredData.map((item) => item.totalLOC),
        backgroundColor: locfilteredData.map(item =>
          highlightClasses.includes(item.className)
            ? "rgba(255, 99, 132, 0.7)"
            : "rgba(209, 236, 244, 0.5)"
        ),
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
            const shortLabel = shortenClassName(label);
            return shortLabel.length > 25 ? shortLabel.slice(0, 22) + "..." : shortLabel;
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
          label: (ctx) => {
            const originalLabel = chartData.labels[ctx.dataIndex];
            const shortLabel = shortenClassName(originalLabel);
            const rawScore = ctx.raw;
            let interpretation = "";
            if (rawScore === 0) interpretation = "Perfect cohesion";
            else if (rawScore > 0 && rawScore <= 1) interpretation = "Good cohesion";
            else interpretation = "Low cohesion";
            return `${ctx.dataset.label}: ${ctx.raw} | Class: ${shortLabel} | ${interpretation}`;
          }
          
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
          <Select
              isMulti
              options={locData.map((item) => ({
                label: item.className,
                value: item.className,
              }))}
              value={selectedLocClasses}
              onChange={setSelectedLocClasses}
              placeholder="Select classes..."
            />
        </div>
        <div>
          <label>Sort by LOC</label>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="default">Default</option>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
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
