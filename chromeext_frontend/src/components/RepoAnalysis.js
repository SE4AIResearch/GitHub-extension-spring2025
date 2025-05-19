import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UnderstandApi, AnalysisManager } from '../services/ApiService.js';
import ProgressBar from './ProgressBar.js';
import ResultFiles from './ResultFiles.js';

const RepoAnalysis = ({ repoUrl, onAnalysisComplete, onMetricsLoaded, forceReanalysis = false }) => {
  const [status, setStatus] = useState('PENDING');
  const [message, setMessage] = useState('');
  const [resultFiles, setResultFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const pollingIntervalRef = useRef(null);
  const analysisAttempted = useRef(false);

  // Helper function to update the stored repository URL in both localStorage and chrome.storage
  const updateStoredRepositoryUrl = useCallback((url) => {
    if (!url) return;
    
    try {
      console.log("[RepoAnalysis] Updating stored repository URL to:", url);
      // Update in localStorage
      const appNamespace = 'github-extension-';
      localStorage.setItem(`${appNamespace}repoAnalysisUrl`, url);
      
      // Update in chrome.storage if available
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.storage && chrome.storage.local) {
        // Force sync with the background script to ensure all storage is updated
        chrome.runtime.sendMessage({
          action: 'syncRepoUrl',
          repoUrl: url,
          commitID: commitID
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("[RepoAnalysis] Error syncing repository URL:", chrome.runtime.lastError);
          } else if (response && response.success) {
            console.log("[RepoAnalysis] Successfully synced repository URL with background script");
          }
        });
      }
    } catch (error) {
      console.error("[RepoAnalysis] Error updating stored repository URL:", error);
    }
  }, []);

  // Start the analysis process
  const startAnalysisProcess = useCallback(async () => {
    console.log("[RepoAnalysis] Starting analysis process for:", repoUrl);
    setLoading(true);
    setError(null);
    analysisAttempted.current = true;
    
    if (!repoUrl) {
      console.error("[RepoAnalysis] ERROR: No repository URL provided");
      setError("No repository URL provided. Please enter a GitHub repository URL.");
      setLoading(false);
      return;
    }
    
    // Sanitize repo URL to ensure consistent formatting
    let sanitizedRepoUrl = repoUrl;
    try {
      // Handle various GitHub URL formats
      if (sanitizedRepoUrl.includes('github.com')) {
        // Extract just the username/repo part if it's a full URL
        const match = sanitizedRepoUrl.match(/github\.com\/([^\/]+\/[^\/]+)/i);
        if (match && match[1]) {
          sanitizedRepoUrl = `https://github.com/${match[1]}`;
          console.log("[RepoAnalysis] Sanitized repo URL:", sanitizedRepoUrl);
        }
      }
    } catch (urlError) {
      console.error("[RepoAnalysis] Error sanitizing URL:", urlError);
      // Continue with original URL if there's an error
    }
    
    // Update the stored repository URL to ensure it's the current one
    updateStoredRepositoryUrl(sanitizedRepoUrl);
    
    try {
      // First check if backend is available
      console.log("[RepoAnalysis] Checking backend availability");
      const backendAvailable = await AnalysisManager.checkBackendAvailability();
      if (!backendAvailable) {
        console.error("[RepoAnalysis] ERROR: Backend service is not available");
        setError("Cannot connect to backend service. Please ensure the backend is running.");
        setLoading(false);
        return;
      }
      
      // If forceReanalysis is true, skip status check and start a new analysis immediately
      if (forceReanalysis) {
        console.log("[RepoAnalysis] Force reanalysis requested, skipping status check and starting new analysis for:", sanitizedRepoUrl);
        try {
          const response = await AnalysisManager.startNewAnalysis(sanitizedRepoUrl);
          console.log("[RepoAnalysis] Analysis start response:", response);
          setStatus('RUNNING');
          setMessage('Analysis started...');
          startPolling(sanitizedRepoUrl);
        } catch (startError) {
          console.error("[RepoAnalysis] ERROR starting analysis:", startError);
          setError(`Failed to start analysis: ${startError.message || 'Unknown error'}`);
          setLoading(false);
        }
      } else {
        // Check current status first
        console.log("[RepoAnalysis] Checking initial status for:", sanitizedRepoUrl);
        const statusResponse = await AnalysisManager.checkAnalysisStatus(sanitizedRepoUrl);
        console.log("[RepoAnalysis] Initial status check result:", statusResponse);
        
        if (statusResponse.status === 'COMPLETED') {
          // Analysis already completed, just load metrics
          console.log("[RepoAnalysis] Analysis already completed, loading results");
          setStatus('COMPLETED');
          setMessage(statusResponse.message || '');
          
          if (statusResponse.outputFiles) {
            setResultFiles(statusResponse.outputFiles);
            
            // Find metrics file and load metrics
            const metricsFile = AnalysisManager.findMetricsFile(statusResponse.outputFiles);
            if (metricsFile && onMetricsLoaded) {
              try {
                console.log("[RepoAnalysis] Loading metrics from file:", metricsFile);
                const metricsData = await AnalysisManager.loadMetricsData(metricsFile);
                onMetricsLoaded(metricsData);
              } catch (metricsError) {
                console.error("[RepoAnalysis] ERROR loading metrics:", metricsError);
              }
            } else {
              console.warn("[RepoAnalysis] No metrics file found in output files:", statusResponse.outputFiles);
            }
            
            // Notify parent component
            if (onAnalysisComplete) {
              console.log("[RepoAnalysis] Notifying parent component of completion");
              onAnalysisComplete(statusResponse);
            }
          }
        } else if (statusResponse.status === 'RUNNING') {
          // Analysis already running, start polling
          console.log("[RepoAnalysis] Analysis already running for URL:", sanitizedRepoUrl);
          setStatus('RUNNING');
          setMessage(statusResponse.message || 'Analysis in progress...');
          startPolling(sanitizedRepoUrl);
        } else {
          // Need to start analysis
          console.log("[RepoAnalysis] Starting new analysis for URL:", sanitizedRepoUrl);
          try {
            const response = await AnalysisManager.startNewAnalysis(sanitizedRepoUrl);
            console.log("[RepoAnalysis] Analysis start response:", response);
            setStatus('RUNNING');
            setMessage('Analysis started...');
            startPolling(sanitizedRepoUrl);
          } catch (startError) {
            console.error("[RepoAnalysis] ERROR starting analysis:", startError);
            setError(`Failed to start analysis: ${startError.message || 'Unknown error'}`);
            setLoading(false);
          }
        }
      }
    } catch (err) {
      console.error("[RepoAnalysis] ERROR in analysis process:", err);
      setError(`Error: ${err.message || 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  }, [repoUrl, onAnalysisComplete, onMetricsLoaded, forceReanalysis]);

  // Set up polling to check the analysis status
  const startPolling = useCallback((repoUrl) => {
    console.log("[RepoAnalysis] Starting status polling for:", repoUrl);
    
    // Safely clear any existing interval first
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Set up new polling interval (every 3 seconds)
    pollingIntervalRef.current = setInterval(async () => {
      console.log("[RepoAnalysis] Checking status in polling interval for:", repoUrl);
      try {
        const statusResponse = await AnalysisManager.checkAnalysisStatus(repoUrl);
        console.log("[RepoAnalysis] Polling status check result:", statusResponse);
        
        // Update component state with the latest status
        setStatus(statusResponse.status);
        setMessage(statusResponse.message || '');
        
        // Update progress from backend if available
        if (typeof statusResponse.progress === 'number') {
          setProgress(statusResponse.progress);
        }
        
        if (statusResponse.outputFiles) {
          setResultFiles(statusResponse.outputFiles);
        }
        
        // Handle completion
        if (statusResponse.status === 'COMPLETED') {
          console.log("[RepoAnalysis] Analysis completed, stopping polling");
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          
          // Find metrics file and load metrics
          const metricsFile = AnalysisManager.findMetricsFile(statusResponse.outputFiles);
          if (metricsFile && onMetricsLoaded) {
            try {
              console.log("[RepoAnalysis] Loading metrics from file:", metricsFile);
              const metricsData = await AnalysisManager.loadMetricsData(metricsFile);
              onMetricsLoaded(metricsData);
            } catch (metricsError) {
              console.error("[RepoAnalysis] ERROR loading metrics:", metricsError);
            }
          } else {
            console.warn("[RepoAnalysis] No metrics file found in output files:", statusResponse.outputFiles);
          }
          
          // Notify parent component
          if (onAnalysisComplete) {
            console.log("[RepoAnalysis] Notifying parent component of completion");
            onAnalysisComplete(statusResponse);
          }
        }
        
        // Handle failure
        if (statusResponse.status === 'FAILED') {
          console.log("[RepoAnalysis] Analysis failed, stopping polling");
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          setError(statusResponse.message || "Analysis failed. Please try again.");
          
          // Notify parent component of failure
          if (onAnalysisComplete) {
            console.log("[RepoAnalysis] Notifying parent component of failure");
            onAnalysisComplete(statusResponse);
          }
        }
      } catch (error) {
        console.error("[RepoAnalysis] Error polling analysis status:", error);
        setError("Error checking analysis status: " + (error.message || "Unknown error"));
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }, 3000); // Check every 3 seconds
  }, [onAnalysisComplete, onMetricsLoaded]);

  // Start analysis when component mounts
  useEffect(() => {
    console.log("[RepoAnalysis] Component mounted with URL:", repoUrl);
    
    // Check if repoUrl is provided
    if (!repoUrl) {
      console.warn("[RepoAnalysis] No repository URL provided on mount");
      setError('No repository URL provided. Please enter a valid GitHub repository URL.');
      return;
    }

    // Validate URL format
    try {
      // Simple validation to check if it's at least in the format of a GitHub URL
      if (!repoUrl.includes('github.com/')) {
        console.warn("[RepoAnalysis] Invalid GitHub URL format:", repoUrl);
        setError('Please enter a valid GitHub repository URL.');
        return;
      }
    } catch (e) {
      console.error("[RepoAnalysis] URL validation error:", e);
    }
    
    // Delay the analysis start slightly to ensure the component is fully mounted
    const timer = setTimeout(() => {
      console.log("[RepoAnalysis] Starting analysis after delay for:", repoUrl);
      startAnalysisProcess();
    }, 500);
    
    // Cleanup on unmount
    return () => {
      console.log('[RepoAnalysis] Component unmounting, cleaning up resources');
      clearTimeout(timer);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [repoUrl, startAnalysisProcess]);

  return (
    <div className="repo-analysis-container">
      <div className="repo-analysis-info">
        <div className="repo-url" style={{ display: 'none' }}>
          <strong>Repository:</strong> {repoUrl || 'No repository URL provided'}
        </div>
      </div>
      
      {/* Show progress bar for pending or running status */}
      {(status === 'PENDING' || status === 'RUNNING' || loading) && (
        <ProgressBar status={status} message={message} progress={progress} />
      )}
      
      {/* Show error message if there's an error */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {/* Show success message when completed but hide the "Analysis Completed Successfully!" text */}
      {status === 'COMPLETED' && (
        <div className="analysis-complete">
          {/* Hide success message */}
          
          {/* Hide result files */}
          {resultFiles && resultFiles.length > 0 ? (
            <div style={{ display: 'none' }}>
              <ResultFiles files={resultFiles} />
            </div>
          ) : (
            <div className="no-results-message" style={{ display: 'none' }}>
              No result files available. 
            </div>
          )}
        </div>
      )}
      
      {/* Show message when analysis hasn't been attempted yet and no error */}
      {!analysisAttempted.current && !error && !loading && status === 'PENDING' && (
        <div className="instructions-message">
          Please wait while we check the repository status...
        </div>
      )}
    </div>
  );
};

export default RepoAnalysis; 