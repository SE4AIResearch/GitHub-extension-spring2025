package saim;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import org.refactoringminer.api.GitHistoryRefactoringMiner;
import org.refactoringminer.api.Refactoring;
import org.refactoringminer.api.RefactoringHandler;
import org.refactoringminer.rm1.GitHistoryRefactoringMinerImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.theokanning.openai.completion.CompletionChoice;
import com.theokanning.openai.completion.CompletionRequest;
import com.theokanning.openai.completion.CompletionResult;
import com.theokanning.openai.service.OpenAiService;

@RestController
public class RefactoringController {
    private static final String aitoken = System.getenv("OPENAI_API_KEY");

    @Autowired
    private CommitService cService;
    private final AtomicLong counter = new AtomicLong();

    public String returnrefs(String url, String id) 
    {
        String fullurl = url + "/commit/" + id;
        System.out.println(fullurl);
        if (aitoken == null || aitoken.isBlank()) 
        {
            System.out.println(aitoken);
            throw new RuntimeException("Token not valid.");
        }

        StringBuilder refactoringMessages = new StringBuilder();
        GitHistoryRefactoringMiner miner = new GitHistoryRefactoringMinerImpl();
        HashMap<String, Integer> refactoringinstances = new HashMap<>();

        miner.detectAtCommit(url, id, new RefactoringHandler() 
        {
            @Override
            public void handle(String commitId, List<Refactoring> refactorings) {
                int x = 1;
                for (Refactoring ref : refactorings) {
                    // BINDS ALL THE COMMIT MESSAGES INTO REFACTORING MESSAGES
                    refactoringMessages.append(x + ". " + ref.toString() + "\n");

                    String refType = ref.getRefactoringType().toString();

                    int count = refactoringinstances.containsKey(refType) ? refactoringinstances.get(refType) : 0;
                    refactoringinstances.put(refType, count + 1);
                    x++;
                }
            }
        }, 10);

        String refactorings = refactoringMessages.toString();
        System.out.println("Refactoring Miner tool " + refactorings + "\n");

        // IF THERE ARE NO REFACTORINGS
        if (refactorings.trim().isEmpty()) {
            System.out.println("No refs");
            //return ("No Refactorings");
            OpenAiService service = new OpenAiService(aitoken);
            StringBuilder returnedResultfromgpt = new StringBuilder();
            try {
                CompletionRequest completionRequest = CompletionRequest.builder()
                        .prompt("Act as a prompt optimizer and optimize the following prompt for summary on changes. The prompt is [Given the following url, generate a clear, concise and COMPLETE message that is 1-2 sentences that summarizes the changes in the code for people to understand. After the summary, give one line for the motivation behind these changes and then give one line on the impact of these changes. Write it in this format: SUMMARY: summary changes, INTENT: intent line, IMPACT: impact line]\n" + fullurl)
                        .model("gpt-3.5-turbo-instruct")
                        .maxTokens(200)
                        .build();
                CompletionResult result = service.createCompletion(completionRequest);
                List<CompletionChoice> choices = result.getChoices();
                if (choices != null && !choices.isEmpty()) {
                    String text = choices.get(0).getText();
                    returnedResultfromgpt.append(text);
                }
                returnedResultfromgpt.append(" ." + " Instruction: " + "No Refactorings");
                return returnedResultfromgpt.toString();
            } catch (Exception exp) {
                throw new RuntimeException(exp.getMessage());
            }
        }

        // IF THERE ARE REFACTORINGS
        OpenAiService service = new OpenAiService(aitoken);
        StringBuilder returnedResultfromgpt = new StringBuilder();
        StringBuilder instructions = new StringBuilder();
        try {
            CompletionRequest completionRequest = CompletionRequest.builder()
                    .prompt("Act as a prompt optimizer and optimize the following prompt for summary on changes. The prompt is [Given the following list of refactoring changes, generate a clear, concise and COMPLETE message that can contain multiple sentences that summarizes ALL the refactoring changes effectively for people to understand. After the summary, give one line for the intent behind these changes and then give one line on the impact of these changes. Write it in this format: SUMMARY: summary changes, INTENT: intent line, IMPACT: impact line]\n" + refactorings)
                    .model("gpt-3.5-turbo-instruct")
                    .maxTokens(200)
                    .build();
            CompletionResult result = service.createCompletion(completionRequest);
            List<CompletionChoice> choices = result.getChoices();

            if (choices != null && !choices.isEmpty()) {
                String text = choices.get(0).getText();
                returnedResultfromgpt.append(text);
            }

            for (Map.Entry<String, Integer> entry : refactoringinstances.entrySet()) {
                String key = entry.getKey();
                Integer value = entry.getValue();
                instructions.append(value + " " + key + "  ");

            }
            returnedResultfromgpt.append(" " + "Instruction: " + instructions.toString());
            return returnedResultfromgpt.toString();
        } catch (Exception exp) {
            throw new RuntimeException(exp.getMessage());
        }
    }

    @CrossOrigin(origins = "http://localhost:8080")
    @GetMapping("/greeting")
    public Greeting greeting(@RequestParam String url, @RequestParam String id) 
    {
        Optional<String> commitmsg = cService.getCommitfromDB(url, id);
        if (commitmsg.isPresent()){
            System.out.println("Refactoring message: " + commitmsg);
            return new Greeting(counter.incrementAndGet(), commitmsg.get());
        }
        var refMessage = returnrefs(url, id);
        cService.saveCommit(id, url, refMessage);
        //System.out.println("Refactoring message: " + refMessage);
        return new Greeting(counter.incrementAndGet(), refMessage);
    }

    // old methods

    // public static void main(String[] args) throws Exception {
    // if (aitoken == null || aitoken.isBlank()) {
    // System.out.println(aitoken);
    // throw new RuntimeException("token not valid!");
    // }
    // StringBuilder refactoringMessages = new StringBuilder();
    // GitHistoryRefactoringMiner miner = new GitHistoryRefactoringMinerImpl();
    // miner.detectAtCommit("https://github.com/danilofes/refactoring-toy-example",
    // "36287f7c3b09eff78395267a3ac0d7da067863fd", new RefactoringHandler() {
    // @Override
    // public void handle(String commitId, List<Refactoring> refactorings) {
    // System.out.println("Refactorings at " + commitId);
    // int x = 1;
    // for (Refactoring ref : refactorings) {
    // System.out.println(x + ". ||" + ref.toString());
    // refactoringMessages.append(ref.toString());
    // }
    // }
    // }, 10);
    // // System.out.println("---------------------------------------------");
    // // System.out.println(openAIOutput(refactoringMessages.toString()));
    // }

    // private static String openAIOutput(String refactorings) {
    // OpenAiService service = new OpenAiService(aitoken);
    // StringBuilder returnedResultfromgpt = new StringBuilder();
    // try {
    // CompletionRequest completionRequest = CompletionRequest.builder()
    // .prompt("Generate a clear and concise commit message for the following
    // refactoring changes:\n" + refactorings)
    // .model("gpt-3.5-turbo")
    // .build();
    // CompletionResult result = service.createCompletion(completionRequest);
    // List<CompletionChoice> choices = result.getChoices();
    // if (choices != null && !choices.isEmpty()) {
    // String text = choices.get(0).getText();
    // returnedResultfromgpt.append(text);
    // }
    // return returnedResultfromgpt.toString();
    // } catch (Exception exp) {
    // throw new RuntimeException(exp.getMessage());
    // }
    // }
}
