import React, { memo, useEffect, useState } from 'react';

const ProgressBar = ({ status, progress: backendProgress }) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState('');
  
  // Handle status change to COMPLETED
  useEffect(() => {
    if (status === 'COMPLETED') {
      setDisplayProgress(100); // Set to 100% when completed
    } else if (status !== 'RUNNING') {
      setDisplayProgress(0);
    }
  }, [status]);
  
  // Update display progress when backend progress changes
  useEffect(() => {
    if (typeof backendProgress === 'number' && backendProgress > 0) {
      setDisplayProgress(backendProgress);
      
      // Set estimated time based on backend progress
      if (backendProgress < 30) {
        setEstimatedTime('Initializing analysis...');
      } else if (backendProgress < 60) {
        setEstimatedTime('Analyzing previous commit...');
      } else if (backendProgress < 85) {
        setEstimatedTime('Analyzing latest commit...');
      } else {
        setEstimatedTime('Finalizing analysis results...');
      }
    }
  }, [backendProgress]);
  
  let statusText = 'Processing...';
  if (status === 'RUNNING') {
    statusText = 'Analyzing Repository... Please wait.';
  } else if (status === 'PENDING') {
    statusText = 'Starting analysis...';
  }

  return (
    <div className="analysis-progress">
      <p><strong>Status: {status}</strong></p>
      
      {status === 'RUNNING' || status === 'PENDING' ? (
        <div className="progress-container">
          <div className="progress-track">
            <div 
              className="progress-fill" 
              style={{ width: `${displayProgress}%` }}
            >
              <span className="progress-text">{displayProgress}%</span>
            </div>
          </div>
          <div className="progress-info">
            <span className="progress-status">{statusText}</span>
          </div>
          <div className="estimated-time">
            {estimatedTime}
          </div>
        </div>
      ) : (
        <div className="progress-container">
          <div className="progress-status">
            {statusText}
          </div>
        </div>
      )}
      
      <style>{`
        .analysis-progress {
          margin: 20px auto;
          width: 60%;
          text-align: center;
        }
        .progress-container {
          margin-top: 15px;
          padding: 10px;
          border-radius: 5px;
          background-color: #f8f9fa;
          border: 1px solid #eaeaea;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }
        .progress-track {
          width: 100%;
          height: 25px;
          background-color: #e9ecef;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 8px;
          position: relative;
        }
        .progress-fill {
          height: 100%;
          background-color: #4CAF50;
          border-radius: 10px;
          transition: width 0.5s ease;
          text-align: center;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .progress-text {
          color: white;
          mix-blend-mode: difference; /* Makes text visible regardless of background */
          position: absolute;
          width: 100%;
          left: 0;
        }
        .progress-info {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #555;
          margin-bottom: 8px;
        }
        .progress-status {
          font-weight: bold;
        }
        .estimated-time {
          font-size: 14px;
          color: #666;
          text-align: center;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default memo(ProgressBar); 