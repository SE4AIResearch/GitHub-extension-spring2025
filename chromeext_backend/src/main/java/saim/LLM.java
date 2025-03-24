package saim;

import com.theokanning.openai.completion.CompletionChoice;
import com.theokanning.openai.completion.CompletionRequest;
import com.theokanning.openai.completion.CompletionResult;
import com.theokanning.openai.service.OpenAiService;

import java.util.List;
import java.util.Map;

public class LLM {

    public String buildPromptFromURL(String fullUrl) {
        String prompt = "You are an expert software engineer trained in commit summarization.\n" +
                "Given a code diff or commit URL, go through the entire changes, and extract a meaningful summary using this structure. If the url is given go the URL and extract information:\n" +
                "\n" +
                "MANDATORY FORMAT:\n" +
                "SUMMARY: A concise technical description of the change (1–2 lines max), " +
                "INTENT: One of: Fixed Bug, Improved Internal Quality, Improved External Quality, Feature Update, Code Smell Resolution, " +
                "IMPACT: Describe how this affects performance, maintainability, readability, modularity, or usability, " +
                "\n" +
                "You MUST include all three sections. Always use the specified keywords for INTENT.\n" +
                "\n" +
                "Here is an example before and after your improvements:\n" +
                "\n" +
                "Example:\n" +
                "SUMMARY: Replaced nested loops with a hash-based lookup in UserProcessor.java.\n" +
                "INTENT: Improved Internal Quality.\n" +
                "IMPACT: Reduced time complexity from O(n^2) to O(n), improving efficiency and code clarity.\n" +
                "\n" +
                "Now, generate the structured summary for:\n" +
                "URL: " + fullUrl;

        return prompt;
    }

    public String buildPromptFromRefactorings(String refactorings) {
        String prompt = "You are an AI software engineer trained in code refactoring analysis and commit summarization.\n" +
                "You are given a list of refactorings extracted from a commit. Create a concise summary that includes:\n" +
                "\n" +
                "SUMMARY: Describe the core refactorings made (1–2 lines),\n" +
                "INTENT: Choose from: Fixed Bug, Improved Internal Quality, Improved External Quality, Feature Update, Code Smell Resolution,\n" +
                "IMPACT: Explain how these changes improve modularity, maintainability, readability, or other software quality attributes,\n" +
                "\n" +
                "MANDATORY FORMAT:\n" +
                "SUMMARY: A concise technical description of the change (1–2 lines max)," +
                "INTENT: One of: Fixed Bug, Improved Internal Quality, Improved External Quality, Feature Update, Code Smell Resolution," +
                "IMPACT: Explain how these changes improve modularity, maintainability, readability, or other software quality attributes. And also describe how this affects performance, maintainability, readability, modularity, or usability," +
                "\n" +
                "Example:\n" +
                "SUMMARY: Extracted method validateInput() and renamed CustomerDTO to ClientDTO,\n" +
                "INTENT: Improved Internal Quality,\n" +
                "IMPACT: Reduced time complexity from O(n^2) to O(n), improving efficiency and code clarity or Improves code modularity and naming clarity for better long-term maintainability,\n" +
                "\n" +
                "Refactorings:\n" + refactorings;

        return prompt;
    }


    public String generateSummaryForNoRefactorings(String fullUrl, OpenAiService service) {
        System.out.println("Generating summary for no refactorings");
        try {
//            String prompt = "Act as a prompt optimizer and optimize the following prompt for summary on changes. The prompt is [Given the following url, generate a clear, concise and COMPLETE message that is 1-2 sentences that summarizes the changes in the code for people to understand. After the summary, give one line for the motivation behind these changes and then give one line on the impact of these changes. Write it in this format: SUMMARY: summary changes, INTENT: intent line, IMPACT: impact line]\n" + fullUrl;
            String prompt = buildPromptFromURL(fullUrl);
            System.out.println(prompt);
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
        System.out.println("Generating summary for refactorings");
        try {
//            String prompt = "Act as a prompt optimizer and optimize the following prompt for summary on changes. The prompt is [Given the following list of refactoring changes, generate a clear, concise and COMPLETE message that can contain multiple sentences that summarizes ALL the refactoring changes effectively for people to understand. After the summary, give one line for the intent behind these changes and then give one line on the impact of these changes. Write it in this format: SUMMARY: summary changes, INTENT: intent line, IMPACT: impact line]\n" + refactorings;
            String prompt = buildPromptFromRefactorings(refactorings);
            CompletionRequest completionRequest = CompletionRequest.builder()
                    .prompt(prompt)
                    .model("gpt-3.5-turbo-instruct")
                    .maxTokens(600)
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
