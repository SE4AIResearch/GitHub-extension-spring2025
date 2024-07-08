chrome.runtime.onMessage.addListener((message, sender, sendResponse) => 
{
    if (message.action === "buttonClicked") 
    {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => 
        {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'fetchData' }, (response) => 
            {
                    if(chrome.runtime.lastError){
                        console.log(chrome.runtime.lastError.message);
                        return;
                    }
                    if (response === null || response === undefined){
                        console.log("response is null or undefined");
                        return;
                    }
                    const { urlToSend, commitID } = response;
                    if (!urlToSend || !commitID) {
                        console.log("Failed to fetch either url or commitId")
                        return;
                    }
                    fetch(`http://localhost:8080/greeting?${new URLSearchParams({
                        url: urlToSend,
                        id: commitID,
                    })}`)
                    .then(response => response.json())
                    .then(data => 
                        {
                        console.log(data.content + "data.content from background");
                        //sendResponse(data.content)
                        chrome.tabs.sendMessage(tabs[0].id, { action: 'updateContent', content: data.content });
                        }
                    )
                    .catch(error => {
                        console.log('Error: from background', error);
                        return;
                    });
            });
        });
        return true;
    }
    return true;
});

