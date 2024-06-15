package saim;

import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

import org.refactoringminer.api.GitHistoryRefactoringMiner;
import org.refactoringminer.api.Refactoring;
import org.refactoringminer.api.RefactoringHandler;
import org.refactoringminer.rm1.GitHistoryRefactoringMinerImpl;
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
    private final AtomicLong counter = new AtomicLong();

    public String returnrefs (String url, String id) {
        if (aitoken == null || aitoken.isBlank()) {
            System.out.println(aitoken);
            throw new RuntimeException("Token not valid.");
        }
        StringBuilder refactoringMessages = new StringBuilder();
        GitHistoryRefactoringMiner miner = new GitHistoryRefactoringMinerImpl();
        miner.detectAtCommit(url,
            id, new RefactoringHandler() {
                @Override
                public void handle(String commitId, List<Refactoring> refactorings) {
                    int x = 1;
                    for (Refactoring ref : refactorings) {
                        refactoringMessages.append(x + ". " +  ref.toString() + "\n");
                        x++;
                    }
                }
            }, 10);

        if (refactoringMessages.toString().trim().isEmpty()) {
            return "No refactoring Changes";
        }
        String refactorings = refactoringMessages.toString();

        OpenAiService service = new OpenAiService(aitoken);
        StringBuilder returnedResult = new StringBuilder();
        try {
            CompletionRequest completionRequest = CompletionRequest.builder()
            .prompt("Act as a prompt optimizer and optimize the following prompt for summary on changes. The prompt is [Given the following list of refactoring changes, generate a clear, concise and COMPLETE message that can contain multiple sentences that summarizes ALL the refactoring changes effectively for people to understand. After the summary, give one line for the motivation behind these changes and then give one line on the impact of these changes.]\n"+ refactorings)
            .model("gpt-3.5-turbo-instruct")
            .maxTokens(200)
            .build();
            CompletionResult result = service.createCompletion(completionRequest);
            List<CompletionChoice> choices = result.getChoices();

            if (choices != null && !choices.isEmpty()) {
                String text = choices.get(0).getText();
                returnedResult.append(text);
            }

            return returnedResult.toString();
        } catch (Exception exp) {
            throw new RuntimeException(exp.getMessage());
        }
    }

    @GetMapping("/greeting")    
    public Greeting greeting(@RequestParam String url, @RequestParam String id) {
        String refMessage = returnrefs(url, id);
        System.out.println("Refactoring message: " + refMessage);
        return new Greeting(counter.incrementAndGet(), refMessage);
    }

    // public static void main(String[] args) throws Exception {
    //     if (aitoken == null || aitoken.isBlank()) {
    //         System.out.println(aitoken);
    //         throw new RuntimeException("token not valid!");
    //     }
    //     StringBuilder refactoringMessages = new StringBuilder();
    //     GitHistoryRefactoringMiner miner = new GitHistoryRefactoringMinerImpl();
    //     miner.detectAtCommit("https://github.com/danilofes/refactoring-toy-example",
    //         "36287f7c3b09eff78395267a3ac0d7da067863fd", new RefactoringHandler() {
    //             @Override
    //             public void handle(String commitId, List<Refactoring> refactorings) {
    //                 System.out.println("Refactorings at " + commitId);
    //                 int x = 1;
    //                 for (Refactoring ref : refactorings) {
    //                     System.out.println(x + ". ||" + ref.toString());
    //                     refactoringMessages.append(ref.toString());
    //                 }
    //             }
    //         }, 10);
    //     // System.out.println("---------------------------------------------");
    //     // System.out.println(openAIOutput(refactoringMessages.toString()));
    // }

    private static String openAIOutput(String refactorings) {
        OpenAiService service = new OpenAiService(aitoken);
        StringBuilder returnedResult = new StringBuilder();
        try {
            CompletionRequest completionRequest = CompletionRequest.builder()
                .prompt("Generate a clear and concise commit message for the following refactoring changes:\n" + refactorings)
                .model("gpt-3.5-turbo")
                .build();
            CompletionResult result = service.createCompletion(completionRequest);
            List<CompletionChoice> choices = result.getChoices();

            if (choices != null && !choices.isEmpty()) {
                String text = choices.get(0).getText();
                returnedResult.append(text);
            }
            return returnedResult.toString();
        } catch (Exception exp) {
            throw new RuntimeException(exp.getMessage());
        }
    }
}
