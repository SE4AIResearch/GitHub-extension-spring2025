import React from "react";
import "./style.css";
import Header from "./components/Header";
import MetricsTable from "./components/MetricsTable";
import Charts from "./components/Charts";
import RefactoringDetails from "./components/RefactoringDetails";
import TrendsHistory from "./components/TrendsHistory";

const Dashboard = () => {
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
