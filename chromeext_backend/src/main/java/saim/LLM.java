package saim;

import com.theokanning.openai.completion.CompletionRequest;
import com.theokanning.openai.completion.CompletionResult;
import com.theokanning.openai.service.OpenAiService;

import java.util.Map;

public class LLM {
    public String generateSummaryForNoRefactorings(String fullUrl, OpenAiService service) {
        try {
            String prompt = "You are an AI software engineering assistant. Generate a structured commit message emphasizing internal and external quality improvements. " +
                    "Extract key changes and categorize them using the following format:\n\n" +
                    "- **SUMMARY:** Concise and technical description of changes.\n" +
                    "- **INTENT:** Categorize intent as one of: Fixed Bug, Improved Internal Quality, Improved External Quality, Feature Update, Code Smell Resolution.\n" +
                    "- **IMPACT:** Explain how this change improves maintainability, performance, readability, security, or another relevant factor.\n" +
                    "\nURL: " + fullUrl + "\n\n" +
                    "Example:\n" +
                    "- **SUMMARY:** Optimized data processing by replacing nested loops with a hash-based lookup in `DataProcessor.java`.\n" +
                    "- **INTENT:** Improved Internal Quality.\n" +
                    "- **IMPACT:** Enhanced maintainability and efficiency by reducing time complexity from O(n^2) to O(n).\n";

            CompletionRequest completionRequest = CompletionRequest.builder()
                    .prompt(prompt)
                    .model("gpt-3.5-turbo-instruct")
                    .maxTokens(300)
                    .build();
            CompletionResult result = service.createCompletion(completionRequest);
            String text = result.getChoices().isEmpty() ? "" : result.getChoices().get(0).getText();
            return validateLLMOutput(text) + " INSTRUCTION: No Refactoring Detected";
        } catch (Exception exp) {
            System.err.println("Error generating summary: " + exp.getMessage());
            throw new RuntimeException(exp.getMessage());
        }
    }

    public String generateSummaryForRefactorings(String refactorings, Map<String, Integer> refactoringInstances, OpenAiService service) {
        try {
            String prompt = "You are an AI software engineering assistant. Summarize refactoring changes with a focus on internal and external quality improvements. " +
                    "Extract key refactorings and align them with impact categories.\n\n" +
                    "Format:\n" +
                    "- **SUMMARY:** Concise and technical summary of refactoring.\n" +
                    "- **INTENT:** Categorize intent as one of: Fixed Bug, Improved Internal Quality, Improved External Quality, Feature Update, Code Smell Resolution.\n" +
                    "- **IMPACT:** Explain how the refactoring improves maintainability, modularity, testability, readability, or another quality factor.\n" +
                    "\nRefactorings:\n" + refactorings + "\n\n" +
                    "Example:\n" +
                    "- **SUMMARY:** Extracted `processData()` method from `analyzeLogs()` to reduce function complexity.\n" +
                    "- **INTENT:** Improved Internal Quality.\n" +
                    "- **IMPACT:** Enhances modularity, improves testability, and reduces code duplication.\n";

            CompletionRequest completionRequest = CompletionRequest.builder()
                    .prompt(prompt)
                    .model("gpt-3.5-turbo-instruct")
                    .maxTokens(300)
                    .build();
            CompletionResult result = service.createCompletion(completionRequest);
            String text = result.getChoices().isEmpty() ? "" : result.getChoices().get(0).getText();

            // Build structured instructions from refactoringInstances
            StringBuilder instructions = new StringBuilder();
            for (Map.Entry<String, Integer> entry : refactoringInstances.entrySet()) {
                instructions.append(entry.getValue()).append(" ").append(entry.getKey()).append("  ");
            }
            return validateLLMOutput(text) + " INSTRUCTION: " + instructions.toString();
        } catch (Exception exp) {
            System.err.println("Error generating summary: " + exp.getMessage());
            throw new RuntimeException(exp.getMessage());
        }
    }

    private String validateLLMOutput(String llmOutput) {
        if (!llmOutput.contains("INTENT:")) {
            llmOutput += "\nINTENT: Code Smell Resolution"; // Fallback intent
        }
        if (!llmOutput.contains("IMPACT:")) {
            llmOutput += "\nIMPACT: Improved readability and maintainability"; // Default impact
        }
        return llmOutput;
    }
}
