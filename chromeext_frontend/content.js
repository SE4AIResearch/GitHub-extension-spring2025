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
        console.log(url);
        const words = match(url);
        if (words[5] !== "commit") 
        {
            console.log("Error in content words");
            sendResponse({ error: "Wrong URL, must go to a commit page like https://github.com/user/project/commit/id" });
        } 
        else {
            const urlToSend = words[0] + '//' + words[2] + "/" + words[3] + "/" + words[4];
            console.log(urlToSend);
            const commitID = words[words.length - 1];
            console.log(commitID);
            sendResponse({ urlToSend, commitID });
        }
    }
    return true;
});

