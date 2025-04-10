import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title
} from "chart.js";

ChartJS.register(BarElement, LinearScale, PointElement, Tooltip, Legend, Title);

const LOCofMethosChart = () => {
  const [lcomData, setLcomData] = useState([]);
  const [selectedLcomClass, setSelectLcomClass] = useState("All");
  const [lcomRange, setLcomRange] = useState("All");


  useEffect(() => {
    fetch("/lcom_metrics.json")
      .then((res) => res.json())
      .then((data) => setLcomData(data))
      .catch((err) => console.error("Error loading JSON:", err));
  }, []);

  const filterByRange = (item) => {
    if (lcomRange === "All") return true;
    if (lcomRange === "zero") return item.lcom === 0;
    if (lcomRange === "low") return item.lcom > 0 && item.lcom <= 1;
    if (lcomRange === "high") return item.lcom > 1;
    return true;
  };

  const lcomfilteredData = lcomData.filter((item) => {
    const classMatch = selectedLcomClass === "All" || item.className === selectedLcomClass;
    const rangeMatch = filterByRange(item);
    return classMatch && rangeMatch;
  });


  const data = {
    labels: lcomfilteredData.map((item)=> item.className ),
    datasets: [
      {
        label: "Lack of Cohesion Method",
        data: lcomfilteredData.map((item)=> item.lcom),
        backgroundColor: "rgba(209, 236, 244, 0.5)",
        borderColor: "rgb(16, 110, 80)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: "Classes" },
        ticks: {
          callback: function (val, i) {
            return lcomfilteredData[i]?.className || "";
          },
        },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: "Lack Cohesion Score" },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const d = ctx.raw;
            return `${d.label}: LCOM = ${d.y}`;
          },
        },
      },
      legend: { display: false },
    },
  };

  return (
    <div className="lcom-dashboard">
      <div className="lcom-filter">
        <div>
          <label>Filter by Class</label>
          <select value ={selectedLcomClass} onChange ={(e) => setSelectLcomClass(e.target.value)}>
          <option Value ="All">All</option>
          {lcomData.map((item,index) =>(
            <option key={index} value ={item.className}> {item.className}</option>
          ))}
          </select>
        </div>

        <div>
          <label>Filter by Range</label>
          <select value ={lcomRange} onChange ={(e) => setLcomRange(e.target.value)}>
          <option Value ="All">All</option>
          <option Value ="All">LCOM = 0</option>
          <option Value ="All"> 0 &lt;LCOM &gt; 1</option>
          <option Value ="All">&gt; 1</option>
          </select>
        </div>

      </div>


      <div className="lcom-top-section">
        <div className="bubble-chart" style={{ height: "400px" }}>
          <Bar data={data} options={options} />
        
        <div className="lcom-legend">
          <h4>LCOM Interpretation</h4>
          <table className="LCOM-table">
            <thead>
              <tr><th>LCOM Value</th><th>Interpretation</th></tr>
            </thead>
            <tbody>
              <tr><td>0</td><td>Perfect cohesion</td></tr>
              <tr><td>0 &lt; LCOM ≤ 1</td><td>Good cohesion</td></tr>
              <tr><td>&gt; 1</td><td style={{ color: "#cc0000" }}>Low cohesion </td></tr>
            </tbody>
          </table>
        </div>
        </div>
      </div>

      <div className="metrics-table">
        <h2>LCOM Metrics(Top 5)</h2>
        <table>
          <thead>
            <tr>
              <th>Class Name</th>
              <th>LCOM Score</th>
            </tr>
          </thead>
          <tbody>
            {lcomData.slice(0,5).map((item, index) => (
              <tr key={index}>
                <td>{item.className}</td>
                <td>{item.lcom}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LOCofMethosChart;
