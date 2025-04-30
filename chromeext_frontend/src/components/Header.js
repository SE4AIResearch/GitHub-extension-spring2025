import React, { useEffect, useState } from "react";
import downloadicon from "../icons/download.svg";
import refreshicon from "../icons/refresh.svg"
import logo from "../icons/logo.png";
import MaintainabilityScoreTable from './MaintainabilityScoreTable.js';
import { downloadAllCharts } from './AnalysisReportDownload.js';

const Header = ({ metricData = [] }) => {
  const [lastAnalyzed, setlastAnalyzed] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  
  useEffect(() =>{
    const storedLogin = localStorage.getItem("lastLogin");

    if (!storedLogin) {
      const now = new Date().toISOString();
      localStorage.setItem("lastLogin", now);
      setlastAnalyzed(now);
    } else {
      setlastAnalyzed(storedLogin);
    }
  }, []);

  const lastAnalyizedTime = lastAnalyzed
    ? new Date(lastAnalyzed).toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    : "Loading...";

  const handleForceReanalysis = () => {
    const appNamespace = 'github-extension-';
    localStorage.setItem(`${appNamespace}forceReanalysis`, 'true');
    console.log('Force reanalysis requested - flag set in localStorage');
    
    window.location.reload();
  };
  
  const handleDownloadCharts = async () => {
    if (isDownloading) return;
    
    try {
      setIsDownloading(true);
      await downloadAllCharts();
    } catch (error) {
      console.error('Error generating PDF report:', error);
      alert('There was a problem generating the PDF report. Check console for details.');
    } finally {
      setIsDownloading(false);
    }
  };
  
  const safeData = Array.isArray(metricData.class_metrics)
  ? metricData.class_metrics
  : Array.isArray(metricData) ? metricData : [];

const computeScore = (cls) => {
  const loc = cls.totalLOC || cls.line || cls.metrics?.CountLineCode || 0;
  const cbo = cls.coupling || cls.metrics?.CountClassCoupled || 0;
  const lcom = cls.lackOfCohesion || cls.metrics?.PercentLackOfCohesion || 0;
  const cyclo = cls.cyclomatic || cls.metrics?.SumCyclomatic || 0;
  const rawScore = 100 - (loc * 0.01 + cbo * 2 + lcom * 1.5 + cyclo * 1.5);
  return Math.max(0, Math.min(100, Math.round(rawScore)));
};

const avgMaintainabilityScore = safeData.length > 0
  ? Math.round(
      safeData.map(cls => computeScore(cls)).reduce((sum, score) => sum + score, 0) / safeData.length
    )
  : 0;

  const handleDownload = () => {
    if (!safeData.length) {
      alert("No metrics data available to download.");
      return;
    }
  
    const dataStr = JSON.stringify(safeData, null, 2); // nicely formatted
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement('a');
    link.href = url;
    link.download = 'repository-metrics.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  

  return (
    <header className="dashboard-header">
    <div className="logo-title-buttons">
      <div className="logo-title">
        <img src={logo} alt="cp_logo" className="cp-logo" />
        <h1>Commit Pro – Repository Analysis</h1>
      </div>
  
      <div className="header-buttons">
        <button 
          id="download-btn" 
          onClick={handleDownloadCharts} 
          disabled={isDownloading} 
          title="Download charts as PDF report"
          className={isDownloading ? 'loading-btn' : ''}
        >
          <img src={downloadicon} height={24} alt="download" />
          {isDownloading && <span className="loading-dot">...</span>}
        </button>
        <button id="refresh-btn" onClick={handleForceReanalysis}>
          <img src={refreshicon} height={24} alt="refresh" />
        </button>
      </div>
    </div>
  
    <div className="header-details">
      <span><em>Current Branch:</em> main</span>
      <span><em>Last Analyzed:</em> {lastAnalyizedTime}</span>
      <span className="score">Overall Repository Score: {avgMaintainabilityScore}%</span>
      </div>
  </header>  
  );
};

export default Header;
