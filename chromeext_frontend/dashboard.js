document.addEventListener("DOMContentLoaded", function () {
        const metrics = [
            { metric: "Total Classes", value: 12 },
            { metric: "Total Methods", value: 85 },
            { metric: "Cyclomatic Complexity", value: 120 },
            { metric: "Average LOC per Method", value: 15 }
        ];
    
        const metricTable = document.getElementById("metricSummary");
        metrics.forEach(item => {
            let row = document.createElement("tr");
            row.innerHTML = `<td>${item.metric}</td><td>${item.value}</td>`;
            metricTable.appendChild(row);
        });
    
    var ctx1 = document.getElementById("couplingChart").getContext("2d");
    new Chart(ctx1, {
        type: "bar",
        data: {
            labels: ["Class A", "Class B", "Class C"],
            datasets: [{
                label: "Coupling Between Objects",
                data: [7, 5, 9], // remove
                backgroundColor: ["orange", "blue", "purple"]
            }]
        },
        options: { responsive: true }
    });

    var ctx2 = document.getElementById("cohesionChart").getContext("2d");
    new Chart(ctx2, {
        type: "bar",
        data: {
            labels: ["Class A", "Class B", "Class C"],
            datasets: [{
                label: "Lack of Cohesion of Methods",
                data: [6, 8, 7], // will remove this
                backgroundColor: ["orange", "blue", "purple"]
            }]
        },
        options: { responsive: true }
    });

    const data = {
        name: "A",
        children: [
            { name: "A.1" },
            {
                name: "A.2",
                children: [{ name: "A.2.1" }]
            }
        ]
    };

    const width = 300, height = 200;
    const svg = d3.select("#inheritanceTree")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(40,20)");

    const treeLayout = d3.tree().size([width - 100, height - 50]);
    const root = d3.hierarchy(data);
    treeLayout(root);

    svg.selectAll("line")
        .data(root.links())
        .enter()
        .append("line")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)
        .attr("stroke", "black");

    svg.selectAll("circle")
        .data(root.descendants())
        .enter()
        .append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 12)
        .attr("fill", d => d.children ? "green" : "orange");

    svg.selectAll("text")
        .data(root.descendants())
        .enter()
        .append("text")
        .attr("x", d => d.x)
        .attr("y", d => d.y - 15)
        .attr("text-anchor", "middle")
        .text(d => d.data.name);
});
