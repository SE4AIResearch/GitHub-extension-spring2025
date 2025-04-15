import React, { useState, useEffect, useRef } from "react";
import Header from "./components/Header.js";
import ChartTabs from "./components/ChartTabs.js";
import Footer from "./components/Footer.js";
//import MetricsTable from "./components/MetricsTable.js";
//import TrendsHistory from "./components/TrendsHistory.js";

const backendUrl = 'http://localhost:8080/api'; // Your backend API base URL

function Dashboard() {
    const [repoUrl, setRepoUrl] = useState('');
    const [status, setStatus] = useState('PENDING'); // PENDING, RUNNING, COMPLETED, FAILED
    const [isLoading, setIsLoading] = useState(true); // Controls progress bar visibility
    const [errorMessage, setErrorMessage] = useState('');

    // Reference to store the polling interval ID so we can track and clear it
    const pollingIntervalRef = useRef(null);

    // Using useEffect to run once when the component mounts
    useEffect(() => {
        const appNamespace = 'github-extension-';
        const localStorageKey = `${appNamespace}repoAnalysisUrl`;
        const regularKey = 'repoAnalysisUrl';
        
        let urlFromStorage = '';
        
        // Fetching URL from localStorage with both keys
        try {
            // First trying the namespaced key
            urlFromStorage = localStorage.getItem(localStorageKey);
            
            // If not found, trying the regular key (for backward compatibility)
            if (!urlFromStorage) {
                urlFromStorage = localStorage.getItem(regularKey);
                if (urlFromStorage) {
                    console.log('Retrieved repoAnalysisUrl from regular key');
                    localStorage.removeItem(regularKey);
                }
            } else {
                console.log('Retrieved repoAnalysisUrl from namespaced key');
                localStorage.removeItem(localStorageKey);
            }
            
            if (urlFromStorage) {
                console.log('Retrieved repoAnalysisUrl from localStorage:', urlFromStorage);
                setRepoUrl(urlFromStorage);
                // Starting the analysis process
                startAnalysisRequest(urlFromStorage);
            } else {
                // Trying to get from chrome storage as backup
                console.log("Trying to get URL from chrome.storage.local");
                
                if (chrome && chrome.storage && chrome.storage.local) {
                    chrome.storage.local.get(['repoAnalysisUrl'], function(result) {
                        if (result && result.repoAnalysisUrl) {
                            console.log('Retrieved repoAnalysisUrl from chrome.storage:', result.repoAnalysisUrl);
                            setRepoUrl(result.repoAnalysisUrl);
                            chrome.storage.local.remove('repoAnalysisUrl');
                            startAnalysisRequest(result.repoAnalysisUrl);
                        } else {
                            // Still not found, showing error
                            console.error("Could not find repoAnalysisUrl in any storage.");
                            setErrorMessage('Repository URL not found. Please navigate from a GitHub repository page using the "Repository Analysis" link.');
                            setStatus('FAILED');
                            setIsLoading(false);
                        }
                    });
                } else {
                    // No chrome.storage available
                    console.error("Could not find repoAnalysisUrl in localStorage and chrome.storage is not available.");
                    setErrorMessage('Repository URL not found. Please navigate from a GitHub repository page using the "Repository Analysis" link.');
                    setStatus('FAILED');
                    setIsLoading(false);
                }
            }
        } catch (e) {
            console.error("Error accessing storage:", e);
            setErrorMessage('Error accessing browser storage. Please ensure cookies/localStorage are enabled and try again.');
            setStatus('FAILED');
            setIsLoading(false);
        }

        // Cleanup function to stop polling if the component unmounts
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []); // Empty dependency array means this runs only once on mount

    // --- API Call Functions ---

    // Checking if backend is available
    const checkBackendAvailability = async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            // Using the correct endpoint with trailing slash for the health check
            const response = await fetch(`${backendUrl}/`, {
                method: 'GET',
                signal: controller.signal,
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors'
            });
            
            clearTimeout(timeoutId);
            console.log("Backend health check successful");
            return true; // The server is responding
        } catch (networkError) {
            console.warn("Health check failed, trying alternative method:", networkError);
            
            // If the health check fails, trying the status endpoint
            try {
                // Trying to use the status endpoint with a dummy check parameter
                const statusResponse = await fetch(`${backendUrl}/status?check=true`, {
                    method: 'GET',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
                
                console.log("Status check returned:", statusResponse.status);
                // Even if we get a 400 Bad Request, the server is available
                return statusResponse.status !== 404 && statusResponse.status !== 503;
            } catch (error) {
                console.error("Backend availability check failed:", error);
                return false;
            }
        }
    };

    const startAnalysisRequest = async (urlToAnalyze) => {
        if (!urlToAnalyze || typeof urlToAnalyze !== 'string' || !urlToAnalyze.startsWith('https://github.com/')) {
            setErrorMessage(`Invalid repository URL: ${urlToAnalyze}. URL must be a valid GitHub repository URL.`);
            setStatus('FAILED');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setStatus('RUNNING');
        setErrorMessage(''); // Clearing previous errors
        console.log('Starting analysis for:', urlToAnalyze);

        // Checking backend availability first
        const isBackendAvailable = await checkBackendAvailability();
        if (!isBackendAvailable) {
            setErrorMessage(`Cannot connect to backend server at ${backendUrl}. Please ensure the server is running and accessible.`);
            setStatus('FAILED');
            setIsLoading(false);
            return;
        }

        try {
            // First trying with CORS mode
            const analyzeEndpoint = `${backendUrl}/analyze`;
            console.log(`Sending POST request to ${analyzeEndpoint}`);
            
            const response = await fetch(analyzeEndpoint, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ repoUrl: urlToAnalyze }),
                mode: 'cors'
            });

            console.log('Response received with status:', response.status);
            
            if (response.status === 202) { // Accepted
                console.log('Analysis request accepted.');
                // Starting polling after a delay
                setTimeout(() => {
                    pollingIntervalRef.current = setInterval(() => checkStatus(urlToAnalyze), 5000); // Checking every 5 seconds
                }, 1000); // Waiting 1 second before first poll
                return; // Success case
            }
            
            // Handle immediate errors from the backend
            const errorText = await response.text();
            throw new Error(`Backend error: ${response.status} ${response.statusText} - ${errorText}`);
        } catch (error) {
            console.error('Error starting analysis:', error);
            
            // If the request failed due to CORS, trying using the background page
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                try {
                    console.log('Attempting to use chrome.runtime.sendMessage as fallback');
                    
                    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
                        chrome.runtime.sendMessage(
                            { 
                                action: 'proxyFetch', 
                                url: `${backendUrl}/analyze`, 
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ repoUrl: urlToAnalyze })
                            },
                            (response) => {
                                if (chrome.runtime.lastError) {
                                    console.error('Chrome runtime error:', chrome.runtime.lastError);
                                    setErrorMessage(`Chrome extension error: ${chrome.runtime.lastError.message}`);
                                    setStatus('FAILED');
                                    setIsLoading(false);
                                    return;
                                }
                                
                                if (response && response.success) {
                                    console.log('Analysis request accepted via background page.');
                                    // Starting polling after a delay
                                    setTimeout(() => {
                                        pollingIntervalRef.current = setInterval(() => checkStatus(urlToAnalyze), 5000);
                                    }, 1000);
                                } else {
                                    setErrorMessage(`Failed to start analysis via background page: ${response ? response.error : 'Unknown error'}`);
                                    setStatus('FAILED');
                                    setIsLoading(false);
                                }
                            }
                        );
                        return; // Waiting for the callback
                    }
                } catch (proxyError) {
                    console.error('Error using chrome.runtime.sendMessage:', proxyError);
                }
            }
            
            setErrorMessage(`Failed to start analysis: ${error.message}. Is the backend running? (${backendUrl})`);
            setStatus('FAILED');
            setIsLoading(false);
        }
    };

    const checkStatus = async (urlToAnalyze) => {
        console.log("Polling status for:", urlToAnalyze);
        
        // Adding error handling for invalid URL parameter
        if (!urlToAnalyze) {
            console.error("Missing repository URL for status check");
            setErrorMessage("Cannot check status: Missing repository URL");
            setStatus('FAILED');
            setIsLoading(false);
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
            return;
        }
        
        try {
            // Trying direct fetch first
            const statusUrl = `${backendUrl}/status?repoUrl=${encodeURIComponent(urlToAnalyze)}`;
            console.log(`Fetching status from: ${statusUrl}`);
            
            const response = await fetch(statusUrl, {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors'
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Backend status error: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            handleStatusResponse(data);
        } catch (error) {
            console.error('Error checking status:', error);
            
            // If the direct fetch failed, trying using the background proxy
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                console.log('Trying to fetch status via background script');
                
                try {
                    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
                        chrome.runtime.sendMessage(
                            { 
                                action: 'proxyFetch', 
                                url: `${backendUrl}/status?repoUrl=${encodeURIComponent(urlToAnalyze)}`, 
                                method: 'GET'
                            },
                            (response) => {
                                if (chrome.runtime.lastError) {
                                    console.error('Chrome runtime error:', chrome.runtime.lastError);
                                    // Continue polling despite the error
                                    return;
                                }
                                
                                if (response && response.success && response.data) {
                                    console.log('Status received via background page:', response.data);
                                    handleStatusResponse(response.data);
                                } else {
                                    console.warn(`Polling Error via proxy: ${response ? response.error : 'Unknown error'}. Will retry.`);
                                }
                            }
                        );
                    }
                } catch (proxyError) {
                    console.error('Error using chrome.runtime.sendMessage for status:', proxyError);
                }
                return;
            }
            
            // For non-network errors, logging and continuing polling
            console.warn(`Polling Error: ${error.message}. Will retry.`);
        }
    };

    // Helper function to handle status response data
    const handleStatusResponse = (data) => {
        console.log("Status received:", data);
        
        // Validating data structure
        if (!data || typeof data.status === 'undefined') {
            console.error("Invalid status response format from backend");
            return;
        }
        
        setStatus(data.status); // Updating status based on backend response
        
        // Updating message if provided
        if (data.message) {
            console.log("Status message:", data.message);
        }

        if (data.status === 'COMPLETED') {
            clearInterval(pollingIntervalRef.current); // Stopping polling
            setIsLoading(false); // Turning off general loading indicator
            console.log("Analysis completed successfully (results handled elsewhere).");
            
            // Checking if this is a partial success (only latest or only previous)
            if (data.message && data.message.includes("only")) {
                // This is a partial success - displaying as note, not error
                setErrorMessage(`${data.message}`);
            } else {
                // Clearing any error messages
                setErrorMessage('');
            }
        } else if (data.status === 'FAILED') {
            clearInterval(pollingIntervalRef.current); // Stopping polling
            setErrorMessage(`Analysis failed: ${data.message || 'Unknown backend error'}`);
            setIsLoading(false);
        } else if (data.status === 'RUNNING' || data.status === 'PENDING') {
            setIsLoading(true); // Ensuring loading indicator stays on
            
            // Showing intermediate messages if available
            if (data.message) {
                setErrorMessage(`${data.message}`);
            } else {
                setErrorMessage(''); // Clearing any previous messages
            }
        } else {
            // Handling unknown status values
            console.warn(`Received unexpected status value: ${data.status}`);
            setIsLoading(true); // Keeping loading indicator on for unknown states
            
            if (data.message) {
                setErrorMessage(`Status (${data.status}): ${data.message}`);
            }
        }
    };

    // Render Logic 

    const renderProgressBar = () => {
        // Simple animated progress bar 
        return (
            <div style={{ margin: '20px auto', width: '80%', textAlign: 'center' }}>
                <p><strong>Status: {status}</strong></p>
                <div style={{ width: '100%', backgroundColor: '#eee', border: '1px solid #ccc', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{
                        width: '100%', // Simple full bar for indeterminate progress
                        height: '25px',
                        backgroundColor: '#4CAF50',
                        backgroundImage: 'linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent)',
                        backgroundSize: '40px 40px',
                        animation: 'progress-bar-stripes 1s linear infinite',
                        textAlign: 'center',
                        lineHeight: '25px',
                        color: 'white'
                     }}>
                        {status === 'RUNNING' ? 'Analyzing Repository... Please wait.' : 
                         status === 'PENDING' ? 'Waiting to start analysis...' : 
                         'Processing...'}
                    </div>
                </div>
                {/* CSS for animation */}
                <style>{`
                    @keyframes progress-bar-stripes {
                      from { background-position: 40px 0; }
                      to { background-position: 0 0; }
                    }
                `}</style>
                
                <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
                    Analysis typically takes 2-5 minutes depending on repository size.
                </p>
            </div>
        );
    };

    // Render an info or warning box
    const renderStatusMessage = (message) => {
        // Only rendering if there's a message and it's not a serious error
        if (!message || message.startsWith('Error:') || message.startsWith('Analysis failed:')) {
            return null;
        }
        
        const isWarning = message.includes('failed');
        
  return (
            <div style={{ 
                margin: '15px auto', 
                padding: '10px 15px', 
                backgroundColor: isWarning ? '#fff8e1' : '#e8f4fd', 
                border: `1px solid ${isWarning ? '#ffe082' : '#bbdefb'}`,
                borderRadius: '4px',
                color: isWarning ? '#ff8f00' : '#0277bd',
                maxWidth: '80%'
            }}>
                <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{isWarning ? 'Warning:' : 'Note:'}</p>
                <p style={{ margin: 0 }}>{message}</p>
    </div>
  );
};

    return (
        <div className="dashboard-container">
            {/* Header */} 
            <Header />
            
            {/* Display repo URL with better formatting */}
            <div style={{ margin: '15px', textAlign: 'center' }}>
                <h2 style={{ wordBreak: 'break-all', margin: '0 0 5px 0' }}>
                    {repoUrl ? 'Analyzing Repository:' : 'Repository Analysis Dashboard'}
                </h2>
                {repoUrl && (
                    <a 
                        href={repoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                            color: '#0366d6', 
                            textDecoration: 'underline',
                            fontSize: '16px',
                            wordBreak: 'break-all'
                        }}
                    >
                        {repoUrl}
                    </a>
                )}
            </div>

            {/* Status message (warning/info) */}
            {renderStatusMessage(errorMessage)}

            {/* Error message with better styling */}
            {errorMessage && (errorMessage.startsWith('Error:') || errorMessage.startsWith('Analysis failed:')) && (
                <div style={{ 
                    margin: '15px auto', 
                    padding: '10px 15px', 
                    backgroundColor: '#fff8f8', 
                    border: '1px solid #ffcdd2',
                    borderRadius: '4px',
                    color: '#d32f2f',
                    maxWidth: '80%'
                }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Error:</p>
                    <p style={{ margin: 0 }}>{errorMessage}</p>
                    
                    {/* Add troubleshooting tips */}
                    {errorMessage.includes('backend') && (
                        <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                            <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>Troubleshooting:</p>
                            <ul style={{ margin: '0', paddingLeft: '20px' }}>
                                <li>Ensure the backend server is running</li>
                                <li>Check that you have proper network connectivity</li>
                                <li>Try returning to GitHub and clicking the link again</li>
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Show progress bar while loading/running */} 
            {(isLoading || status === 'RUNNING' || status === 'PENDING') && renderProgressBar()}

            {/* Show completion message with better styling */} 
            {status === 'COMPLETED' && !isLoading && (
                <div style={{ 
                    margin: '15px auto', 
                    padding: '10px 15px', 
                    backgroundColor: '#f1f8e9', 
                    border: '1px solid #c5e1a5',
                    borderRadius: '4px',
                    color: '#33691e',
                    maxWidth: '80%',
                    textAlign: 'center'
                }}>
                    <p style={{ fontWeight: 'bold', fontSize: '16px', margin: '0 0 5px 0' }}>
                        Analysis Completed Successfully!
                    </p>
                    <p style={{ margin: 0 }}>
                        Review the charts below to see repository metrics.
                    </p>
                </div>
            )}

            {/* Show charts section with better visibility indicator */}
            <div style={{ 
                opacity: status === 'COMPLETED' ? 1 : 0.4, 
                transition: 'opacity 0.3s ease',
                pointerEvents: status === 'COMPLETED' ? 'auto' : 'none'
            }}>
                <ChartTabs />
            </div>

            <Footer />
        </div>
    );
}

export default Dashboard;
