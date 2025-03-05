document.addEventListener("DOMContentLoaded", () => {
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