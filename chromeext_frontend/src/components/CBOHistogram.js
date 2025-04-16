import React, { useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

const CBOHistogram = () => {
  const [allData, setAllData] = useState([]);
  const [histData, setHistData] = useState(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);

  const [range, setRange] = useState([0, 10]); // Adjust max value as per your dataset
  const [selectedClass, setSelectedClass] = useState("All");

  useEffect(() => {
    fetch("/hadoop_5427775_latest.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        const classMetrics = data.class_metrics || [];
        setAllData(classMetrics);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching JSON:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (allData.length === 0) return;
    
    // Filter data based on selected range and class.
    const filtered = allData.filter((cls) => {
      const cbo = cls.metrics?.CountClassCoupled ?? 0;
      const inRange = cbo >= range[0] && cbo <= range[1];
      const classMatch = selectedClass === "All" || cls.name === selectedClass;
      return inRange && classMatch;
    });

    const freqMap = {};
    filtered.forEach((cls) => {
      const cbo = cls.metrics?.CountClassCoupled ?? 0;
      if (!freqMap[cbo]) {
        freqMap[cbo] = { count: 0, details: [] };
      }
      freqMap[cbo].count += 1;
      freqMap[cbo].details.push({
        className: cls.name || "Unnamed Class",
        file: cls.file || "N/A",
      });
    });

    const bins = Object.keys(freqMap).map(Number).sort((a, b) => a - b);
    const labels = bins.map((bin) => `${bin}`);
    const counts = bins.map((bin) => freqMap[bin].count);
    const detailsPerBin = bins.map((bin) => freqMap[bin].details);

    setHistData({ bins, labels, counts, detailsPerBin, filteredCount: filtered.length });
  }, [allData, range, selectedClass]);

  const threshold = 2;
  const backgroundColors = histData
    ? histData.bins.map((bin) =>
        bin >= threshold ? "rgba(255, 99, 132, 0.5)" : "rgba(75, 192, 192, 0.5)"
      )
    : [];

  const dataConfig = {
    labels: histData?.labels || [],
    datasets: [
      {
        label: "Number of Classes",
        data: histData?.counts || [],
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map((color) => color.replace("0.5", "1")),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const idx = ctx.dataIndex;
            const count = ctx.dataset.data[idx];
            const details = histData.detailsPerBin[idx] || [];
            let tooltipLines = [`Count: ${count}`];
            details.forEach((item) => {
              tooltipLines.push(`- ${item.className}`);
            });
            return tooltipLines;
          },
        },
      },
      legend: { display: false },
      title: {
        display: true,
        text: "CBO Histogram",
        font: { size: 20 },
      },
      subtitle: {
        display: true,
        text: histData ? `Total Filtered Classes: ${histData.filteredCount}` : "",
        font: { size: 14 },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "CBO Value" },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: "Number of Classes" },
        ticks: { stepSize: 1 },
      },
    },
    maintainAspectRatio: false,
    onClick: (event) => {
      if (chartRef.current && histData) {
        const chart = chartRef.current;
        const elements = chart.getElementsAtEventForMode(
          event,
          "nearest",
          { intersect: true },
          false
        );
        if (elements.length) {
          const index = elements[0].index;
          const details = histData.detailsPerBin[index] || [];
          let message = `Classes with CBO = ${histData.labels[index]}:\n`;
          details.forEach((item) => {
            message += `\nClass: ${item.className}\nFile: ${item.file}\n`;
          });
          alert(message);
        }
      }
    },
  };

  // Generate unique class names for the dropdown.
  const allClassNames = Array.from(
    new Set(allData.map((cls) => cls.name || "Unnamed Class"))
  );

  return (
    <div style={{ width: "80%", margin: "0 auto" }}>
      {loading ? (
        <p>Loading data...</p>
      ) : (
        <>
          {/* FILTERS SECTION */}
          <div style={{ display: "flex", gap: "50px", marginBottom: "20px" }}>
            {/* Range Slider Filter */}
            <div style={{ width: "250px" }}>
              <label style={{ fontFamily: "Poppins" }}>
                Filter by CBO Range: {range[0]} – {range[1]}
              </label>
              <Slider
                range
                min={0}
                max={100} 
                step={1}
                value={range}
                onChange={setRange}
                allowCross={false}
                style={{ marginTop: "0.5rem" }}
                trackStyle={[{ backgroundColor: "#007b83" }]}
                handleStyle={[
                  { borderColor: "#007b83" },
                  { borderColor: "#007b83" },
                ]}
              />
            </div>
            {/* Class Dropdown Filter */}
            <div style={{ width: "250px" }}>
              <label style={{ fontFamily: "Poppins" }}>Filter by Class:</label>
              <select
                style={{ width: "100%", padding: "6px", fontFamily: "Poppins" }}
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="All">All</option>
                {allClassNames.map((clsName, idx) => (
                  <option key={idx} value={clsName}>
                    {clsName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* HISTOGRAM */}
          <div style={{ width: "100%", height: "500px" }}>
            {histData && histData.labels.length > 0 ? (
              <Bar data={dataConfig} options={options} ref={chartRef} />
            ) : (
              <p>No data matches your filter selection.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CBOHistogram;
