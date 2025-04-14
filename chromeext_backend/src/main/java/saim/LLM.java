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
                "SUMMARY: A concise technical description of the change (1–2 lines max), " +
                "INTENT: All the ones which apply: Fixed Bug, Improved Internal Quality, Improved External Quality, Feature Update, Code Smell Resolution, " +
                "IMPACT: Describe how this affects performance, maintainability, readability, modularity, or usability.\n" +
                "\n" +
                "You MUST include all three sections. Always use the specified keywords for INTENT.\n" +
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
