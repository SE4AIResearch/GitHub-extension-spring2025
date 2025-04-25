import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import Select from "react-select";

/* ---------- colour bands for latest-CBO ---------- */
const COLOR_BANDS = [
  { max: 0,  colour: "#e6f4ea" },  // isolated
  { max: 4,  colour: "#b8e4c5" },  // low
  { max: 8,  colour: "#fff6ae" },  // medium
  { max: 12, colour: "#ffd68d" },  // high
  { max: 20, colour: "#ff9f7a" },  // very-high
  { max: Infinity, colour: "#e74c3c" }           // extreme
];
const bandColour = v => COLOR_BANDS.find(b => v <= b.max).colour;

/* ---------- snapshot paths (copied into /public/snapshots) ---------- */
const prevURL   = `${process.env.PUBLIC_URL}/E-commerce-project-springBoot_2616834_previous.json`;
const latestURL = `${process.env.PUBLIC_URL}/E-commerce-project-springBoot_2616871_latest.json`;

export default function TrendHistory() {
  const svgRef = useRef(null);

  const [matrix,   setMatrix]    = useState([]); // every class, prev, latest, diff
  const [filtered, setFiltered]  = useState([]);
  const [range,    setRange]     = useState([0, 40]);
  const [clsFilter,setClsFilter] = useState([]);

  /* ---------- 1. Load both snapshots ---------- */
  useEffect(() => {
    Promise.all([
      fetch(prevURL).then(r => r.json()),
      fetch(latestURL).then(r => r.json())
    ])
      .then(([prev, latest]) => {
        const prevMap   = Object.fromEntries(
          (prev.class_metrics   ?? []).map(c => [c.name,   c.metrics?.CountClassCoupled ?? 0])
        );
        const latestMap = Object.fromEntries(
          (latest.class_metrics ?? []).map(c => [c.name, c.metrics?.CountClassCoupled ?? 0])
        );

        const allNames = Array.from(new Set([...Object.keys(prevMap), ...Object.keys(latestMap)]));
        const rows = allNames.map(cls => ({
          cls,
          prev:   prevMap[cls]   ?? 0,
          latest: latestMap[cls] ?? 0,
          diff:   Math.abs((latestMap[cls] ?? 0) - (prevMap[cls] ?? 0))
        }));

        setMatrix(rows);
        setFiltered(rows);

        const maximum = Math.max(0, ...rows.map(r => r.latest));
        setRange([0, Math.max(40, maximum)]);    // make slider span real data
      })
      .catch(err => console.error("TrendHistory load error →", err));
  }, []);

  /* ---------- 2. Apply filters whenever UI state changes ---------- */
  useEffect(() => {
    const clsSet  = new Set(clsFilter.map(c => c.value));
    const keep    = r =>
      (clsFilter.length === 0 || clsSet.has(r.cls)) &&
      r.latest >= range[0] && r.latest <= range[1];

    setFiltered(matrix.filter(keep));
  }, [matrix, clsFilter, range]);

  /* ---------- 3. Draw heat-map whenever filtered data changes ---------- */
  useEffect(() => {
    if (!filtered.length) return;

    const cell   = 22;          // px
    const pad    = 120;         // axes label space
    const names  = filtered.map(r => r.cls);
    const size   = names.length * cell + pad;      // square

    const svg = d3.select(svgRef.current)
      .attr("width",  "100%")
      .attr("height", size)
      .attr("viewBox", `0 0 ${size} ${size}`)
      .style("overflow", "visible");

    svg.selectAll("*").remove();                   // full redraw

    const x = d3.scaleBand().domain(names).range([pad, size]);
    const y = d3.scaleBand().domain(names).range([pad, size]);

    /* shorten FQCN for display */
    const short = s => {
      const p = s.split(".");
      const t = p.slice(-2).join(".");
      return t.length > 25 ? t.slice(0, 22) + "…" : t;
    };

    // --- top axis (rotated) ---
    svg.append("g")
      .attr("transform", `translate(0,${pad - 6})`)
      .selectAll("text")
      .data(names)
      .enter()
      .append("text")
      .attr("x", d => x(d) + cell / 2)
      .attr("text-anchor", "end")
      .attr("transform", d => `rotate(-65 ${x(d)+cell/2} 0)`)
      .style("font-size", 9)
      .text(short);

    // --- left axis ---
    svg.append("g")
      .attr("transform", `translate(${pad - 4},0)`)
      .selectAll("text")
      .data(names)
      .enter()
      .append("text")
      .attr("y", d => y(d) + cell / 1.7)
      .attr("text-anchor", "end")
      .style("font-size", 9)
      .text(short);

    // --- coloured diagonal ---
    svg.append("g")
      .selectAll("rect")
      .data(filtered)
      .enter()
      .append("rect")
      .attr("x", d => x(d.cls))
      .attr("y", d => y(d.cls))
      .attr("width",  cell)
      .attr("height", cell)
      .attr("fill",   d => bandColour(d.latest))
      .append("title")
      .text(d => `${d.cls}
Previous CBO: ${d.prev}
Latest   CBO: ${d.latest}
Δ: ${d.diff}`);

    // --- light grid (helps navigation) ---
    svg.append("g")
      .selectAll("line.h")
      .data(names)
      .enter()
      .append("line")
      .attr("x1", pad)
      .attr("x2", size)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d))
      .attr("stroke", "#eee");

    svg.append("g")
      .selectAll("line.v")
      .data(names)
      .enter()
      .append("line")
      .attr("y1", pad)
      .attr("y2", size)
      .attr("x1", d => x(d))
      .attr("x2", d => x(d))
      .attr("stroke", "#eee");
  }, [filtered]);

  /* ---------- 4.  UI ---------- */
  const classOptions = matrix.map(r => ({ value: r.cls, label: r.cls }));

  return (
    <div className="trends-history" style={{ maxWidth: 1100, margin: "0 auto", padding: 10 }}>
      <h2 style={{ textAlign: "center", fontFamily: "Poppins, sans-serif" }}>
        Trend History: Coupling Between Objects&nbsp;(heat-map)
      </h2>

      <div style={{ display: "flex", gap: 40, flexWrap: "wrap", marginBottom: 20 }}>
        {/* class multi-select */}
        <div style={{ width: 280 }}>
          <label style={{ fontFamily: "Poppins" }}>Filter by class</label>
          <Select
            isMulti
            options={classOptions}
            value={clsFilter}
            onChange={setClsFilter}
            placeholder="Select classes…"
          />
        </div>

        {/* range slider */}
        <div style={{ width: 240 }}>
          <label style={{ fontFamily: "Poppins" }}>
            Latest CBO range: {range[0]} – {range[1]}
          </label>
          <Slider
            range
            min={0}
            max={range[1]}           /* dynamic upper bound */
            step={1}
            value={range}
            onChange={setRange}
            allowCross={false}
            trackStyle={[{ backgroundColor: "#007b83" }]}
            handleStyle={[{ borderColor: "#007b83" }, { borderColor: "#007b83" }]}
          />
        </div>
      </div>

      {/* heat-map svg */}
      <div style={{ width: "100%", overflow: "auto", border: "1px solid #ddd" }}>
        <svg ref={svgRef} />
      </div>

      {/* legend */}
      <div style={{ marginTop: 12, fontFamily: "Poppins, sans-serif", fontSize: 13 }}>
        <strong>Colour legend (latest CBO)</strong>{" "}
        {COLOR_BANDS.map((b, i) => (
          <span key={i} style={{ marginRight: 8 }}>
            <span style={{
              display: "inline-block", width: 14, height: 14,
              background: b.colour, border: "1px solid #888", marginRight: 4
            }} />
            {b.max === Infinity ? "≥ 21"
              : i === 0            ? "0"
              : `${COLOR_BANDS[i - 1].max + 1}–${b.max}`}
          </span>
        ))}
      </div>
    </div>
  );
}
