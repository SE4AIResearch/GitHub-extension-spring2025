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
    
            let loading = document.createElement('img');
            loading.className = 'loading';
            loading.src = chrome.runtime.getURL('pics/load2.gif');
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
            let summary = ""


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
        }

        return true;
    });

(function() {
    window.addEventListener('load', () => {
        // Locate the container element where the link should be inserted.
        const commitTitleDiv = document.querySelector('.commit-desc')
            || document.querySelector('.extended-commit-description-container')
            || document.querySelector('div.commit-title.markdown-title')
            || document.querySelector('div.CommitHeader-module__commit-message-container--nl1pf span > div');

        if (commitTitleDiv) {
            // Create a container for the link to control its positioning.
            const linkContainer = document.createElement('span');
            linkContainer.style.float = 'right';
            linkContainer.style.marginLeft = '1rem';
            linkContainer.style.marginTop = '0.2rem';

            // Create the "Reprosetory Analysis" link.
            const link = document.createElement('a');
            link.textContent = "Reprosetory Analysis";
            // Use the dashboard.html file as exposed in manifest.json.
            //link.href = chrome.runtime.getURL('index.html#/dashboard');
            link.href = chrome.runtime.getURL('dashboard.html');
            link.target = '_blank';
            link.style.color = 'blue';
            link.style.textDecoration = 'underline';
            link.style.cursor = 'pointer';

            linkContainer.appendChild(link);
            commitTitleDiv.appendChild(linkContainer);
        }
    });
})();
