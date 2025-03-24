import React from "react";

const Header = () => {
  return (
    <header className="dashboard-header">
      <h1>Commit Pro - Repository Analysis</h1>
      <div className="header-details">
        <span>Current Branch: main</span>
        <span>Last Analyzed: 02/17/25 10:10:10 EST</span>
        <span className="score">Overall Repository Score: Maintainable (85)</span>
      </div>
    </header>
  );
};

export default Header;
