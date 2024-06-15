chrome.runtime.onMessage.addListener((message, sender, sendResponse) => 
{
    if (message.action === "buttonClicked") 
    {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => 
        {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'fetchData' }, (response) => 
            {
                    if(chrome.runtime.lastError){
                        console.log("Error runtime background");
                        return;
                    }
                    if (response === null){
                        console.log("response is null");
                        return;
                    }
                    if (response === undefined){
                        console.log("response is undefined");
                        return;
                    }
                    const { urlToSend, commitID } = response;
                    if (!urlToSend || !commitID) {
                        sendResponse({ error: "Failed to retrieve URL or commit ID" });
                        return;
                    }
                    // console.log(urlToSend);
                    // console.log(commitID);
                    fetch(`http://localhost:8080/greeting?${new URLSearchParams({
                        url: urlToSend,
                        id: commitID,
                    })}`)
                    .then(response => response.json())
                    .then(data => {
                        console.log(data.content + "data.content from background");
                        sendResponse(data.content)
                    })
                    .catch(error => {
                        console.error('Error: from background', error);
                        sendResponse("Error from background");
                    });
            });
        });
        return true;
    }
    return true;
});

