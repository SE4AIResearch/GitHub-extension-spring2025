const button = document.getElementById("b");
const para = document.getElementById("p");
button.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "buttonClicked" }, (response) => {
        if (response.error) {
            para.textContent = response.error;
        } else {
            para.textContent = response.content;
        }
    });
});
