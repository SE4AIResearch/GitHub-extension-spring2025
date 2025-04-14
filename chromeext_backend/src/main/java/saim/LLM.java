package saim;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

import org.json.JSONObject;

import com.google.gson.JsonObject;
import com.theokanning.openai.service.OpenAiService;


public class LLM {

    public String buildPromptFromURL(String fullUrl) {
        System.out.println("Building prompt from " + fullUrl);
        String prompt = "You are an expert software engineer trained in commit summarization.\n" +
                "Given a code diff or commit URL, go through the entire changes, and extract a meaningful summary using this structure. If the URL is provided, go to the URL and extract information from the webpage:\n" +
                "\n" +
                "MANDATORY FORMAT:\n" +
                "SUMMARY: A concise technical description of the change (1–2 lines max), " +
                "INTENT: All the ones which apply: Fixed Bug, Improved Internal Quality, Improved External Quality, Feature Update, Code Smell Resolution, " +
                "IMPACT: Describe how this affects performance, maintainability, readability, modularity, or usability.\n" +
                "\n" +
                "You MUST include all three sections. Always use the specified keywords for INTENT.\n" +
                "\n" +
                "Also, specify what information came from the URL and include the URL itself.\n" +
                "\n" +
                "Here are some examples before and after your improvements:\n" +
                "\n" +
                "Example 1:\n" +
                "SUMMARY: Replaced nested loops with a hash-based lookup in UserProcessor.java.\n" +
                "INTENT: Improved Internal Quality, Fixed Bug\n" +
                "IMPACT: Reduced time complexity from O(n^2) to O(n), improving efficiency and code clarity.\n" +
                "\n" +
                "Example 2:\n" +
                "SUMMARY: Fixed null pointer exception in PaymentService.java during refund processing.\n" +
                "INTENT: Fixed Bug\n" +
                "IMPACT: Enhanced system stability by preventing crashes and improving error handling.\n" +
                "\n" +
                "Example 3:\n" +
                "SUMMARY: Refactored the login module to adopt MVC architecture in AuthenticationController.java.\n" +
                "INTENT: Improved Internal Quality, Code Smell Resolution\n" +
                "IMPACT: Increased maintainability and readability by separating concerns and simplifying future modifications.\n" +
                "\n" +
                "Example 4:\n" +
                "SUMMARY: Updated API endpoint to support pagination in user request listings.\n" +
                "INTENT: Feature Update, Improved External Quality\n" +
                "IMPACT: Improved usability and performance by reducing response times and enhancing navigation.\n" +
                "\n" +
                "Example 5:\n" +
                "SUMMARY: Removed redundant code and improved variable naming in DataProcessor.java.\n" +
                "INTENT: Code Smell Resolution, Improved Internal Quality\n" +
                "IMPACT: Enhanced readability and maintainability by reducing code clutter and clarifying functionality.\n" +
                "\n" +
                "Example 6:\n" +
                "SUMMARY: Enhanced error messages in the user interface for better clarity during failures.\n" +
                "INTENT: Improved External Quality\n" +
                "IMPACT: Improved user experience by providing actionable information during errors.\n" +
                "\n" +
                "Now, generate the structured summary for:\n" +
                "URL: " + fullUrl;



        return prompt;
    }



