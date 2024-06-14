importScripts('axios.min.js');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => 
{
    if (message.action === "buttonClicked") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'buttonClicked' }, (response) => 
                {
                if (response.error) {
                    sendResponse({ error: response.error });
                } 
                else {
                    const { urlToSend, commitID } = response;
                    axios.get('http://localhost:8080/greeting', {
                        params: {
                            url: urlToSend,
                            id: commitID
                        }
                    }).then(response => 
                        {
                        console.log(response.data);
                        sendResponse(response.data);
                    }).catch(error => {
                        sendResponse({ error: 'Request failed' });
                    });
                }
            });
        });
        // Returning true outside of axios.get() callback
        return true;
    }
});
