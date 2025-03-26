import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const TrendsHistory = () => {
  const trendRef = useRef();

  useEffect(() => {
    const data = [
      { year: 2021, value: 30 },
      { year: 2022, value: 50 },
      { year: 2023, value: 70 },
    ];

    const svg = d3.select(trendRef.current)
      .attr("width", 400)
      .attr("height", 300);

    svg.selectAll("*").remove(); 

    const xScale = d3.scaleLinear()
      .domain([2021, 2023])
      .range([0, 400]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)])
      .nice()
      .range([300, 0]);

    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .attr("d", line);

    svg.append("g")
      .attr("transform", "translate(0, 300)")
      .call(d3.axisBottom(xScale).ticks(3).tickFormat(d3.format("d")));

    svg.append("g").call(d3.axisLeft(yScale));

  }, []);

  return (
    <div className="trends-history">
      <h2>Trends & History</h2>
      <svg ref={trendRef}></svg>
    </div>
  );
};

export default TrendsHistory;
