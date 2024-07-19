const button = document.getElementById("b");
const summary = document.getElementById("summary");
const intent = document.getElementById("intent");
const impact = document.getElementById("impact");
const instruction = document.getElementById("instruction");

window.addEventListener("DOMContentLoaded", () => 
{
    button.addEventListener('click', () => 
        {
        chrome.runtime.sendMessage({ action: "buttonClicked" });
    });
})
