console.log("content.js");
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fetchData") 
    {
        if(chrome.runtime.lastError){
            console.log("Error runtime content");
            return;
        }
        function match(url) {
            const splitwords = url.split('/');
            return splitwords;
        }
        const url = window.location.href;

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
            const commitID = words[words.length - 1];
            sendResponse({ urlToSend, commitID });
        }
    }
    else if (message.action === "updateContent"){
        let commitTitleDiv = document.querySelector('div.commit-title.markdown-title');
        let commitProText = document.createElement('span');
        
        commitProText.style.color = 'blue';
        commitProText.className = 'commit-pro-text';
        commitProText.innerHTML = "<br>COMMIT PRO" + message.content + "<br>";
        
        commitTitleDiv.appendChild(commitProText);
    }
    return true;
});

