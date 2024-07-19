console.log("content.js");
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    let commitTitleDiv = document.querySelector('.commit-desc');
    if (!commitTitleDiv){
        commitTitleDiv = document.querySelector('div.commit-title.markdown-title');
    }

    if (message.action === "fetchData") 
    {

        let ogMessage = document.querySelector("div.commit-title.markdown-title").innerText;
        console.log(ogMessage);
        
        const additional = document.querySelector(".commit-desc");
        if (additional) {
            console.log(additional.innerText);
            ogMessage += additional.innerText;
            console.log(ogMessage);
        }

        let loading = document.createElement('span');
        loading.style.color = 'blue';
        loading.className = 'loading';
        loading.innerHTML = "Loading...";
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
        
        // getting the original commit message from GitHub

        //console.log(url);
        const words = match(url);
        if (words[5] !== "commit") 
        {
            console.log("Error in content words");
            console.error("Wrong url");
            return;
        } 
        else {
            const urlToSend = words[0] + '//' + words[2] + "/" + words[3] + "/" + words[4];
            const commitIDlist = words[words.length - 1].split('?');
            const commitID = commitIDlist[0];
            sendResponse({ urlToSend, commitID, ogMessage });
        }
    }
    else if (message.action === "updateContent"){
        let loading = document.querySelector('.loading');
        if (loading) {
            commitTitleDiv.removeChild(loading);
        }

        let commitProText = document.createElement('span');
        
        commitProText.style.color = 'blue';
        commitProText.className = 'commit-pro-text';
        commitProText.innerHTML = "<br>COMMIT PRO" + message.content + "<br>";
        
        commitTitleDiv.appendChild(commitProText);
    }
    return true;
});

