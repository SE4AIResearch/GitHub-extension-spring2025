// ApiService.js - Handles communication with the backend

// API Service for UNDERSTAND Chrome Extension
const BASE_URL = 'http://localhost:8080/api';

// Helper function for backend fetch requests
const apiFetch = async (url, options = {}) => {
  console.log(`API Request to: ${url}`, options);
  try {
    // Check if we're in a Chrome extension context
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      console.log('Using Chrome extension messaging for fetch');
      // Using the proxyFetch via Chrome extension messaging
      return await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            action: 'proxyFetch',
            url: url,
            options: options  // Pass the entire options object
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("Chrome runtime error:", chrome.runtime.lastError);
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            
            if (!response) {
              console.error("No response from background script");
              reject(new Error("No response from background script"));
              return;
            }
            
            if (response.error) {
              console.error("Error in proxyFetch:", response.error);
              reject(new Error(response.error));
              return;
            }
            
            resolve(response);
          }
        );
      });
    } else {
      // Fallback to regular fetch for standalone web application
      console.log('Using direct fetch (not in Chrome extension context)');
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        status: response.status,
        statusText: response.statusText,
        data: data
      };
    }
  } catch (error) {
    console.error(`API Fetch Error for ${url}:`, error);
    throw error;
  }
};

// Base URL for backend API
const API_BASE_URL = 'http://localhost:8080/api';

// Understand API methods for direct API calls
export const UnderstandApi = {
  // Check backend status
  checkStatus: (repoUrl) => {
    console.log('Checking backend status for repo:', repoUrl);
    // If repoUrl is provided, check status for that repo, otherwise just check if backend is available
    if (repoUrl) {
      return apiFetch(`${API_BASE_URL}/status?repoUrl=${encodeURIComponent(repoUrl)}&check=true`);
    } else {
      return apiFetch(`${API_BASE_URL}/status?check=true`);
    }
  },
  
  // Start repository analysis
  startAnalysis: (repoUrl) => {
    console.log('Starting analysis for repo:', repoUrl);
    
    // Prepare the request with proper JSON body
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ repoUrl })
    };
    
    console.log('Analysis request options:', JSON.stringify(options));
    return apiFetch(`${API_BASE_URL}/analyze`, options);
  },
  
  // Get analysis status
  getAnalysisStatus: (repoUrl) => {
    console.log('Getting analysis status for repo:', repoUrl);
    return apiFetch(`${API_BASE_URL}/status?repoUrl=${encodeURIComponent(repoUrl)}`);
  },
  
  // Get results file
  getResultFile: (filename) => {
    console.log('Getting result file:', filename);
    return apiFetch(`${API_BASE_URL}/results/${filename}`);
  }
};

// Analysis Manager - Higher level service for managing the analysis process
export const AnalysisManager = {
  // Check if backend service is available
  checkBackendAvailability: async () => {
    try {
      const status = await UnderstandApi.checkStatus();
      console.log("Backend status check:", status);
      // Handle both response formats (extension vs direct)
      return status.success !== false;
    } catch (error) {
      console.error("Backend not available:", error);
      return false;
    }
  },
  
  // Check current analysis status
  checkAnalysisStatus: async (repoUrl) => {
    try {
      if (!repoUrl) {
        throw new Error("Repository URL is required to check status");
      }
      
      const response = await UnderstandApi.getAnalysisStatus(repoUrl);
      console.log("Status check response:", response);
      
      // Handle both response formats (extension vs direct)
      return response.data || response;
    } catch (error) {
      console.error("Error checking analysis status:", error);
      throw error;
    }
  },
  
  // Start a new analysis
  startNewAnalysis: async (repoUrl) => {
    try {
      if (!repoUrl) {
        throw new Error("Repository URL is required to start analysis");
      }
      
      console.log("Starting new analysis for:", repoUrl);
      const response = await UnderstandApi.startAnalysis(repoUrl);
      console.log("Analysis start response:", response);
      
      // Handle both response formats (extension vs direct)
      return response.data || response;
    } catch (error) {
      console.error("Error starting analysis:", error);
      throw error;
    }
  },
  
  // Find a metrics file in the output files array
  findMetricsFile: (files) => {
    const metricsFile = files.find(file => 
      file.includes('metrics') || file.includes('Java_') || file.endsWith('.json')
    );
    console.log("Found metrics file:", metricsFile);
    return metricsFile;
  },
  
  // Load metrics from a result file
  loadMetricsData: async (filename) => {
    try {
      console.log("Loading metrics from file:", filename);
      
      // Try to fetch the file
      const response = await UnderstandApi.getResultFile(filename);
      console.log("Metrics file response status:", response.status);
      
      // Handle both response formats (extension vs direct)
      let data = response.data || response;
      
      // Check if the response is empty or invalid
      if (!data || response.success === false || response.status === 404) {
        console.error("Error loading metrics: File not found or empty response");
        throw new Error("Metrics file not found or empty response");
      }
      
      // If the response is a string (JSON text), parse it
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError);
          throw new Error("Invalid JSON format in metrics file");
        }
      }
      
      // Return the full metrics data, including both class_metrics and cyclomatic_metrics
      if (data) {
        console.log("Received metrics data:", {
          hasClassMetrics: !!data.class_metrics,
          classMetricsCount: data.class_metrics?.length || 0,
          hasCyclomaticMetrics: !!data.cyclomatic_metrics,
          cyclomaticMetricsCount: data.cyclomatic_metrics?.length || 0
        });
        
        // Process class metrics for backward compatibility
        if (data.class_metrics) {
          console.log("Processing class_metrics data with", data.class_metrics.length, "items");
          data.class_metrics.forEach(item => {
            item.className = item.name;
            item.totalLOC = item.line;
            item.lackOfCohesion = item.metrics?.PercentLackOfCohesion || 0;
            item.coupling = item.metrics?.CountClassCoupled || 0;
            item.cyclomatic = item.metrics?.SumCyclomatic || 0;
          });
        }
        
        return data;
      } else {
        console.error("Invalid metrics data format");
        throw new Error("Invalid metrics data format");
      }
    } catch (error) {
      console.error("Error loading metrics data:", error);
      throw error;
    }
  }
};

export default { UnderstandApi, AnalysisManager }; 