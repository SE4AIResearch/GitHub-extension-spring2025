import React, { useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  PointElement,
  CategoryScale
} from "chart.js";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import Select from "react-select";

ChartJS.register(BarElement, LinearScale, Tooltip, Legend, Title, CategoryScale);

const BIN_SIZE = 1;

export default function CBOHistogram({ metricData = [] }) {
  const [range, setRange] = useState([0, 100]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [cboData, setCboData] = useState([]);
  const [selectedBarIndex, setSelectedBarIndex] = useState(null);

  useEffect(() => {
    const classMetricsArray = Array.isArray(metricData.class_metrics)
      ? metricData.class_metrics
      : Array.isArray(metricData)
      ? metricData
      : [];

    const mapped = classMetricsArray.map(item => ({
      className: item.className || item.name,
      cbo: item.coupling || item.metrics?.CountClassCoupled || 0,
      cyclomatic: item.cyclomatic || item.metrics?.SumCyclomatic || 0,
      loc: item.line || item.totalLOC || item.metrics?.CountLineCode || 0,
    }));

    setCboData(mapped);
  }, [metricData]);

  const filtered = cboData.filter(item => {
    const inRange = item.cbo >= range[0] && item.cbo <= range[1];
    const classMatch = selectedClasses.length === 0 || selectedClasses.some(sel => sel.value === item.className);
    return inRange && classMatch;
  });

  const binCounts = useMemo(() => {
    const bins = {};
    filtered.forEach(item => {
      const bin = Math.floor(item.cbo / BIN_SIZE);
      if (!bins[bin]) bins[bin] = { count: 0, classes: [] };
      bins[bin].count++;
      bins[bin].classes.push(item.className);
    });
    return bins;
  }, [filtered]);

  const dataPoints = Object.keys(binCounts).map(bin => ({
    x: Number(bin) * BIN_SIZE + BIN_SIZE / 2,
    y: binCounts[bin].count,
    classes: binCounts[bin].classes
  }));

  const chartData = {
    datasets: [
      {
        label: "Number of Classes",
        data: dataPoints,
        backgroundColor: dataPoints.map((_, i) => i >= 3 ? "rgba(255, 99, 132, 0.7)" : "rgba(209, 236, 244, 0.5)"),
        borderColor: dataPoints.map((_, i) => i >= 3 ? "rgba(248, 3, 56, 0.7)" : "rgb(16, 110, 80)"),
        borderWidth: 1,
        categoryPercentage: 1.0,
        barPercentage: 1.0,
        parsing: false,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (e, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        setSelectedBarIndex(index);
      }
    },
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Coupling Between Objects (Histogram)",
        font: { size: 20 }
      },
      tooltip: {
        callbacks: {
          label: ctx => {
            const index = ctx.dataIndex;
            return [`Count: ${ctx.raw.y}`, ...dataPoints[index].classes];
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        title: { display: true, text: "CBO Value" },
        ticks: { stepSize: 1 }
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: "Number of Classes" }
      }
    }
  };

  return (
    <div className="cbo-bar-chart">
      <div className="cbo-filter">
        <div>
          <label>Filter by Class</label>
          <Select
            isMulti
            options={cboData.map(item => ({
              label: item.className,
              value: item.className,
            }))}
            value={selectedClasses}
            onChange={setSelectedClasses}
            placeholder="Select classes..."
          />
        </div>
      </div>

      <h2>Coupling Between the Objects Metric</h2>
      <p>Click on the bar to get more details</p>
      <div className="CBO-top-section horizontal-layout">
        <div className="cbo-vertical-slider-container">
          <div className="cbo-slider-wrapper">
            <div className="cbo-slider-text">
              CBO Range: {range[0]} – {range[1]}
            </div>
            <div>100</div>
            <Slider
              range
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

        <div className="cbo-chart">
          <Bar data={chartData} options={options} />
        </div>
      </div>

      {selectedBarIndex !== null && dataPoints[selectedBarIndex] && (
        <div className="cbo-details-card">
          <h3>
            Classes in CBO Range {dataPoints[selectedBarIndex].x - 0.5} - {dataPoints[selectedBarIndex].x + 0.5}
            <button
              className="cbo-details-close-btn"
              onClick={() => setSelectedBarIndex(null)}
            >
              ✖
            </button>
          </h3>
          <ul>
            {dataPoints[selectedBarIndex].classes.map((cls, idx) => {
              const classInfo = cboData.find(c => c.className === cls);
              return (
                <li key={idx}>
                  <span>Class:</span> {cls} |
                  <span> CBO:</span> {classInfo?.cbo ?? "N/A"} |
                  <span> Cyclomatic:</span> {classInfo?.cyclomatic ?? "N/A"} |
                  <span> LOC:</span> {classInfo?.loc ?? "N/A"}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
