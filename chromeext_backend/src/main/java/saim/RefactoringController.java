package saim;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.storage.file.FileRepositoryBuilder;
import org.kohsuke.github.GitHub;
import org.kohsuke.github.GitHubBuilder;

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

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.ChatCompletion;
import com.openai.models.ChatCompletionCreateParams;
import com.openai.models.ChatModel;

@RestController
public class RefactoringController {
    /*
     * REmoving the env variable for openai api key 
     */
    //private static final String aitoken = System.getenv("OPENAI_API_KEY");

    @Autowired
    private ApiKeyRepo apiKeyRepo;

    @Autowired
    private CommitService cService;
    private final AtomicLong counter = new AtomicLong();

    public String returnrefs(String url, String id, String uuid) 
    {
        // Clean up the commit ID - remove any URL fragments
        if (id.contains("#")) {
            id = id.substring(0, id.indexOf("#"));
            System.out.println("Cleaned commit ID: " + id);
        }
        
        // Fetching OpenAI API key from database
        Optional<ApiKey> apiKeyOpt = apiKeyRepo.findByUuid(uuid);
        if (apiKeyOpt.isEmpty()) {
            throw new RuntimeException("API key not found for UUID: " + uuid);
        }
        
        ApiKey apiKey = apiKeyOpt.get();
        String aitoken = apiKey.getOpenaiLlmApiKey();
        
        if (aitoken == null || aitoken.isBlank()) {
            throw new RuntimeException("OpenAI API key not configured");
        }

        String fullurl = url + "/commit/" + id;
        System.out.println("Processing URL: " + fullurl);

        StringBuilder refactoringMessages = new StringBuilder();
        HashMap<String, Integer> refactoringinstances = new HashMap<>();

        try {
            // Format repository URL for Git operations
            String repoUrl = url;
            if (!repoUrl.endsWith(".git")) {
                repoUrl = repoUrl + ".git";
            }
            
            // Get GitHub token from the database
            String githubToken = apiKey.getGithubApiKey();
            if (githubToken == null || githubToken.isBlank()) {
                throw new RuntimeException("GitHub API token not configured");
            }
            
            System.out.println("Using GitHub token for authentication");
            
            /*  
            * Setting up GitHub authentication using 3 approaches to ensure it works
            * 1. Set the standard system property
            */
            System.setProperty("github.oauth", githubToken);
            
            // 2. Set environment variables that might be used by various libraries
            // Using reflection to modify environment variables
            try {
                Class<?> processEnvironmentClass = Class.forName("java.lang.ProcessEnvironment");
                java.lang.reflect.Field theEnvironmentField = processEnvironmentClass.getDeclaredField("theEnvironment");
                theEnvironmentField.setAccessible(true);
                @SuppressWarnings("unchecked")
                Map<String, String> env = (Map<String, String>) theEnvironmentField.get(null);
                env.put("GITHUB_OAUTH", githubToken);
                env.put("GITHUB_TOKEN", githubToken);
            } catch (Exception e) {
                System.err.println("Could not set environment variables: " + e.getMessage());
            }
            
            // 3. Testing the authentication directly
            try {
                // Initializing the GitHub API directly
                GitHub github = new GitHubBuilder().withOAuthToken(githubToken).build();
                // Testing the connection
                String username = github.getMyself().getLogin();
                System.out.println("Successfully authenticated as GitHub user: " + username);
            } catch (Exception e) {
                System.err.println("Warning: GitHub API authentication test failed: " + e.getMessage());
            }
            
            // Now, initializing RefactoringMiner API
            GitHistoryRefactoringMinerImpl miner = new GitHistoryRefactoringMinerImpl();
            
            // Trying to directly set the token in RefactoringMiner using reflection
            try {
                System.out.println("Attempting to directly set GitHub token in RefactoringMiner");
                // Finding the field that holds the GitHub instance
                java.lang.reflect.Field githubField = GitHistoryRefactoringMinerImpl.class.getDeclaredField("gitHub");
                githubField.setAccessible(true);
                
                // Create a new GitHub instance with token
                GitHub authorizedGitHub = new GitHubBuilder().withOAuthToken(githubToken).build();
                
                // Replace the existing GitHub instance
                githubField.set(miner, authorizedGitHub);
                System.out.println("Successfully injected authenticated GitHub instance into RefactoringMiner");
            } catch (Exception e) {
                System.err.println("Could not directly set GitHub token in RefactoringMiner: " + e.getMessage());
            }
            
            System.out.println("Attempting to analyze commit using GitHub API");
            boolean apiSuccess = false;
            
            try {
                final boolean[] refactoringsFound = {false};
                
                miner.detectAtCommit(repoUrl, id, new RefactoringHandler() {
                    @Override
                    public void handle(String commitId, List<Refactoring> refactorings) {
                        System.out.println("Found " + refactorings.size() + " refactorings");
                        
                        // if any refactorings are detected
                        if (!refactorings.isEmpty()) {
                            refactoringsFound[0] = true;
                        }
                        
                        int x = 1;
                        for (Refactoring ref : refactorings) {
                            refactoringMessages.append(x + ". " + ref.toString() + "\n");
                            System.out.println("Refactoring found: " + ref.getRefactoringType());
                            
                            String refType = ref.getRefactoringType().toString();
                            int count = refactoringinstances.containsKey(refType) ? refactoringinstances.get(refType) : 0;
                            refactoringinstances.put(refType, count + 1);
                            x++;
                        }
                    }
                    
                    @Override
                    public void handleException(String commitId, Exception e) {
                        System.err.println("Error detecting refactorings for commit " + commitId);
                        e.printStackTrace();
                        refactoringsFound[0] = false;
                    }
                }, 120);
                
                // Fallback to shallow clone if no refactorings found or oauth issues
                if (refactoringMessages.length() > 0 && refactoringsFound[0]) {
                    apiSuccess = true;
                    System.out.println("Successfully analyzed commit using GitHub API with refactorings found");
                } else {
                    System.out.println("API call completed but no refactorings were found - checking for authentication errors");
                    apiSuccess = false;
                }
            } catch (Exception e) {
                System.err.println("Error analyzing commit with GitHub API: " + e.getMessage());
                apiSuccess = false;
            }

            if (!apiSuccess) {
                System.out.println("GitHub API approach failed - falling back to shallow clone approach");
                
                // Create a temporary directory for repository cloning
                Path tempDir = Files.createTempDirectory("refactoring-clone-");
                File localRepoDir = tempDir.toFile();
                localRepoDir.deleteOnExit(); // Clean up when the JVM exits
                
                System.out.println("Cloning repository to: " + localRepoDir.getAbsolutePath());
                
                // Perform shallow clone (depth=1) of the specific commit
                Git.cloneRepository()
                   .setURI(repoUrl)
                   .setDirectory(localRepoDir)
                   .setCloneAllBranches(false)
                   .setNoCheckout(false)
                   .setDepth(1)
                   .call();
                
                // Fetch the specific commit
                Git git = Git.open(localRepoDir);
                git.fetch()
                   .setRemote("origin")
                   .setRefSpecs("+refs/heads/*:refs/remotes/origin/*", "+refs/tags/*:refs/tags/*", "+refs/*:refs/*", "+" + id + ":" + id)
                   .call();
                
                // Open the repository
                Repository repository = new FileRepositoryBuilder()
                    .setGitDir(new File(localRepoDir, ".git"))
                    .build();
                
                System.out.println("Analyzing commit using local clone: " + id);
                
                // Reset refactoring collections 
                refactoringMessages.setLength(0);
                refactoringinstances.clear();
                
                // Detect refactorings using the local clone
                miner.detectAtCommit(repository, id, new RefactoringHandler() {
                    @Override
                    public void handle(String commitId, List<Refactoring> refactorings) {
                        System.out.println("Found " + refactorings.size() + " refactorings in local clone");
                        
                        int x = 1;
                        for (Refactoring ref : refactorings) {
                            refactoringMessages.append(x + ". " + ref.toString() + "\n");
                            System.out.println("Refactoring found: " + ref.getRefactoringType());
                            
                            String refType = ref.getRefactoringType().toString();
                            int count = refactoringinstances.containsKey(refType) ? refactoringinstances.get(refType) : 0;
                            refactoringinstances.put(refType, count + 1);
                            x++;
                        }
                    }
                    
                    @Override
                    public void handleException(String commitId, Exception e) {
                        System.err.println("Error detecting refactorings for commit " + commitId + " in local clone");
                        e.printStackTrace();
                    }
                }, 120);
                
                // Clean up resources
                repository.close();
                System.out.println("Shallow clone analysis completed successfully");
            }

            String refactorings = refactoringMessages.toString();
            System.out.println("=== Refactoring analysis complete ===");
            System.out.println("Method used: " + (apiSuccess ? "GitHub API direct integration" : "Shallow repository clone"));
            
            if (refactoringinstances.isEmpty()) {
                System.out.println("No refactorings were detected in this commit");
            } else {
                System.out.println("Detected refactorings by type:");
                for (Map.Entry<String, Integer> entry : refactoringinstances.entrySet()) {
                    System.out.println("  - " + entry.getValue() + "x " + entry.getKey());
                }
            }

            // IF THERE ARE NO REFACTORINGS
            if (refactorings.trim().isEmpty()) {
                System.out.println("No refactorings found in final analysis, generating regular summary");
                
                OpenAiService service = new OpenAiService(aitoken);
                StringBuilder returnedResultfromgpt = new StringBuilder();
                try {
                    CompletionRequest completionRequest = CompletionRequest.builder()
                            .prompt("Act as a prompt optimizer and optimize the following prompt for summary on changes. The prompt is [Given the following url, generate a clear, concise and COMPLETE message that is 1-2 sentences that summarizes the changes in the code for people to understand. After the summary, give one line for the motivation behind these changes and then give one line on the impact of these changes. Write it in this format: SUMMARY: summary changes, INTENT: intent line, IMPACT: impact line]\n" + fullurl)
                            .model("gpt-3.5-turbo-instruct")
                            .maxTokens(300)
                            .build();
                    CompletionResult result = service.createCompletion(completionRequest);
                    List<CompletionChoice> choices = result.getChoices();
                    if (choices != null && !choices.isEmpty()) {
                        String text = choices.get(0).getText();
                        returnedResultfromgpt.append(text);
                    }
                    returnedResultfromgpt.append(" INSTRUCTION: " + "No Refactoring Detected");
                    return returnedResultfromgpt.toString();
                } catch (Exception exp) {
                    System.err.println("Error generating summary: " + exp.getMessage());
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
                        .maxTokens(300)
                        .build();
                CompletionResult result = service.createCompletion(completionRequest);
                List<CompletionChoice> choices = result.getChoices();

                if (choices != null && !choices.isEmpty()) {
                    String text = choices.get(0).getText();
                    returnedResultfromgpt.append(text);
                }

                // Create a formatted list of refactoring instances for the INSTRUCTION section
                for (Map.Entry<String, Integer> entry : refactoringinstances.entrySet()) {
                    String key = entry.getKey();
                    Integer value = entry.getValue();
                    instructions.append(value + " " + key + "  ");
                }
                
                // Add the INSTRUCTION section with the detected refactorings
                returnedResultfromgpt.append(" INSTRUCTION: " + instructions.toString());
                return returnedResultfromgpt.toString();
            } 
            catch (Exception exp) {
                System.err.println("Error generating summary: " + exp.getMessage());
                throw new RuntimeException(exp.getMessage());
            }
        } catch (Exception e) {
            System.err.println("Error analyzing commit: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to analyze commit: " + e.getMessage());
        }
    }

    @CrossOrigin(origins = "*")
    @GetMapping("/greeting")
    public Greeting greeting(
            @RequestParam String url, 
            @RequestParam String id, 
            @RequestParam String og,
            @RequestParam(required = false) String uuid) 
    {
        // Add logging to debug the received parameters
        System.out.println("Received URL: " + url);
        System.out.println("Received ID: " + id);
        System.out.println("Received UUID: " + uuid);

        // Check if commit is cached
        Optional<String> commitmsg = cService.getCommitfromDB(url, id);
        if (commitmsg.isPresent()) {
            System.out.println("Retrieved cached summary for commit: " + id);
            return new Greeting(counter.incrementAndGet(), commitmsg.get());
        }

        // Generate new summary
        try {
            String refMessage = returnrefs(url, id, uuid);
            // Cache the result
            cService.saveCommit(id, url, refMessage, og);
            System.out.println("Generated new summary for commit: " + id);
            return new Greeting(counter.incrementAndGet(), refMessage);
        } catch (Exception e) {
            System.err.println("Error processing commit: " + e.getMessage());
            e.printStackTrace();
            return new Greeting(counter.incrementAndGet(), 
                "Error analyzing commit: " + e.getMessage());
        }
    }
}
