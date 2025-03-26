import React from "react";
import "./dashboardStyles.css";
import Header from "./components/Header.js";
import MetricsTable from "./components/MetricsTable.js";
import Charts from "./components/Charts.js";
import RefactoringDetails from "./components/RefactoringDetails.js";
import TrendsHistory from "./components/TrendsHistory.js";

const Dashboard = () => {
  console.log("Inside Dashboard js");
  return (
    <div className="dashboard-container">
      <Header />
      <MetricsTable />
      <Charts />
      <RefactoringDetails />
      <TrendsHistory />
    </div>
  );
};

export default Dashboard;
