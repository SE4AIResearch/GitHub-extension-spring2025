const button = document.getElementById("b");
const ref = document.getElementById("p");
const commit = document.getElementById("c");

window.addEventListener("DOMContentLoaded", () => {
    button.addEventListener('click', () => 
        {
        chrome.runtime.sendMessage({ action: "buttonClicked" }, (response) => 
            {
                console.log(response + "from popup");
                const res = response.split("||");
                
                ref.textContent = res[0];
                commit.textContent = res[1];
        }
    );
    });
})
