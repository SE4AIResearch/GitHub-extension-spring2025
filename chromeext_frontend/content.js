let summary = ""
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => 
    {
        let commitTitleDiv = document.querySelector('.commit-desc') || document.querySelector(".extended-commit-description-container");
        if (!commitTitleDiv){
            commitTitleDiv = document.querySelector('div.commit-title.markdown-title') || document.querySelector('div.CommitHeader-module__commit-message-container--nl1pf span > div')
            console.log(commitTitleDiv);
            
        }
    
        if (message.action === "fetchData") 
        {
            let ogMessage = commitTitleDiv.innerText;
            console.log(ogMessage);
            
            const additional = document.querySelector(".commit-desc") || document.querySelector(".extended-commit-description-container");
            if (additional) {
                console.log(additional.innerText);
                ogMessage += additional.innerText;
                console.log(ogMessage);
            }
            const loadingImage = chrome.runtime.getURL('pics/load_spinner.gif');
            let loading = document.createElement('img');
            loading.className = 'loading';
            loading.src = loadingImage
            loading.style.width = '40px';
            loading.style.height = '40px';
            loading.style.display = 'block';
            commitTitleDiv.appendChild(loading);

            // Get the UUID from storage
            chrome.storage.local.get(['appId'], function(result) {
                const uuid = result.appId;
                if (!uuid) {
                    console.error("No UUID found");
                    return;
                }

                if(chrome.runtime.lastError){
                    console.log("Error runtime content");
                    return;
                }

                function match(url) {
                    const splitwords = url.split('/');
                    return splitwords;
                }
                const url = window.location.href;
                
                const words = match(url);
                if (words[5] === "commit" || (words[5] === "pull" && words[7] === "commits")) {
                    const urlToSend = words[0] + '//' + words[2] + "/" + words[3] + "/" + words[4];
                    console.log(urlToSend);
                    const commitIDlist = words[words.length - 1].split('?');
                    const commitID = commitIDlist[0];
                    console.log(commitID);
                    console.log(ogMessage);
                    sendResponse({ urlToSend, commitID, ogMessage, uuid });
                } else {
                    console.log("Error in content words");
                    console.error("Wrong url");
                    return;
                }
            });
        }
        else if (message.action === "updateContent"){

            let tempChild = document.querySelector('.commit-pro-text');
            console.log(tempChild);
            if(tempChild) {
                tempChild.textContent = '';
                tempChild.remove();
            }
            
            let loading = document.querySelector('.loading');
            if (loading) {
                commitTitleDiv.removeChild(loading);
            }

            let commitProText = document.createElement('span');
            commitProText.style.color = '#2f68a8';
            commitProText.className = 'commit-pro-text';

            console.log(message.content);

            // Check if summary is already generated
            if (summary.includes("COMMIT PRO")) {
                console.log("Summary is already generated");
                alert("Summary is already generated");

                commitProText.innerHTML = summary;
                commitTitleDiv.appendChild(commitProText);
                return;
            }

            try{
                // Setting the COMMIT PRO header
                summary += "<br><br>COMMIT PRO<br><br>";
                
                // Extract the summary section
                const sum = message.content.match(/SUMMARY:\s*(.*?)(?:\s*INTENT:|$)/)[1];
                summary += "SUMMARY: " + sum;

            }catch(e){
                console.log("Error in summary");
            }
            try{
                // Extract the intent section
                const int = message.content.match(/INTENT:\s*(.*?)(?:\s*IMPACT:|$)/)[1];
                summary += "<br>INTENT: " + int;

            }catch(e){
                console.log("Error in intent");
            }
            try{
                // Extract the impact section
                const imp = message.content.match(/IMPACT:\s*(.*?)(?:\s*INSTRUCTION:|$)/)[1];
                summary += "<br>IMPACT: " + imp;
            }catch(e){
                console.log("Error in impact");
            }
            try{
                // Extract the instruction section
                const ins = message.content.split("INSTRUCTION:");
                if (ins.length > 1) {
                    const ins2 = ins[1].trim();
                    // Check if there are any refactorings
                    if (ins2 && ins2 !== "No Refactorings" && ins2 !== "No specific refactoring instructions available") {
                        summary += "<br>INSTRUCTION: " + ins2;
                    } else {
                        // No refactorings case
                        summary += "<br>INSTRUCTION: No Refactoring Detected";
                    }
                } else {
                    summary += "<br>INSTRUCTION: No Refactoring Detected";
                }
            }catch(e){
                console.log("Error processing refactoring details: " + e.message);
                // Fallback display if there's an error parsing the refactorings
                summary += "<br>INSTRUCTION: No Refactoring Detected";
            }

            // Update the HTML content
            commitProText.innerHTML = summary;
            commitTitleDiv.appendChild(commitProText);
        
            // Now add the Repository Analysis link after summary is loaded
            addRepositoryAnalysisLink(commitTitleDiv);
        
        } else if (message.action === "error") {
            alert("Error fetching data");
            console.log("Error fetching data" + message.content);
            return;
        } 
        return true;
    });

