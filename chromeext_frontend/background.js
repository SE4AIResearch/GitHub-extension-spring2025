chrome.runtime.onMessage.addListener((message, sender, sendResponse) => 
{
    if (message.action === "buttonClicked") 
    {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => 
        {
            if (tabs.length === 0) 
            {
                sendResponse({ error: "No active tabs found" });
                return;
            }
            chrome.tabs.sendMessage(tabs[0].id, { action: 'fetchData' }, async (response) => 
            {

                    // Getting the data {url, commitID, original message}
                    if(chrome.runtime.lastError){
                        console.log(chrome.runtime.lastError.message);
                        sendResponse({ error: "Invalid data from content script" });
                        return;
                    }
                    if (response === null || response === undefined)
                    {
                        console.log("response is null or undefined");
                        sendResponse({ error: "Invalid data from content script" });
                        return;
                    }
                    const { urlToSend, commitID, ogMessage } = response;
                    if (!urlToSend || !commitID) 
                    {
                        console.log("Failed to fetch either url or commitId")
                        sendResponse({ error: "Invalid data from content script" });
                        return;
                    }

                    // fetch(`http://localhost:8080/greeting?${new URLSearchParams({
                    //     url: urlToSend,
                    //     id: commitID,
                    // })}`)
                    // .then(response => response.json())
                    // .then(data => 
                    //     {
                    //         console.log(data.content + "data.content from background");
                    //         //sendResponse(data.content)
                    //         chrome.tabs.sendMessage(tabs[0].id, { action: 'updateContent', content: data.content });
                    //         sendResponse({ error: "Invalid data" });
                    //     }
                    // )
                    // .catch(error => {
                    //     console.log('Error: from background', error);
                    //     sendResponse({ error: "Invalid data from content script" });
                    // });

                    // Async function
                    async function fetchCommitSummaryData(urlToSend, commitID, ogMessage){
                        try{
                            function delay(ms) {
                                return new Promise(resolve => setTimeout(resolve, ms));
                            }
                            const response = await fetch(`http://localhost:8080/greeting?${new URLSearchParams({
                                url: urlToSend,
                                id: commitID,
                                og: ogMessage
                            })}`);
                            const data = await response.json();
                            console.log(data.content + "data.content from background");
                            await delay(2000);
                            chrome.tabs.sendMessage(tabs[0].id, { action: 'updateContent', content: data.content });
                            sendResponse({ error: "Invalid data" });

                        }
                        catch(error){
                            console.log('Error: from background', error);
                            sendResponse({ error: "Invalid data" });
                            return;
                        }
                    }

                    await fetchCommitSummaryData(urlToSend, commitID, ogMessage);
            });
        });
        return true;
    }
    return true;
});
