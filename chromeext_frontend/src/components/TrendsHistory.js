import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";


const TrendHistory = () => {
  const svgRef = useRef();
  const [datasets, setDatasets] = useState([]);
  const width = 640;
  const height = 420;
  const margin = { top: 20, right: 40, bottom: 60, left: 80 };

  useEffect(() => {
    Promise.all([
      fetch("/hadoop_5427775_previous.json").then((res) => {
        if (!res.ok) throw new Error("Failed to fetch previous snapshot JSON");
        return res.json();
      }),
      fetch("/hadoop_5427775_latest.json").then((res) => {
        if (!res.ok) throw new Error("Failed to fetch latest snapshot JSON");
        return res.json();
      }),
    ])
      .then(([prevJson, latestJson]) => {
        const prevLOC = prevJson.project_metrics?.CountLineCode ?? 0;
        const latestLOC = latestJson.project_metrics?.CountLineCode ?? 0;
        const prevYear = prevJson.year
          ? prevJson.year
          : (prevJson.timestamp ? new Date(prevJson.timestamp).getFullYear() : 2022);
        const latestYear = latestJson.year
          ? latestJson.year
          : (latestJson.timestamp ? new Date(latestJson.timestamp).getFullYear() : 2023);

        const previousData = [
          { year: prevYear, loc: prevLOC },
          { year: prevYear + 1, loc: prevLOC },
        ];
        const latestData = [
          { year: latestYear, loc: latestLOC },
          { year: latestYear + 1, loc: latestLOC },
        ];

        const finalDatasets = [
          { name: "Previous Snapshot", color: "red", values: previousData },
          { name: "Latest Snapshot", color: "blue", values: latestData },
        ];
        setDatasets(finalDatasets);
      })
      .catch((err) => console.error("Error fetching trend data:", err));
  }, []);

  useEffect(() => {
    if (datasets.length === 0) return;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const allPoints = datasets.flatMap(ds => ds.values);

    const xDomain = d3.extent(allPoints, d => d.year);
    const xScale = d3.scaleLinear()
      .domain(xDomain)
      .range([0, innerWidth]);

    const maxLOC = d3.max(allPoints, d => d.loc);
    const yScale = d3.scaleLinear()
      .domain([0, maxLOC])
      .nice()
      .range([innerHeight, 0]);

    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.format("d"))
      .ticks(2); 
    const xAxisG = g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis);
    xAxisG.selectAll("text")
      .style("font-size", "14px")
      .style("font-family", "Poppins, sans-serif");
    xAxisG.append("text")
      .attr("fill", "#000")
      .attr("x", innerWidth / 2)
      .attr("y", 45)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Year");

    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d3.format(".2s"));
    const yAxisG = g.append("g")
      .call(yAxis);
    yAxisG.selectAll("text")
      .style("font-size", "14px")
      .style("font-family", "Poppins, sans-serif");
    yAxisG.append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -60)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Total LOC");

    datasets.forEach((ds) => {
      const lineGenerator = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.loc))
        .curve(d3.curveLinear);

      g.append("path")
        .datum(ds.values)
        .attr("fill", "none")
        .attr("stroke", ds.color)
        .attr("stroke-width", 3)
        .attr("d", lineGenerator);

      g.selectAll(`circle-${ds.name}`)
        .data(ds.values)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(d.loc))
        .attr("r", 6)
        .attr("fill", ds.color)
        .append("title")
        .text(d => `${ds.name}\nYear: ${d.year}\nLOC: ${d3.format(",")(d.loc)}`);
    });

    const legend = g.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${innerWidth - 100}, 0)`);

    legend.selectAll(".legend-item")
      .data(datasets)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 30})`)
      .each(function(d) {
        d3.select(this).append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", 24)
          .attr("height", 24)
          .attr("fill", d.color);

        d3.select(this).append("text")
          .attr("x", 30)
          .attr("y", 17)
          .style("font-size", "15px")
          .style("font-family", "Poppins, sans-serif")
          .text(d.name);
      });

  }, [datasets]);

  return (
    <div className="trends-history" style={{ maxWidth: "820px", margin: "0 auto", padding: "10px" }}>
      <h2 style={{ fontFamily: "Poppins, sans-serif", marginBottom: "10px" }}>
        Trend History: Total LOC Over Time
      </h2>
      <svg ref={svgRef}></svg>
      <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "14px", marginTop: "10px" }}>
        This chart shows the trend of Total Lines of Code (LOC) over time for two snapshots of the project.
        The red line represents the previous snapshot, while the blue line represents the latest snapshot. 
        The data points indicate the total LOC for each year.
      </p>
    </div>
  );
};

export default TrendHistory;
