// const urlToSend = "https://github.com/SE4AIResearch/GitHub-extension-summer2024";
// const commitID = "dc8832108964ce2df010b9ea090bafe50ef7fe5c";

const urlToSend = "https://github.com/danilofes/refactoring-toy-example";
const commitID = "63cbed99a601e79c6a0ae389b2a57acdbd3e1b44";
const ogmessage = "Rename Class	org.animals.Cow renamed to org.animals.CowRenamed"

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
