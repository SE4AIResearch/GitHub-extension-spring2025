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

// Add a message listener to handle proxy fetch requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'proxyFetch') {
        // Keep the message channel open for the asynchronous response
        const keepAlive = true;
        
        console.log('Background script received proxyFetch request:', message.url);
        
        // Set a timeout to ensure sendResponse is always called
        const timeoutId = setTimeout(() => {
            console.warn('ProxyFetch timeout reached, sending error response');
            sendResponse({
                success: false,
                error: 'Request timed out after 30s'
            });
        }, 30000); // 30-second timeout
        
        // Make the fetch request from the background script
        fetch(message.url, {
            method: message.method || 'GET',
            headers: message.headers || {},
            body: message.body || null
        })
        .then(async (response) => {
            clearTimeout(timeoutId); // Clear the timeout
            
            try {
                const isJson = response.headers.get('content-type')?.includes('application/json');
                const data = isJson ? await response.json() : await response.text();
                
                sendResponse({
                    success: response.ok,
                    status: response.status,
                    statusText: response.statusText,
                    data: data
                });
            } catch (error) {
                console.error('Error processing response:', error);
                sendResponse({
                    success: false,
                    error: `Error processing response: ${error.message}`
                });
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
