const button = document.getElementById("b");
const summary = document.getElementById("summary");
const intent = document.getElementById("intent");
const impact = document.getElementById("impact");
const instruction = document.getElementById("instruction");

//test comment to see if push is occurring

window.addEventListener("DOMContentLoaded", () => 
{
    button.addEventListener('click', () => 
        {
        chrome.runtime.sendMessage({ action: "buttonClicked" }, (response) => 
            {
                const sum = response.match(/SUMMARY:\s*(.*?)(?:\s*INTENT:|$)/)[1];
                const int = response.match(/INTENT:\s*(.*?)(?:\s*IMPACT:|$)/)[1];
                const imp = response.match(/IMPACT:\s*(.*?)(?:\s*Instruction:|$)/)[1];
                const ins = response.match(/Instruction:\s*(.*?)(?:\s*$|$)/)[1];

                summary.innerText = "Summary: " + sum;
                intent.innerText = "Intent: " + int;
                impact.innerText = "Impact: " + imp;
                instruction.innerText = "Instruction: " + ins;
            }
        );
    });
})
