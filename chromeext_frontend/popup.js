const button = document.getElementById("b");
const cancelButton = document.getElementById("cancel_btn");
const nameDisplay = document.getElementById("nameDisplay");
const llmSelect = document.getElementById("llmSelect");
const tokenSelect = document.getElementById("tokenSelect");
const llmKey = document.getElementById("llmKey");

const summary = document.getElementById("summary");
const intent = document.getElementById("intent");
const impact = document.getElementById("impact");
const instruction = document.getElementById("instruction");

window.addEventListener("DOMContentLoaded", () => {

    button.addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "buttonClicked" });
    });

    cancelButton.addEventListener("click", () => {
        console.log("Cancelled");
        nameDisplay.innerText = "Action Cancelled";
    });

    llmSelect.addEventListener("change", () => {
        console.log("Selected LLM:", llmSelect.value);
    });

    tokenSelect.addEventListener("change", () => {
        console.log("Selected Token:", tokenSelect.value);
    });

    llmSelect.addEventListener("change", () => {
        llmKey.value = llmSelect.value === "openai" ? "OpenAI-API-KEY" : "Gemini-API-KEY";
    });
});
