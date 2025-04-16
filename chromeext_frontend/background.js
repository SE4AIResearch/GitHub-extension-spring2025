chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
        console.log("This is a first install!");
        const registerAppUrl = 'http://localhost:8080/register-app';

    fetch(registerAppUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const uuid = data.uuid;
        console.log("Received UUID:", uuid);

        chrome.storage.local.set({ appId: uuid }, () => {
          console.log("UUID stored in permanent storage.");
        });
      })
      .catch((error) => {
        console.error("Error fetching /register-app:", error);
      });
    }else if(details.reason == "update"){
        var thisVersion = chrome.runtime.getManifest().version;
        console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
    }
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => 
{
    if (message.action === "buttonClicked") 
    {
        // Keep the message channel open for the asynchronous response
        const keepAlive = true;
        
        // Set a timeout to ensure sendResponse is always called
        const responseTimeoutId = setTimeout(() => {
            console.warn('Button click handler timeout reached, sending error response');
            sendResponse({ 
                success: false, 
                error: "Operation timed out after 30 seconds" 
            });
        }, 30000); // 30-second timeout
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => 
        {
            if (tabs.length === 0) 
            {
                clearTimeout(responseTimeoutId);
                sendResponse({ success: false, error: "No active tabs found" });
                return;
            }
            
            chrome.tabs.sendMessage(tabs[0].id, { action: 'fetchData' }, async (response) => 
            {
                // Check for runtime errors
                if(chrome.runtime.lastError){
                    clearTimeout(responseTimeoutId);
                    console.log(chrome.runtime.lastError.message);
                    sendResponse({ success: false, error: "Error: " + chrome.runtime.lastError.message });
                    return;
                }
                
                // Check for valid response
                if (response === null || response === undefined)
                {
                    clearTimeout(responseTimeoutId);
                    console.log("response is null or undefined");
                    sendResponse({ success: false, error: "Invalid data from content script" });
                    return;
                }
                
                const { urlToSend, commitID, ogMessage } = response;
                if (!urlToSend || !commitID) 
                {
                    clearTimeout(responseTimeoutId);
                    console.log("Failed to fetch either url or commitId");
                    sendResponse({ success: false, error: "Missing URL or commit ID" });
                    return;
                }

                try {
                    // Using a timeout for ensuring sendResponse is called within the allowed time
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error("Request timed out")), 25000);
                    });
                    
                    // Fetching data with timeout
                    const fetchPromise = fetch(`http://localhost:8080/greeting?${new URLSearchParams({
                        url: urlToSend,
                        id: commitID,
                        og: ogMessage,
                        uuid: response.uuid
                    })}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }
                        return response.json();
                    });
                    
                    // Race between fetch and timeout
                    const data = await Promise.race([fetchPromise, timeoutPromise]);
                    
                    console.log("Received data:", data);
                    
                    // Send the content to the tab
                    chrome.tabs.sendMessage(tabs[0].id, { 
                        action: 'updateContent', 
                        content: data.content 
                    });
                    
                    // Send success response back to popup
                    clearTimeout(responseTimeoutId);
                    sendResponse({ success: true, message: "Content updated successfully" });
                } 
                catch (error) {
                    console.error('Error fetching data:', error);
                    clearTimeout(responseTimeoutId);
                    sendResponse({ 
                        success: false, 
                        error: "Failed to fetch commit data: " + error.message 
                    });
                }
            });
        });
        // Keep the message channel open
        return keepAlive; 
    }
    // Don't keep the channel open for other messages
    return false; 
});

// Add a listener for the repoUrlSaved message
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'repoUrlSaved') {
        console.log("Background script received repository URL:", message.repoUrl);
        
        // Send an immediate acknowledgement response
        sendResponse({ success: true, message: "URL received" });
        
        // Then store it in chrome.storage (no need to wait for callback to sendResponse)
        chrome.storage.local.set({ 'repoAnalysisUrl': message.repoUrl }, () => {
            console.log("Repository URL saved in chrome.storage.local");
        });
        
        return true; // Keep the message channel open to be safe
    }
    
    if (message.action === 'syncRepoUrl') {
        console.log("Background script received syncRepoUrl request:", message.repoUrl);
        
        // Update chrome.storage with the new URL
        chrome.storage.local.set({ 'repoAnalysisUrl': message.repoUrl }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error syncing repository URL:", chrome.runtime.lastError);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                console.log("Repository URL synced to chrome.storage.local:", message.repoUrl);
                sendResponse({ success: true });
            }
        });
        
        return true; // Keep the message channel open
    }
    
    return false; // Don't keep the channel open for other messages
});

// Improved proxyFetch handler for API requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'proxyFetch') {
        // Keep the message channel open for the asynchronous response
        const keepAlive = true;
        
        console.log('Background script received proxyFetch request:', message.url);
        console.log('Request options:', message.options);
        
        // Set a timeout to ensure sendResponse is always called
        const timeoutId = setTimeout(() => {
            console.warn('ProxyFetch timeout reached, sending error response');
            sendResponse({
                success: false,
                error: 'Request timed out after 30s'
            });
        }, 30000); // 30-second timeout
        
        // Make the fetch request from the background script
        const fetchOptions = {
            method: message.options?.method || 'GET',
            headers: message.options?.headers || {}
        };
        
        // Only add body for non-GET requests
        if (message.options?.body && fetchOptions.method !== 'GET') {
            fetchOptions.body = message.options.body;
            console.log('Adding request body:', message.options.body);
        }
        
        fetch(message.url, fetchOptions)
        .then(async (response) => {
            clearTimeout(timeoutId); // Clear the timeout
            
            console.log(`Fetch response from ${message.url}:`, {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries([...response.headers.entries()])
            });
            
            // Clone the response to keep the original for debugging
            const responseClone = response.clone();
            
            try {
                const contentType = response.headers.get('content-type') || '';
                const isJson = contentType.includes('application/json');
                let data;
                
                if (isJson) {
                    try {
                        data = await response.json();
                        console.log('JSON data received:', typeof data, data ? Object.keys(data) : 'null');
                    } catch (jsonError) {
                        console.warn('Failed to parse JSON response, falling back to text:', jsonError);
                        // If JSON parsing fails, try as text
                        data = await responseClone.text();
                    }
                } else {
                    data = await response.text();
                    console.log('Raw text response length:', data ? data.length : 0);
                    
                    // Debug the first 100 chars of the response
                    if (data && data.length > 0) {
                        console.log('Text response preview:', data.substring(0, 100) + (data.length > 100 ? '...' : ''));
                    }
                    
                    // Try to parse as JSON anyway if it looks like JSON
                    if (data && data.trim().startsWith('{') && data.trim().endsWith('}')) {
                        try {
                            data = JSON.parse(data);
                            console.log('Parsed text response as JSON');
                        } catch (e) {
                            // Keep as text if parsing fails
                            console.log('Text response could not be parsed as JSON');
                        }
                    }
                }
                
                console.log(`Processed ${isJson ? 'JSON' : 'text'} data from ${message.url}`);
                
                sendResponse({
                    success: response.ok,
                    status: response.status,
                    statusText: response.statusText,
                    data: data
                });
            } catch (error) {
                console.error('Error processing response:', error);
                
                // Fall back to raw text for debugging
                try {
                    const rawText = await responseClone.text();
                    console.log('Raw response text for debugging:', 
                        rawText ? rawText.substring(0, 200) + (rawText.length > 200 ? '...' : '') : 'empty');
                    
                    sendResponse({
                        success: false,
                        status: response.status,
                        statusText: response.statusText,
                        error: `Error processing response: ${error.message}`,
                        rawTextPreview: rawText ? rawText.substring(0, 200) : ''
                    });
                } catch (fallbackError) {
                    sendResponse({
                        success: false,
                        error: `Error processing response: ${error.message}`
                    });
                }
            }
        })
        .catch(error => {
            clearTimeout(timeoutId); // Clear the timeout
            
            console.error('Error making proxy fetch:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        });
        
        return keepAlive; // Keep the message channel open
    }
    
    return false; // Don't keep the channel open for other messages
});
