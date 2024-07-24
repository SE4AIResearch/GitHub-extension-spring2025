// const urlToSend = "https://github.com/SE4AIResearch/GitHub-extension-summer2024";
// const commitID = "dc8832108964ce2df010b9ea090bafe50ef7fe5c";

const urlToSend = "https://github.com/danilofes/refactoring-toy-example";
const commitID = "0a46ed5c56c8b1576dfc92f3ec5bc2f0ea68aafe";
const ogmessage = "Delete attributes in Snake;"

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
