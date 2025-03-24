package saim;

import com.theokanning.openai.completion.CompletionChoice;
import com.theokanning.openai.completion.CompletionRequest;
import com.theokanning.openai.completion.CompletionResult;
import com.theokanning.openai.service.OpenAiService;

import java.util.Map;

public class LLM {
    public String generateSummaryForNoRefactorings(String fullUrl, OpenAiService service) {
        try {
            String prompt = "Act as a prompt optimizer and optimize the following prompt for summary on changes. The prompt is [Given the following url, generate a clear, concise and COMPLETE message that is 1-2 sentences that summarizes the changes in the code for people to understand. After the summary, give one line for the motivation behind these changes and then give one line on the impact of these changes. Write it in this format: SUMMARY: summary changes, INTENT: intent line, IMPACT: impact line]\n" + fullUrl;
            CompletionRequest completionRequest = CompletionRequest.builder()
                    .prompt(prompt)
                    .model("gpt-3.5-turbo-instruct")
                    .maxTokens(300)
                    .build();
            CompletionResult result = service.createCompletion(completionRequest);
            String text = result.getChoices().isEmpty() ? "" : result.getChoices().get(0).getText();
            return text + " INSTRUCTION: No Refactoring Detected";
        } catch (Exception exp) {
            System.err.println("Error generating summary: " + exp.getMessage());
            throw new RuntimeException(exp.getMessage());
        }
    }

    public String generateSummaryForRefactorings(String refactorings, Map<String, Integer> refactoringInstances, OpenAiService service) {
        try {
            String prompt = "Act as a prompt optimizer and optimize the following prompt for summary on changes. The prompt is [Given the following list of refactoring changes, generate a clear, concise and COMPLETE message that can contain multiple sentences that summarizes ALL the refactoring changes effectively for people to understand. After the summary, give one line for the intent behind these changes and then give one line on the impact of these changes. Write it in this format: SUMMARY: summary changes, INTENT: intent line, IMPACT: impact line]\n" + refactorings;
            CompletionRequest completionRequest = CompletionRequest.builder()
                    .prompt(prompt)
                    .model("gpt-3.5-turbo-instruct")
                    .maxTokens(300)
                    .build();
            CompletionResult result = service.createCompletion(completionRequest);
            String text = result.getChoices().isEmpty() ? "" : result.getChoices().get(0).getText();

            // Build instructions string from refactoringInstances
            StringBuilder instructions = new StringBuilder();
            for (Map.Entry<String, Integer> entry : refactoringInstances.entrySet()) {
                instructions.append(entry.getValue()).append(" ").append(entry.getKey()).append("  ");
            }
            return text + " INSTRUCTION: " + instructions.toString();
        } catch (Exception exp) {
            System.err.println("Error generating summary: " + exp.getMessage());
            throw new RuntimeException(exp.getMessage());
        }
    }
}
