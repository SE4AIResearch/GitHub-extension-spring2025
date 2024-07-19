// const urlToSend = "https://github.com/SE4AIResearch/GitHub-extension-summer2024";
// const commitID = "dc8832108964ce2df010b9ea090bafe50ef7fe5c";

const urlToSend = "https://github.com/apache/hadoop";
const commitID = "f1e2ceb823e92ce864f7f2f327c4c0af722b4d85";
const ogmessage = "Do not propagate ExecutionException while initializing ED…EK queues for keys."

fetch(`http://localhost:8080/greeting?${new URLSearchParams({
    url: urlToSend,
    id: commitID,
    og: ogmessage
})}`)
.then(response => response.json())
.then(data => {
    console.log(data.content);
})
.catch(error => {
    console.error('Error:', error);
});
