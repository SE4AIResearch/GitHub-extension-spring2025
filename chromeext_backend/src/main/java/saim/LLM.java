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
                "INTENT: All the ones which apply: Fixed Bug, Improved Internal Quality, Improved External Quality, Feature Update, and Code Smell Resolution.  You can also find other intenets in the code. Also point out the reason for the intent in the code." +
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
                "INTENT: Improved Internal Quality, Fixed Bug(in the UserProcessor.java line 12)\n" +
                "IMPACT: Reduced time complexity from O(n^2) to O(n), improving efficiency and code clarity.\n" +
                "\n" +
                "Example 2:\n" +
                "SUMMARY: Fixed null pointer exception in PaymentService.java during refund processing.\n" +
                "INTENT: Fixed Bug (in PaymentService.java line 127)\n" +
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
                "INTENT: Code Smell Resolution (due the update method in DataProcessor.java), Improved Internal Quality\n" +
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
                "INTENT: Give a software change classification such as Fixed Bug, Internal Quality Improvement, External Quality Improvement, Feature Update, Code Smell Resolution, Refactoring, Performance Optimization, Security Patch, Test Addition, Test Update, Test Removal, Logging Improvement, Dependency Update, Documentation Update, UI/UX Enhancement. Don't be limited to this list. You can also find other classification in the code. Use parent format also Corrective, Perfective, Preventive, and Adaptive" +
                "IMPACT: Explain how the change affects software quality. Use software engineering concepts such as: reduced cyclomatic complexity, improved cohesion, " +
                "decreased coupling, better adherence to SRP/OCP, enhanced testability, or improved abstraction layering. Do not use vague terms like 'maintainability' or 'readability' without tying them to specific code behaviors or design principles.\n\n" +

                "You MUST include all three sections. Always use the provided INTENT terms. Connect the IMPACT to both the SUMMARY and INTENT using concrete software reasoning.\n\n" +

                "EXAMPLES:\n\n" +

                "Example 1:\n" +
                "SUMMARY: Replaced nested loop in UserProcessor.java with a Map<String, User> lookup. Added early exit logic to validateUserBatch().\n" +
                "INTENT: Adaptive: Performance Optimization, Code Simplification\n" +
                "IMPACT: Reduced time complexity from O(n²) to O(n), improving execution for large inputs. Used guard clauses and data structure optimization to align with efficient control flow and low-complexity design principles.\n\n" +

                "Example 2:\n" +
                "SUMMARY: Extracted credential validation logic into AuthService and introduced LoginRequest/Response DTOs.\n" +
                "INTENT: Perfective: Internal Quality Improvement, Preventive: Architectural Refactoring\n" +
                "IMPACT: Applied SRP by isolating responsibilities and improved cohesion within business logic layers. Reduced controller-service coupling, increasing testability and layering integrity.\n\n" +

                "Example 3:\n" +
                "SUMMARY: Integrated pagination using Spring Data’s Pageable in UserRequestController.\n" +
                "INTENT: Perfective: External Quality Improvement, Adaptive: Feature Update\n" +
                "IMPACT: Improved modularity and frontend responsiveness by reducing payload size. Supports lazy loading and aligns with ISO/IEC 25010 responsiveness and functional suitability metrics.\n\n" +

                "Example 4:\n" +
                "SUMMARY: Replaced switch-case structure in PermissionsManager with polymorphic handlers.\n" +
                "INTENT: Perfective: Code Smell Resolution\n" +
                "IMPACT: Eliminated type-checking smell by encapsulating behavior polymorphically. Reduced conditional logic complexity and applied Strategy pattern as per Refactoring.Guru.\n\n" +

                "Example 5:\n" +
                "SUMMARY: Introduced batch inserts in OrderRepository to replace per-record inserts.\n" +
                "INTENT: Perfective: Performance Optimization\n" +
                "IMPACT: Reduced round trips and improved transactional throughput. Optimized data persistence following performance tuning principles for database operations.\n\n" +

                "Example 6:\n" +
                "SUMMARY: Migrated user auth from monolith to OAuth2-based service. Configured token validation with service registry integration.\n" +
                "INTENT: Preventive: Architectural Refactoring\n" +
                "IMPACT: Enabled clean separation of concerns and horizontal scalability by isolating authentication. Aligned architecture with microservices and domain-driven design.\n\n" +

                "Example 7:\n" +
                "SUMMARY: Created PyTest suite to validate reconciliation edge cases, covering duplicate detection and currency rounding.\n" +
                "INTENT: Test Enhancement\n" +
                "IMPACT: Improved edge coverage and defect isolation. Aligned with test-first practices and boosted defect detection rates in CI through targeted regression testing.\n\n" +

                "Example 8:\n" +
                "SUMMARY: Refactored controller to delegate report downloads to ReportService. Removed file streaming logic from controller layer.\n" +
                "INTENT: External Quality Improvement\n" +
                "IMPACT: Reduced coupling and improved abstraction boundaries. Enhanced external quality by aligning responsibilities with modular service-oriented architecture.\n\n" +
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


    public String generateSummaryForNoRefactorings(String fullUrl, String repoUrl, OpenAiService service, String aiToken) {
        System.out.println("Generating summary for no refactorings");

        System.out.println("🔄 Sending request to: http://chromeext-metrics:8000/get-response");
        System.out.println("With token: Bearer " + aiToken);
        
        try {
            String prompt = buildPromptFromRefactorings(fullUrl);

            JsonObject json = new JsonObject();
            json.addProperty("query", fullUrl);
            json.addProperty("userag", false);
            json.addProperty("git_url", repoUrl);
            String jsonRequestBody = json.toString();
            System.out.println(jsonRequestBody);

            HttpClient client = HttpClient.newBuilder()
                    .version(HttpClient.Version.HTTP_1_1)
                    .build();
                
            URI uri = new URI("http", null, "chromeext-metrics", 8000, "/get-response", null, null);


            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("localhost:8000/get-response"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer "+aiToken)
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

    public String generateSummaryForRefactorings(String refactorings, Map<String, Integer> refactoringInstances, String repoUrl, String commitUrl, String aiToken) {
        System.out.println("Generating summary for refactorings");

        System.out.println("🔄 Sending request to: http://chromeext-metrics:8000/get-response");
        System.out.println("With token: Bearer " + aiToken);
        try {
            String prompt = buildPromptFromRefactorings(refactorings);

            JsonObject json = new JsonObject();
            json.addProperty("query", prompt);
            json.addProperty("userag", true);
            json.addProperty("git_url", repoUrl);
            json.addProperty("commit_url", commitUrl);
            String jsonRequestBody = json.toString();
            System.out.println(jsonRequestBody);

            HttpClient client = HttpClient.newBuilder()
                    .version(HttpClient.Version.HTTP_1_1)
                    .build();

            URI uri = new URI("http", null, "chromeext-metrics", 8000, "/get-response", null, null);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(uri)
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer "+aiToken)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonRequestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            System.out.println(" Response status code: " + response.statusCode());
            System.out.println(" Response body: " + response.body());

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
            //throw new RuntimeException(exp.getMessage());
            return exp.getMessage();
        }
    }
}
