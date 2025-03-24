import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const Charts = () => {
  const chartRef = useRef();

  useEffect(() => {
    d3.select("#chart svg").remove();
    
    const data = [
      { category: "Class A", value: 10 },
      { category: "Class B", value: 15 },
      { category: "Class C", value: 8 },
    ];

    const svg = d3.select(chartRef.current)
      .attr("width", 400)
      .attr("height", 300);

    svg.selectAll("*").remove(); // Clear previous drawings

    const xScale = d3.scaleBand()
      .domain(data.map(d => d.category))
      .range([0, 400])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)])
      .nice()
      .range([300, 0]);

    const bars = svg.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.category))
      .attr("y", d => yScale(d.value))
      .attr("width", xScale.bandwidth())
      .attr("height", d => 300 - yScale(d.value))
      .attr("fill", "steelblue");

    svg.append("g")
      .attr("transform", "translate(0, 300)")
      .call(d3.axisBottom(xScale));

    svg.append("g").call(d3.axisLeft(yScale));

  }, []);

  return (
    <div className="chart-container">
      <h2>Code Complexity Analysis</h2>
      <svg ref={chartRef}></svg>
    </div>
  );
};

export default Charts;
