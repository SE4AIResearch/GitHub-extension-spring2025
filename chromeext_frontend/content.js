chrome.runtime.onMessage.addListener((message, sender, sendResponse) => 
    {
        let commitTitleDiv = document.querySelector('.commit-desc') || document.querySelector(".extended-commit-description-container");
        if (!commitTitleDiv){
            commitTitleDiv = document.querySelector('div.commit-title.markdown-title') || document.querySelector('div.CommitHeader-module__commit-message-container--nl1pf span > div')
            console.log(commitTitleDiv);
            
        }
    
        if (message.action === "fetchData") 
        {
            //let ogMessage = document.querySelector("div.commit-title.markdown-title").innerText || document.querySelector('div.CommitHeader-module__commit-message-container--nl1pf span > div').innerText;
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
            //Adding additional pull request functionality
            if (words[5] === "commit" || (words[5] === "pull" && words[7] === "commits")) 
            {
                // console.log("Error in content words");
                // console.error("Wrong url");
                // return;
                const urlToSend = words[0] + '//' + words[2] + "/" + words[3] + "/" + words[4];
                console.log(urlToSend);
                const commitIDlist = words[words.length - 1].split('?');
                const commitID = commitIDlist[0];
                console.log(commitID);
                console.log(ogMessage);
                sendResponse({ urlToSend, commitID, ogMessage });
            } 
            else {
                // const urlToSend = words[0] + '//' + words[2] + "/" + words[3] + "/" + words[4];
                // const commitIDlist = words[words.length - 1].split('?');
                // const commitID = commitIDlist[0];
                // sendResponse({ urlToSend, commitID, ogMessage });
                console.log("Error in content words");
                console.error("Wrong url");
                return;
            }
        }
        else if (message.action === "updateContent"){

            let tempChild = document.querySelector('.commit-pro-text');
            console.log(tempChild);
            if(tempChild) {
                // tempChild.innerText = '';
                // tempChild.innerHTML = '';
                // commitTitleDiv.removeChild(tempChild);
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
                const sum = message.content.match(/SUMMARY:\s*(.*?)(?:\s*INTENT:|$)/)[1];
                summary += "<br><br>COMMIT PRO<br><br>SUMMARY: " + sum

            }catch(e){
                console.log("Error in summary");
            }
            try{
                const int = message.content.match(/INTENT:\s*(.*?)(?:\s*IMPACT:|$)/)[1];
                summary += "<br>INTENT: " + int

            }catch(e){
                console.log("Error in intent");
            }
            try{
                const imp = message.content.match(/IMPACT:\s*(.*?)(?:\s*INSTRUCTION:|$)/)[1];
                summary += "<br>IMPACT: " + imp
            }catch(e){
                console.log("Error in impact");
            }
            try{
                const ins = message.content.split("INSTRUCTION:")
                const ins2 = ins[1];
                summary += "<br>INSTRUCTION: " + ins2 + "<br>"
            }catch(e){
                console.log("Error in instruction");
            }
            
            // Update the HTML content
            commitProText.innerHTML = summary;
            
            
            commitTitleDiv.appendChild(commitProText);
        }

        return true;
    });
    