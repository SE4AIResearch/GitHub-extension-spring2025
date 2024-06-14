// Injected into the webpage and gets the url and sends this information to the background.js
function match(url){
    const splitwords = url.split('/')
    return splitwords;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "buttonClicked"){
        // const url = window.location.href;
        // const words = match(url);
        // if (words[5] !== "commit"){
        //      throw new Error("Wrong url, must go to commits page or https://github.com/user/project/commit/id")
        //  }
        // // url to send
        // const urlToSend = words[0] + '//' + words[2] + "/"+ words[3] + "/" + words[4];
        const urlToSend = "https://github.com/danilofes/refactoring-toy-example";

        // commit ID to send
        //const commitID = words[words.length -1];
        const commitID = "36287f7c3b09eff78395267a3ac0d7da067863fd";
        
        // gets the request from the background and then sends the url and commit ID to background
        chrome.runtime.sendMessage({urlToSend, commitID});
        
        return true;
    }
}
)

