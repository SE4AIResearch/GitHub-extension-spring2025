import React from "react";
import Header from "./components/Header.js";
import ChartTabs from "./components/ChartTabs.js";
import Footer from "./components/Footer.js";
//import MetricsTable from "./components/MetricsTable.js";
//import TrendsHistory from "./components/TrendsHistory.js";

const Dashboard = () => {
  console.log("Inside Dashboard js");
  return (
    <div className="dashboard-container">
      <Header />
      <ChartTabs/>
      <Footer />
     {/* <MetricsTable />  
      <Charts />
      <RefactoringDetails />
       <TrendsHistory /> */}
    </div>
  );
};

export default Dashboard;
