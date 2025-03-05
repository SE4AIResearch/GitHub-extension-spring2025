/*document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("b"); 
  const cancelBtn = document.getElementById("cancel_btn");
  const settingsBtn = document.getElementById("settings-btn");

  const llmSelect = document.getElementById("llmSelect");
  const githubToken = document.getElementById("github");
  const llmKey = document.getElementById("open-ai-key");

  if (settingsBtn) {
      settingsBtn.addEventListener("click", () => {
          window.location.href = "settings.html";
      });
  }

  if (generateBtn) {
      generateBtn.addEventListener("click", () => {
          const selectedLLM = llmSelect.value;
          const token = githubToken.value;
          const apiKey = llmKey.value.trim();

          if (!apiKey) {
              alert("Please enter your LLM API Key.");
              return;
          }

          alert(`Generating commit summary using ${selectedLLM}\nToken: ${token}`);
      });
  }

  if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
          llmKey.value = "";
      });
  }

  const savedApiKey = localStorage.getItem("llm_api_key");
  if (savedApiKey) {
      llmKey.value = savedApiKey;
  }

  llmKey.addEventListener("input", () => {
      localStorage.setItem("llm_api_key", llmKey.value);
  });
});
*/

const button = document.getElementById("b");
const cancelBtn = document.getElementById("cancel_btn");
const summary = document.getElementById("summary");
const intent = document.getElementById("intent");
const impact = document.getElementById("impact");
const instruction = document.getElementById("instruction");

let summaryGenerating = false;
let summaryTimeout; 


document.addEventListener("DOMContentLoaded", () => {
    const settingsBtn = document.getElementById("settings-btn");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => {
        window.location.href = "settings.html";
      });
    }
  });

window.addEventListener("DOMContentLoaded", () => 
{
    button.addEventListener('click', () => 
        {
        chrome.runtime.sendMessage({ action: "buttonClicked" });

        if (summaryGenerating) {
            alert("Summary generation is already in progress!");
            return;
        }

        summaryGenerating = true; 
        console.log("Generating summary...");

        summaryTimeout = setTimeout(() => {
            summaryGenerating = false;
            console.log("Summary generated successfully!");
        }, 5000);
    });

    if (cancelBtn) {
                cancelBtn.addEventListener("click", () => {
            if (!summaryGenerating) {
                alert("No summary generation in progress.");
                return;
            }

            summaryGenerating = false; 
            clearTimeout(summaryTimeout); 
            console.log("Summary generation stopped.");
            document.getElementsByClassName('loading')[0].style.display = "none";
        });
    }


})