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
  const [histData, setHistData] = useState(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);

  useEffect(() => {
    fetch("/hadoop_5427775_latest.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const classMetrics = data.class_metrics || [];
        // Build a frequency map: keys are CBO values
        const freqMap = {};
        classMetrics.forEach((cls) => {
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
        // Sort bins numerically
        const bins = Object.keys(freqMap).map(Number).sort((a, b) => a - b);
        const labels = bins.map((bin) => `${bin}`);
        const counts = bins.map((bin) => freqMap[bin].count);
        const detailsPerBin = bins.map((bin) => freqMap[bin].details);

        // Compute overall average CBO
        const totalClasses = classMetrics.length;
        const totalCbo = classMetrics.reduce(
          (sum, cls) => sum + (cls.metrics?.CountClassCoupled ?? 0),
          0
        );
        const avgCbo = totalClasses ? (totalCbo / totalClasses).toFixed(2) : 0;

        setHistData({ labels, counts, detailsPerBin, bins, avgCbo });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching histogram data:", err);
        setLoading(false);
      });
  }, []);

  // Conditional coloring: bins with CBO value >= threshold get red color.
  const threshold = 2;
  const backgroundColors = histData
    ? histData.bins.map((bin) =>
        bin >= threshold ? "rgba(255, 99, 132, 0.5)" : "rgba(75, 192, 192, 0.5)"
      )
    : [];

  const dataConfig = {
    labels: histData ? histData.labels : [],
    datasets: [
      {
        label: "Number of Classes",
        data: histData ? histData.counts : [],
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map((color) =>
          color.replace("0.5", "1")
        ),
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
        text: histData ? `Average CBO: ${histData.avgCbo}` : "",
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
      if (chartRef.current) {
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

  return (
    <div style={{ width: "80%", height: "500px", margin: "0 auto" }}>
      {loading ? (
        <p>Loading histogram data...</p>
      ) : histData && histData.labels.length > 0 ? (
        <Bar data={dataConfig} options={options} ref={chartRef} />
      ) : (
        <p>No histogram data available.</p>
      )}
    </div>
  );
};

export default CBOHistogram;
