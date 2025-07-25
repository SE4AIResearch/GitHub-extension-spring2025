document.addEventListener("DOMContentLoaded", () => {
    const llmSelect = document.getElementById("llmSelect");
    const githubToken = document.getElementById("github");
    const llmKey = document.getElementById("open-ai-key");
    const saveButton = document.getElementById("settings-save");
    
    // Load the app ID from storage
    chrome.storage.local.get(['appId'], function(result) {
        const appId = result.appId;
        if (!appId) {
            console.error("No app ID found in storage");
            return;
        }
        
        // Fetch existing keys when page loads
        fetch(`http://localhost:8080/api/get-keys?uuid=${appId}`)
            .then(response => response.json())
            .then(data => {
                if (data.githubApiKey) {
                    githubToken.value = data.githubApiKey;
                }
                if (data.openaiLlmApiKey) {
                    llmKey.value = data.openaiLlmApiKey;
                }
            })
            .catch(error => {
                console.error("Error fetching keys:", error);
            });
    });
    
    // Save button event listener
    if (saveButton) {
        saveButton.addEventListener("click", async () => {
            const selectedLLM = llmSelect.value;
            const token = githubToken.value.trim();
            const apiKey = llmKey.value.trim();
            
            chrome.storage.local.get(['appId'], async function(result) {
                const appId = result.appId;
                if (!appId) {
                    alert("Error: No app ID found. Please reinstall the extension.");
                    return;
                }
                
                try {
                    let keysUpdated = false;

                    if (!token && !apiKey) {
                        throw new Error("Both fields are blank. Please try again.");
                    } 
                    
                    // Save GitHub token
                    if (token) {
                        const githubResponse = await fetch(`http://localhost:8080/api/add-github-key`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                            },
                            body: `uuid=${encodeURIComponent(appId)}&githubKey=${encodeURIComponent(token)}`
                        });
                        
                        if (!githubResponse.ok) {
                            throw new Error('Failed to save GitHub token');
                        }
                        console.log("GitHub token saved successfully");
                        keysUpdated = true;
                    }
                    
                    // Save OpenAI key
                    if (apiKey) {
                        const openaiResponse = await fetch(`http://localhost:8080/api/add-llm-key`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                            },
                            body: `uuid=${encodeURIComponent(appId)}&llmKey=${encodeURIComponent(apiKey)}`
                        });
                        
                        if (!openaiResponse.ok) {
                            throw new Error('Failed to save OpenAI key');
                        }
                        console.log("OpenAI key saved successfully");
                        keysUpdated = true;
                    }
                    
                    if (keysUpdated) {
                        // Save to Chrome storage for immediate access in popup and other extension pages
                        chrome.storage.local.set({
                            githubToken: token,
                            openaiKey: apiKey
                        }, function() {
                            console.log("Saved credentials to Chrome storage");
                        });
                        
                        // Notify other extension components that settings have been updated
                        chrome.runtime.sendMessage({ 
                            action: "settingsUpdated",
                            githubToken: "[HIDDEN]",
                            openaiKey: "[HIDDEN]"  
                        });

                        if (!apiKey || !token) {
                            throw new Error("A field is blank. Please try again.");
                        }        
                    }
                    
                    alert("Settings saved successfully!");
                    
                    // Verify the saved values
                    const verifyResponse = await fetch(`http://localhost:8080/api/get-keys?uuid=${appId}`);
                    const verifyData = await verifyResponse.json();
                    console.log("Verified saved data:", verifyData);
                    
                } catch (error) {
                    console.error("Error saving settings:", error);
                    if (error.message.includes("blank")) {
                       alert(error.message); 
                    } else {
                        alert("Error saving settings. Please try again.");
                    }
                }
            });
        });
    }
    
    // Also save to localStorage for backward compatibility
    llmKey.addEventListener("input", () => {
        localStorage.setItem("llm_api_key", llmKey.value);
    });
});