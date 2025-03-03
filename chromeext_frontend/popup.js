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



document.addEventListener("DOMContentLoaded", () => {
    const settingsBtn = document.getElementById("settings-btn");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => {
        window.location.href = "settings.html";
      });
    }
  });

