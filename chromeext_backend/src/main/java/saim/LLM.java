package saim;

import com.theokanning.openai.completion.CompletionChoice;
import com.theokanning.openai.completion.CompletionRequest;
import com.theokanning.openai.completion.CompletionResult;
import com.theokanning.openai.service.OpenAiService;

import java.util.List;
import java.util.Map;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class LLM {

    public String buildPromptFromURL(String fullUrl) {
        System.out.println("Building prompt from " + fullUrl);
        String prompt = "You are an expert software engineer trained in commit summarization.\n" +
                "Given a code diff or commit URL, go through the entire changes, and extract a meaningful summary using this structure. If the URL is provided, go to the URL and extract information from the webpage:\n" +
                "\n" +
                "MANDATORY FORMAT:\n" +
                "SUMMARY: A concise technical description of the change (1–2 lines max), " +
                "INTENT: One of: Fixed Bug, Improved Internal Quality, Improved External Quality, Feature Update, Code Smell Resolution, " +
                "IMPACT: Describe how this affects performance, maintainability, readability, modularity, or usability.\n" +
                "\n" +
                "You MUST include all three sections. Always use the specified keywords for INTENT.\n" +
                "\n" + "Also what infomration came from the url and the url itself \n" +
                "Here are some examples before and after your improvements:\n" +
                "\n" +
                "Example 1:\n" +
                "SUMMARY: Replaced nested loops with a hash-based lookup in UserProcessor.java.\n" +
                "INTENT: Improved Internal Quality.\n" +
                "IMPACT: Reduced time complexity from O(n^2) to O(n), improving efficiency and code clarity.\n" +
                "\n" +
                "Example 2:\n" +
                "SUMMARY: Fixed null pointer exception in PaymentService.java during refund processing.\n" +
                "INTENT: Fixed Bug.\n" +
                "IMPACT: Enhanced system stability by preventing crashes and improving error handling.\n" +
                "\n" +
                "Example 3:\n" +
                "SUMMARY: Refactored the login module to adopt MVC architecture in AuthenticationController.java.\n" +
                "INTENT: Improved Internal Quality.\n" +
                "IMPACT: Increased maintainability and readability by separating concerns and simplifying future modifications.\n" +
                "\n" +
                "Example 4:\n" +
                "SUMMARY: Updated API endpoint to support pagination in user request listings.\n" +
                "INTENT: Feature Update.\n" +
                "IMPACT: Improved usability and performance by reducing response times and enhancing navigation.\n" +
                "\n" +
                "Example 5:\n" +
                "SUMMARY: Removed redundant code and improved variable naming in DataProcessor.java.\n" +
                "INTENT: Code Smell Resolution.\n" +
                "IMPACT: Enhanced readability and maintainability by reducing code clutter and clarifying functionality.\n" +
                "\n" +
                "Example 6:\n" +
                "SUMMARY: Enhanced error messages in the user interface for better clarity during failures.\n" +
                "INTENT: Improved External Quality.\n" +
                "IMPACT: Improved user experience by providing actionable information during errors.\n" +
                "\n" +
                "Now, generate the structured summary for:\n" +
                "URL: " + fullUrl;


        return prompt;
    }

//    public String buildPromptFromURL(String fullUrl) {
//        System.out.println("Building prompt from " + fullUrl);
//        String webpageContent = "";
//
//        // Fetch the HTML content from the fullUrl
//        try {
//            URL url = new URL(fullUrl);
//            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
//            connection.setRequestMethod("GET");
//
//            BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));
//            StringBuilder htmlContent = new StringBuilder();
//            String inputLine;
//            while ((inputLine = in.readLine()) != null) {
//                htmlContent.append(inputLine).append("\n");
//            }
//            in.close();
//            webpageContent = htmlContent.toString();
//        } catch (Exception e) {
//            System.err.println("Error fetching webpage content: " + e.getMessage());
//            webpageContent = "Error fetching webpage content: " + e.getMessage();
//        }
//
//        // Build the prompt including the webpage HTML content
//        String prompt = "You are an expert software engineer trained in commit summarization.\n" +
//                "Given a code diff or commit URL, go through the entire changes, and extract a meaningful summary using this structure. " +
//                "If the URL is provided, go to the URL, extract information from the webpage (HTML), and include that information along with the URL:\n" +
//                "\n" +
//                "MANDATORY FORMAT:\n" +
//                "SUMMARY: A concise technical description of the change (1–2 lines max), " +
//                "INTENT: One of: Fixed Bug, Improved Internal Quality, Improved External Quality, Feature Update, Code Smell Resolution, " +
//                "IMPACT: Describe how this affects performance, maintainability, readability, modularity, or usability.\n" +
//                "\n" +
//                "You MUST include all three sections. Always use the specified keywords for INTENT.\n" +
//                "\n" +
//                "Also include the information extracted from the webpage (HTML content) and the URL itself.\n" +
//                "\n" +
//                "Here are some examples before and after your improvements:\n" +
//                "\n" +
//                "Example 1:\n" +
//                "SUMMARY: Replaced nested loops with a hash-based lookup in UserProcessor.java.\n" +
//                "INTENT: Improved Internal Quality.\n" +
//                "IMPACT: Reduced time complexity from O(n^2) to O(n), improving efficiency and code clarity.\n" +
//                "\n" +
//                "Example 2:\n" +
//                "SUMMARY: Fixed null pointer exception in PaymentService.java during refund processing.\n" +
//                "INTENT: Fixed Bug.\n" +
//                "IMPACT: Enhanced system stability by preventing crashes and improving error handling.\n" +
//                "\n" +
//                "Example 3:\n" +
//                "SUMMARY: Refactored the login module to adopt MVC architecture in AuthenticationController.java.\n" +
//                "INTENT: Improved Internal Quality.\n" +
//                "IMPACT: Increased maintainability and readability by separating concerns and simplifying future modifications.\n" +
//                "\n" +
//                "Example 4:\n" +
//                "SUMMARY: Updated API endpoint to support pagination in user request listings.\n" +
//                "INTENT: Feature Update.\n" +
//                "IMPACT: Improved usability and performance by reducing response times and enhancing navigation.\n" +
//                "\n" +
//                "Example 5:\n" +
//                "SUMMARY: Removed redundant code and improved variable naming in DataProcessor.java.\n" +
//                "INTENT: Code Smell Resolution.\n" +
//                "IMPACT: Enhanced readability and maintainability by reducing code clutter and clarifying functionality.\n" +
//                "\n" +
//                "Example 6:\n" +
//                "SUMMARY: Enhanced error messages in the user interface for better clarity during failures.\n" +
//                "INTENT: Improved External Quality.\n" +
//                "IMPACT: Improved user experience by providing actionable information during errors.\n" +
//                "\n" +
//                "Now, generate the structured summary for:\n" +
//                "URL: " + fullUrl + "\n" +
//                "\n" +
//                "Webpage HTML Content:\n" + webpageContent;
//
//        return prompt;
//    }


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
                    .maxTokens(600)
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
