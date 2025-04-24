/*  CBOHistogram.js  */
import React, { useEffect, useMemo, useRef, useState } from "react";
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

const BIN_SIZE = 1;                // 0-0.99, 1-1.99, …

export default function CBOHistogram({ metricData = [] }) {
  /* ---------- normalise the prop (sometimes object, sometimes array) */
  const rows = useMemo(() => {
    if (Array.isArray(metricData)) return metricData;
    if (metricData && Array.isArray(metricData.class_metrics))
      return metricData.class_metrics;
    return [];                            // nothing yet / wrong shape
  }, [metricData]);

  /* ---------- UI state --------------------------------------------- */
  const [range,    setRange]    = useState([0, 10]);   // slider
  const [selected, setSelected] = useState("All");     // dropdown
  const [hist,     setHist]     = useState(null);      // labels, counts …
  const chartRef               = useRef(null);

  /* ---------- rebuild histogram whenever filters OR data change ---- */
  useEffect(() => {
    if (!rows.length) { setHist(null); return; }

    /* --- 1. adapt the slider max once the data arrive -------------- */
    const maxCbo = Math.max(0, ...rows.map(r => r.metrics?.CountClassCoupled ?? 0));
    setRange(r => (r[1] < maxCbo ? [0, Math.max(maxCbo, 10)] : r));

    /* --- 2. filter -------------------------------------------------- */
    const filtered = rows.filter(r => {
      const cbo = r.metrics?.CountClassCoupled ?? 0;
      const ok1 = cbo >= range[0] && cbo <= range[1];
      const ok2 = selected === "All" || r.name === selected;
      return ok1 && ok2;
    });

    /* --- 3. fixed-width binning ------------------------------------ */
    const binCnt  = Math.floor(maxCbo / BIN_SIZE) + 1;
    const counts  = Array.from({ length: binCnt }, _ => 0);
    const details = Array.from({ length: binCnt }, _ => []);

    filtered.forEach(r => {
      const cbo = r.metrics?.CountClassCoupled ?? 0;
      const b   = Math.floor(cbo / BIN_SIZE);
      counts[b] += 1;
      details[b].push(r.name);
    });

    const labels = counts.map((_, i) => `${i * BIN_SIZE}`);

    setHist({ labels, counts, details, filtered: filtered.length });
  }, [rows, range, selected]);

  /* ---------- chart-js config -------------------------------------- */
  const colours = hist
    ? hist.labels.map((_, i) =>
        i >= 3 ? "rgba(255,99,132,0.6)" : "rgba(75,192,192,0.6)")
    : [];

  const data = hist
    ? {
        labels: hist.labels,
        datasets: [
          {
            label: "Number of classes",
            data: hist.counts,
            backgroundColor: colours,
            borderWidth: 0,
            categoryPercentage: 1,
            barPercentage: 1,
          },
        ],
      }
    : { labels: [], datasets: [] };

  const options = {
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: "CBO value (bin centre)" } },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        title: { display: true, text: "Number of classes" },
      },
    },
    plugins: {
      legend:   { display: false },
      title:    { display: true, text: "CBO Histogram", font: { size: 20 } },
      subtitle: {
        display: !!hist,
        text: hist ? `Total filtered classes: ${hist.filtered}` : "",
        font: { size: 14 },
      },
      tooltip: {
        callbacks: {
          label: ctx => {
            const idx = ctx.dataIndex;
            const list = hist.details[idx] || [];
            return [`Count: ${ctx.raw}`, ...list];
          },
        },
      },
    },
  };

  /* ---------- dropdown list --------------------------------------- */
  const classNames = useMemo(
    () => Array.from(new Set(rows.map(r => r.name))).sort(),
    [rows]
  );

  /* ---------- render ---------------------------------------------- */
  return (
    <div style={{ width: "80%", margin: "0 auto" }}>
      {!rows.length ? (
        <p>Loading data…</p>
      ) : (
        <>
          {/*  filters  */}
          <div style={{ display: "flex", gap: 40, marginBottom: 20 }}>
            {/*  range slider  */}
            <div style={{ width: 260 }}>
              <label style={{ fontFamily: "Poppins" }}>
                Latest CBO range: {range[0]} – {range[1]}
              </label>
              <Slider
                range
                min={0}
                max={range[1]}
                value={range}
                onChange={setRange}
                allowCross={false}
                trackStyle={[{ background: "#007b5e" }]}
                handleStyle={[
                  { borderColor: "#007b5e" },
                  { borderColor: "#007b5e" },
                ]}
              />
            </div>
            {/*  class dropdown  */}
            <div style={{ width: 260 }}>
              <label style={{ fontFamily: "Poppins" }}>Filter by class:</label>
              <select
                style={{ width: "100%", padding: 6, fontFamily: "Poppins" }}
                value={selected}
                onChange={e => setSelected(e.target.value)}
              >
                <option value="All">All</option>
                {classNames.map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/*  histogram  */}
          <div style={{ width: "100%", height: 500 }}>
            {hist && hist.filtered ? (
              <Bar ref={chartRef} data={data} options={options} />
            ) : (
              <p>No data matches your filter selection.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