    public String buildPromptFromRefactorings(String refactorings) {
//        String prompt = "You are an AI software engineer trained in code refactoring analysis and commit summarization.\n" +
//                "You are given a list of refactorings extracted from a commit. Create a concise summary that includes:\n" +
//                "\n" +
//                "SUMMARY: Describe the core refactorings made (1–2 lines),\n" +
//                "INTENT: All the ones which apply: Fixed Bug, Improved Internal Quality, Improved External Quality, Feature Update, Code Smell Resolution,\n" +
//                "IMPACT: Explain how these changes improve modularity, maintainability, readability, or other software quality attributes,\n" +
//
//                "Refactorings:\n" + refactorings;

        String prompt = "You are an expert software engineer trained in commit summarization.\n" +
                "Given a code refactorings, go through the entire changes, and extract a meaningful summary using this structure:\n" +
                "\n" +
                "MANDATORY FORMAT:\n" +
                "SUMMARY: A in-depth technical description of the change (2-3 lines max), " +
                "INTENT: All the ones which apply: Fixed Bug, Improved Internal Quality, Improved External Quality, Feature Update, Code Smell Resolution, " +
                "IMPACT: Describe how this affects performance, maintainability, readability, modularity, or usability more in depth and related to the code changes, the summary generated, and the intent.\n" +
                "\n" +
                "You MUST include all three sections. Always use the specified keywords for INTENT.\n" +
                "\n" +
                "Here are some examples before and after your improvements:\n" +
                "\n" +
                "Example 1:\n" +
                "SUMMARY: Replaced nested loop in UserProcessor.java with a HashMap<String, User> for O(1) user lookups. " +
                "Modified UserValidator.java to skip invalid entries early. Added testProcessUsers_withValidAndInvalidIds() " +
                "in UserProcessorTest.java to validate edge behavior and ensure consistent output.\n" +
                "INTENT: Improved Internal Quality, Fixed Bug\n" +
                "IMPACT: Eliminated redundant iterations during user reconciliation, cutting execution time in half for large datasets. " +
                "Made UserProcessor deterministic and easier to reason about.\n\n" +

                "Example 2:\n" +
                "SUMMARY: Added null checks for TransactionMetadata in PaymentService.java. " +
                "Refactored RefundController.java to perform request validation before invoking the service. " +
                "Created testNullTransactionMetadata_handling() in PaymentServiceTest.java to verify fallback behavior.\n" +
                "INTENT: Fixed Bug\n" +
                "IMPACT: Prevented NullPointerException during refund calls when metadata is missing, making the refund flow safe and fault-tolerant. " +
                "Improved input validation at the controller level.\n\n" +

                "Example 3:\n" +
                "SUMMARY: Extracted business logic from AuthenticationController.java to AuthService.java. " +
                "Introduced LoginRequest and LoginResponse DTOs to formalize input/output structures. " +
                "Added testSuccessfulLogin() and testInvalidCredentials() in AuthServiceTest.java.\n" +
                "INTENT: Improved Internal Quality, Code Smell Resolution\n" +
                "IMPACT: Reduced controller complexity by 60%, enabling isolated service testing. " +
                "Decoupling logic improved test reliability and reduced future regression risk in the login flow.\n\n" +

                "Example 4:\n" +
                "SUMMARY: Integrated Spring Data Pageable in UserRequestController.java to support pagination. " +
                "Updated UserRequestRepository.java to use Page<UserRequest> for backend efficiency. " +
                "Created testPaginatedUserRequestResults() in UserRequestServiceTest.java.\n" +
                "INTENT: Feature Update, Improved External Quality\n" +
                "IMPACT: Reduced response payload size and improved database query performance by using indexed paging. " +
                "Enhanced backend scalability for high-volume user queries.\n\n" +

                "Example 5:\n" +
                "SUMMARY: Removed deprecated normalizeData() and oldTransform() from DataProcessor.java. " +
                "Renamed cryptic variables like x1 → rawInputLine in DataParser.java. " +
                "Added testCleanDataTransformation() in DataProcessorTest.java to validate outputs.\n" +
                "INTENT: Code Smell Resolution, Improved Internal Quality\n" +
                "IMPACT: Improved comprehension and maintainability by eliminating misleading code paths. " +
                "Refactor reduced onboarding time for new devs and lowered risk of reintroducing legacy bugs.\n\n" +

                "Example 6:\n" +
                "SUMMARY: Refined backend error mapping in ErrorHandler.java for known error codes. " +
                "Updated UIErrorComponent.jsx to show contextual error alerts. " +
                "Added testErrorMessageMapping() in ErrorHandlerTest.java to verify proper user-facing descriptions.\n" +
                "INTENT: Improved External Quality\n" +
                "IMPACT: Increased frontend reliability during API failures, reducing confusion around ambiguous errors. " +
                "Enhanced error granularity allows better debugging and faster support response." +
                "\n" +
                "Example 6:\n" +
                "SUMMARY: Enhanced error messages in the user interface for better clarity during failures.\n" +
                "INTENT: Improved External Quality\n" +
                "IMPACT: Improved user experience by providing actionable information during errors.\n" +
                "\n" +
                "Now, generate the structured summary for:\n" +
               "Refactorings:\n" + refactorings;

        System.out.println(prompt);

        return prompt;
    }

    private String escapeJson(String text) {
        if (text == null) {
            return "";
        }
        return text.replace("\"", "\\\"");
    }


    public String generateSummaryForNoRefactorings(String fullUrl, OpenAiService service) {
        System.out.println("Generating summary for no refactorings");
        
        try {
            String prompt = buildPromptFromRefactorings(fullUrl);

            JsonObject json = new JsonObject();
            json.addProperty("query", fullUrl);
            json.addProperty("userag", false);
            String jsonRequestBody = json.toString();
            System.out.println(jsonRequestBody);

            HttpClient client = HttpClient.newBuilder()
                    .version(HttpClient.Version.HTTP_1_1)
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://127.0.0.1:8000/get-response"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonRequestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            JSONObject jsonResponse = new JSONObject(response.body());
            String generatedText = jsonResponse.optString("response_with_cs", ""); 
            return generatedText;

        }catch (Exception exp) {
            System.err.println("Error generating summary: " + exp.getMessage());
            throw new RuntimeException(exp.getMessage());
        }          

    }

    public String generateSummaryForRefactorings(String refactorings, Map<String, Integer> refactoringInstances) {
        System.out.println("Generating summary for refactorings");
        try {
            String prompt = buildPromptFromRefactorings(refactorings);

            JsonObject json = new JsonObject();
            json.addProperty("query", prompt);
            json.addProperty("userag", true);
            String jsonRequestBody = json.toString();
            System.out.println(jsonRequestBody);

            HttpClient client = HttpClient.newBuilder()
                    .version(HttpClient.Version.HTTP_1_1)
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://127.0.0.1:8000/get-response"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonRequestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            JSONObject jsonResponse = new JSONObject(response.body());
            String generatedText = jsonResponse.optString("response_with_cs", "");

            StringBuilder instructions = new StringBuilder();
            for (Map.Entry<String, Integer> entry : refactoringInstances.entrySet()) {
                instructions.append(entry.getValue())
                        .append(" ")
                        .append(entry.getKey())
                        .append("  ");
            }

            return generatedText + " INSTRUCTION: " + instructions.toString();
        } catch (Exception exp) {
            System.err.println("Error generating summary: " + exp.getMessage());
            throw new RuntimeException(exp.getMessage());
        }
    }
}
