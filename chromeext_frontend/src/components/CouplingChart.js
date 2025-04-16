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
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

ChartJS.register(Tooltip, Legend, PointElement, LinearScale, CategoryScale, Title);

const CouplingChart = () => {
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState([0, 10]); // Adjust max based on your data
  const [selectedClass, setSelectedClass] = useState("All");

  useEffect(() => {
    fetch("/Java_4185549.json")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok: " + res.status);
        return res.json();
      })
      .then((data) => {
        const classMetrics = data.class_metrics || [];
        setAllData(classMetrics);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load CBO data:", error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const filtered = allData.filter((cls) => {
      const cbo = cls.metrics?.CountClassCoupled ?? 0;
      const inRange = cbo >= range[0] && cbo <= range[1];
      const matchesClass = selectedClass === "All" || cls.name === selectedClass;
      return inRange && matchesClass;
    });

    const parsed = filtered.map((cls, index) => ({
      x: cls.name || `Class ${index + 1}`,
      y: index + 1,
      r: cls.metrics?.CountClassCoupled || 0,
      label: cls.name || `Class ${index + 1}`,
    }));
    setFilteredData(parsed);
  }, [allData, range, selectedClass]);

  const dataConfig = {
    datasets: [
      {
        label: "Coupling Between Objects (CBO)",
        data: filteredData,
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

  const allClassNames = Array.from(
    new Set(allData.map((cls) => cls.name || "Unnamed Class"))
  );

  return (
    <div className="metrics-table" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* If data is loading */}
      {loading ? (
        <p>Loading CBO data...</p>
      ) : (
        <>
          {/* FILTERS ABOVE THE CHART */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              marginBottom: "20px",
              alignItems: "flex-start",
            }}
          >
            {/* Range Filter */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
                style={{ width: "300px" }}
                trackStyle={[{ backgroundColor: "#007b83" }]}
                handleStyle={[
                  { borderColor: "#007b83" },
                  { borderColor: "#007b83" },
                ]}
              />
            </div>

            {/* Class Filter */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontFamily: "Poppins" }}>Filter by Class:</label>
              <select
                style={{ width: "300px", padding: "6px", fontFamily: "Poppins" }}
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

          {/* CHART BELOW */}
          {filteredData.length === 0 ? (
            <p>No CBO data available based on the current filters.</p>
          ) : (
            <div style={{ width: "100%", height: "600px" }}>
              <Bubble data={dataConfig} options={options} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CouplingChart;