// Function to add the Repository Analysis link
function addRepositoryAnalysisLink(parentElement) {
    // Check if link already exists to avoid duplicates
    if (document.querySelector('.repo-analysis-link')) {
        return;
    }
    
    // Create a container for the link to control its positioning.
    const linkContainer = document.createElement('span');
    linkContainer.style.float = 'right';
    linkContainer.style.marginLeft = '1rem';
    linkContainer.style.marginTop = '0.5rem';
    linkContainer.className = 'repo-analysis-link-container';

    // Create the "Repository Analysis" link.
    const link = document.createElement('a');
    link.textContent = "Repository Analysis";
    link.className = 'repo-analysis-link';

    // Get the current repository URL
    let repoUrl = '';
    // First try to get repo URL from the current page URL
    const repoMatch = window.location.href.match(/https?:\/\/github\.com\/([^\/]+)\/([^\/]+)/);
    if (repoMatch) {
        // Extract just the base repository URL (e.g., https://github.com/username/repository)
        repoUrl = repoMatch[0];
        console.log("Extracted repository URL:", repoUrl);
    }

    // Configure the link 
    if (!repoUrl) {
        console.warn("Could not automatically determine repository URL from:", window.location.href);
        link.style.color = 'grey';
        link.style.cursor = 'not-allowed';
        link.title = 'Could not determine repository URL';
        // Prevent navigation if URL is missing
        link.addEventListener('click', (event) => event.preventDefault());
    } else {
        // Incorporating the existing logic of the link opening
        link.href = chrome.runtime.getURL("index.html") + "#/dashboard?forceReanalysis=true";
        link.target = '_blank'; // Open in a new tab
        link.style.color = 'blue';
        link.style.textDecoration = 'underline';
        link.style.cursor = 'pointer';

        // Add listener to save repoUrl to localStorage just before navigation
        link.addEventListener('click', () => {
            try {
                const appNamespace = 'github-extension-';
                
                // Check if there's an active analysis by looking for a different URL in localStorage
                const existingUrl = localStorage.getItem(`${appNamespace}repoAnalysisUrl`);
                
                // Skip the confirmation dialog and proceed directly with the new repository
                if (existingUrl && existingUrl !== repoUrl) {
                    console.log('Switching analysis from:', existingUrl, 'to:', repoUrl);
                }
                
                // Save to localStorage directly - this is critical for the analysis to work
                localStorage.setItem(`${appNamespace}repoAnalysisUrl`, repoUrl);
                console.log('Saved repoAnalysisUrl to localStorage:', repoUrl);

                // ALSO save commitID
                // Extract commitID again from URL (safe double-check)
                function match(url) {
                    const splitwords = url.split('/');
                    return splitwords;
                }
                const url = window.location.href;
                let commitID = ''
                
                const words = match(url);
                if (words[5] === "commit" || (words[5] === "pull" && words[7] === "commits")) {
                    const urlToSend = words[0] + '//' + words[2] + "/" + words[3] + "/" + words[4];
                    console.log(urlToSend);
                    const commitIDlist = words[words.length - 1].split('?');
                    commitID = commitIDlist[0];
                    console.log(commitID);

                    if (commitID) {
                        localStorage.setItem(`${appNamespace}commitID`, commitID);
                        console.log('Saved commitID to localStorage:', commitID);
                    } else {
                        console.warn('Could not extract commitID properly.');
                    }
                }
                

                // Add flag to indicate user explicitly requested analysis
                localStorage.setItem(`${appNamespace}forceReanalysis`, 'true');
                console.log('Set forceReanalysis flag in localStorage');

                chrome.storage.local.set({
                    'github-extension-repoAnalysisUrl': repoUrl,
                    'github-extension-commitID': commitID,
                    'github-extension-summary': summary,
                    'github-extension-forceReanalysis': true,
                  }, function() {
                    console.log('Saved repoUrl and commitID in chrome.storage.local');
                  });
                
                // Also try to set it to chrome.storage as a backup, but don't wait for response
                try {
                    // Don't use the response callback to avoid issues with message channel closing
                    chrome.runtime.sendMessage({
                        action: 'repoUrlSaved',
                        repoUrl: repoUrl,
                        commitID: commitID
                    });
                    console.log("Sent repository URL to background script");
                } catch (storageErr) {
                    // If message sending fails, still continue since we saved to localStorage
                    console.error("Error sending message to background script:", storageErr);
                }
                
                // Debug message to verify link is working
                console.log("Repository Analysis link clicked with URL:", repoUrl);
            } catch (e) {
                console.error("Error saving repo URL to localStorage:", e);
                alert("Error saving repository URL. Your browser may have localStorage disabled.");
            }
        });
    }

    linkContainer.appendChild(link);
    parentElement.appendChild(linkContainer);
}
