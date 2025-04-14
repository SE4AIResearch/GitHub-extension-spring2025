import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard.js";

function App() {
  console.log("Inside App js");
  return (
   //<Dashboard />
    <Router>
     <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/:metricName" element={<Dashboard />} />
    </Routes>
    </Router> 
  );
}

export default App;
