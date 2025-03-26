import React from "react";
import downloadicon from "../icons/download.svg";
import refreshicon from "../icons/refresh.svg"
import editicon from "../icons/edit.svg";


const Header = () => {
  return (
    <header className="dashboard-header">
      <h1>Commit Pro - Repository Analysis</h1>
       <div className="header-buttons">

          <button id="download-btn" >
            <img src={downloadicon} height={24} alt="download" />
          </button>
          <button id="refresh-btn" >
            <img src={refreshicon} height={24} alt="refresh" />
          </button>
          <button id="edit-btn">
            <img src={editicon} height={24} alt="edit" />
          </button>
        </div>
      <div className="header-details">
        <span>Current Branch: main</span>
        <span>Last Analyzed: 02/17/25 10:10:10 EST</span>
        <span className="score">Overall Repository Score: Maintainable (85)</span>
      </div>
    </header>
  );
};

export default Header;
