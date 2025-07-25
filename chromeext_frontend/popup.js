const button = document.getElementById("b");
const cancelBtn = document.getElementById("cancel_btn");
const summary = document.getElementById("summary");
const intent = document.getElementById("intent");
const impact = document.getElementById("impact");
const instruction = document.getElementById("instruction");

let summaryGenerating = false;
let summaryTimeout; 
let keysAvailable = false;
let isCurURLCommit = true;

// Check if keys are available on popup load
function checkKeysAvailability() {
    chrome.storage.local.get(['appId', 'githubToken', 'openaiKey'], function(result) {
        if (result.githubToken && result.openaiKey) {
            keysAvailable = true;
            /*if (button) {
                button.disabled = false;
                button.classList.remove('disabled');
            }*/

            if (button) {
                    button.disabled = false;
                    button.classList.remove('disabled');
                    button.removeAttribute("title"); 
            }
            console.log("API keys available, Generate Summary button enabled");
        } else if (result.appId) {
            // If we have appId but no keys in local storage, try fetching from backend
            fetch(`http://localhost:8080/api/get-keys?uuid=${result.appId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.githubApiKey && data.openaiLlmApiKey) {
                        keysAvailable = true;
                        // Save to local storage for quick access
                        chrome.storage.local.set({
                            githubToken: data.githubApiKey,
                            openaiKey: data.openaiLlmApiKey
                        });
                        if (button) {
                            button.disabled = false;
                            button.classList.remove('disabled');
                            button.removeAttribute("title");
                        }
                        console.log("API keys fetched from backend, Generate Summary button enabled");
                    }
                })
                .catch(error => {
                    console.error("Error fetching keys:", error);
                    if (button) {
                        button.disabled = true;
                        button.classList.add("disabled");
                        button.setAttribute("title", "Could not fetch API keys. Please check your settings.");
                    }
                    showStatusMessage("Unable to fetch keys from server.", "error");
                });
        }
        else {
            if (button) {
                button.disabled = true;
                button.classList.add("disabled");
                button.setAttribute("title", "You should go to settings and add details");
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const settingsBtn = document.getElementById("settings-btn");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => {
        window.location.href = "settings.html";
      });
    }
    
    // Check if keys are available when popup opens
    checkKeysAvailability();

    // Check if active tab contains a GitHub repository
    const errorMessage = document.getElementById('error-message');
    const repoInfo = document.getElementById('repo-info');
    const analyzeButton = document.getElementById('analyze-repo');
    const settingsButton = document.getElementById('go-to-settings');
    
    // Check for existing repository URL in localStorage
    try {
        const appNamespace = 'github-extension-';
        const storedRepoUrl = localStorage.getItem(`${appNamespace}repoAnalysisUrl`);
        
        if (storedRepoUrl) {
            console.log("Found existing repository URL in localStorage:", storedRepoUrl);
            
            // Sync with chrome.storage to ensure consistency
            chrome.runtime.sendMessage({
                action: 'syncRepoUrl',
                repoUrl: storedRepoUrl
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error syncing repository URL:", chrome.runtime.lastError);
                } else if (response && response.success) {
                    console.log("Successfully synced repository URL with background script");
                }
            });
        }
    } catch (e) {
        console.error("Error checking localStorage:", e);
    }
});

// Listen for messages from the settings page or background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "settingsUpdated") {
        keysAvailable = true;
        if (button) {
            button.disabled = false;
            button.classList.remove('disabled');
        }
        console.log("Settings updated, Generate Summary button enabled");
    } 
    return true;
});

window.addEventListener("DOMContentLoaded", () => 
{
    // Disable the Generate Summary button initially if no keys are available
    if (button && !keysAvailable) {
        button.disabled = true;
        button.classList.add('disabled');
    }
    
    button.addEventListener('click', () => 
        {
        // Don't proceed if keys are not available
        if (!keysAvailable) {
            alert("Please set your GitHub OAuth token and OpenAI API key in Settings first.");
            return;
        }

         // Checks if current website is a GitHub commit 
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            let checkURL = tabs[0].url;
            if (checkURL.match(/https?:\/\/github\.com/) && checkURL.match(/\b(commit)\b((?!.*master).)*/)) {
                console.log("Current URL is a GitHub commit. URL " + checkURL);
                isCurURLCommit = true;
            } else {
                console.log("Incorrect URL. Not a GitHub commit. URL " + checkURL);
                isCurURLCommit = false;
            }
        });
        
        if (isCurURLCommit) {
            chrome.runtime.sendMessage({ action: "buttonClicked" });
            
            if (summaryGenerating) {
                alert("Summary generation is already in progress!");
                return;
            }

            summaryGenerating = true; 
            console.log("Generating summary...");

            summaryTimeout = setTimeout(() => {
                summaryGenerating = false;
                console.log("Summary generated successfully!");
            }, 5000);

        } else {
           alert("Current URL is not a GitHub commit. Please try again.");
      }
    });
        
    if (cancelBtn) {
                cancelBtn.addEventListener("click", () => {
            if (!summaryGenerating) {
                alert("No summary generation in progress.");
                return;
            }

            summaryGenerating = false; 
            clearTimeout(summaryTimeout); 
            console.log("Summary generation stopped.");
            document.getElementsByClassName('loading')[0].style.display = "none";
        });
    }
})