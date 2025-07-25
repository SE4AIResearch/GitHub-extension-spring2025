package saim;

import java.io.File;
import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.storage.file.FileRepositoryBuilder;
import org.kohsuke.github.GitHub;
import org.kohsuke.github.GitHubBuilder;
import org.refactoringminer.api.Refactoring;
import org.refactoringminer.api.RefactoringHandler;
import org.refactoringminer.rm1.GitHistoryRefactoringMinerImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.google.gson.Gson;
import com.theokanning.openai.service.OpenAiService;

@RestController
public class RefactoringController {
    /*
     * REmoving the env variable for openai api key 
     */
    //private static final String aitoken = System.getenv("OPENAI_API_KEY");

    @Autowired
    private ApiKeyRepo apiKeyRepo;

    @Autowired
    private CommitRefactoringsRepository commitRefactoringsRepository;

    @Autowired
    private CommitService cService;
    private final AtomicLong counter = new AtomicLong();
    
    private boolean cachingEnabled = true; // Toggle for caching, mostly used for testing

    public String returnrefs(String url, String id, String uuid) {

        ReactoringHelper helper = new ReactoringHelper();
        LLM llm = new LLM();

        id = helper.cleanCommitId(id);

        ApiKey apiKey = retrieveApiKey(uuid);
        String aiToken = apiKey.getOpenaiLlmApiKey();
        if (aiToken == null || aiToken.isBlank()) {
            throw new RuntimeException("OpenAI API key not configured");
        }

        String fullUrl = url + "/commit/" + id;
        System.out.println("Processing URL: " + fullUrl);

        String repoUrl = helper.getRepoUrl(url);

        String githubToken = apiKey.getGithubApiKey();
        if (githubToken == null || githubToken.isBlank()) {
            throw new RuntimeException("GitHub API token not configured");
        }

        GitHistoryRefactoringMinerImpl miner = new GitHistoryRefactoringMinerImpl();
        setupGitHubAuthentication(githubToken, miner);
        testGitHubAuthentication(githubToken);

        StringBuilder refactoringMessages = new StringBuilder();
        Map<String, Integer> refactoringInstances = new HashMap<>();

        boolean apiSuccess = analyzeCommitUsingGitHubApi(repoUrl, id, miner, refactoringMessages, refactoringInstances, commitRefactoringsRepository);

        if (!apiSuccess) {
            analyzeCommitUsingLocalClone(repoUrl, id, miner, refactoringMessages, refactoringInstances, commitRefactoringsRepository);
        }

        OpenAiService service = new OpenAiService(aiToken);
        if (refactoringMessages.toString().trim().isEmpty()) {
            return llm.generateSummaryForNoRefactorings(fullUrl, repoUrl, service, aiToken);
        } else {
            return llm.generateSummaryForRefactorings(refactoringMessages.toString(), refactoringInstances, repoUrl, fullUrl, aiToken);
        }
    }



    private ApiKey retrieveApiKey(String uuid) {
        Optional<ApiKey> apiKeyOpt = apiKeyRepo.findByUuid(uuid);
        if (apiKeyOpt.isEmpty()) {
            throw new RuntimeException("API key not found for UUID: " + uuid);
        }
        return apiKeyOpt.get();
    }



    private void setupGitHubAuthentication(String githubToken, GitHistoryRefactoringMinerImpl miner) {
        System.out.println("Using GitHub token for authentication");
        System.setProperty("github.oauth", githubToken);

        try {
            Class<?> processEnvironmentClass = Class.forName("java.lang.ProcessEnvironment");
            Field theEnvironmentField = processEnvironmentClass.getDeclaredField("theEnvironment");
            theEnvironmentField.setAccessible(true);
            @SuppressWarnings("unchecked")
            Map<String, String> env = (Map<String, String>) theEnvironmentField.get(null);
            env.put("GITHUB_OAUTH", githubToken);
            env.put("GITHUB_TOKEN", githubToken);
        } catch (Exception e) {
            System.err.println("Could not set environment variables: " + e.getMessage());
        }

        try {
            System.out.println("Attempting to directly set GitHub token in RefactoringMiner");
            Field githubField = GitHistoryRefactoringMinerImpl.class.getDeclaredField("gitHub");
            githubField.setAccessible(true);
            GitHub authorizedGitHub = new GitHubBuilder().withOAuthToken(githubToken).build();
            githubField.set(miner, authorizedGitHub);
            System.out.println("Successfully injected authenticated GitHub instance into RefactoringMiner");
        } catch (Exception e) {
            System.err.println("Could not directly set GitHub token in RefactoringMiner: " + e.getMessage());
        }
    }

    private boolean testGitHubAuthentication(String githubToken) {
        try {
            GitHub github = new GitHubBuilder().withOAuthToken(githubToken).build();
            String username = github.getMyself().getLogin();
            System.out.println("Successfully authenticated as GitHub user: " + username);
            return true;
        } catch (Exception e) {
            System.err.println("Warning: GitHub API authentication test failed: " + e.getMessage());
            return false;
        }
    }

    private boolean analyzeCommitUsingGitHubApi(String repoUrl, String commitId, GitHistoryRefactoringMinerImpl miner,
                                                StringBuilder refactoringMessages, Map<String, Integer> refactoringInstances,
                                                CommitRefactoringsRepository commitRefactoringsRepository) {
        final boolean[] refactoringsFound = {false};
        try {
            miner.detectAtCommit(repoUrl, commitId, new RefactoringHandler() {
                @Override
                public void handle(String commitId, List<Refactoring> refactorings) {
                    System.out.println("Found " + refactorings.size() + " refactorings");
                    if (!refactorings.isEmpty()) {
                        refactoringsFound[0] = true;
                    }
                    int x = 1;
                    for (Refactoring ref : refactorings) {
                        System.out.println("Refactoring #" + ref.toString());
                        refactoringMessages.append(x + ". " + ref.toString() + "\n");
//                        System.out.println("Refactoring found: " + ref.getRefactoringType());
                        String refType = ref.getRefactoringType().toString();
                        refactoringInstances.put(refType, refactoringInstances.getOrDefault(refType, 0) + 1);
                        x++;
                    }
                    CommitRefactorings commitRef = new CommitRefactorings(commitId, refactoringMessages.toString());
                    commitRefactoringsRepository.save(commitRef);
                    System.out.println("Saved refactorings for commit " + commitId + " into database (GitHub API method)");
                }
                @Override
                public void handleException(String commitId, Exception e) {
                    System.err.println("Error detecting refactorings for commit " + commitId);
                    e.printStackTrace();
                    refactoringsFound[0] = false;
                }
            }, 120);
            return (refactoringMessages.length() > 0 && refactoringsFound[0]);
        } catch (Exception e) {
            System.err.println("Error analyzing commit with GitHub API: " + e.getMessage());
            return false;
        }
    }

    private void analyzeCommitUsingLocalClone(String repoUrl, String commitId, GitHistoryRefactoringMinerImpl miner,
                                              StringBuilder refactoringMessages, Map<String, Integer> refactoringInstances,
                                              CommitRefactoringsRepository commitRefactoringsRepository) {
        try {
            System.out.println("GitHub API approach failed - falling back to shallow clone approach");
            Path tempDir = Files.createTempDirectory("refactoring-clone-");
            File localRepoDir = tempDir.toFile();
            localRepoDir.deleteOnExit();
            System.out.println("Cloning repository to: " + localRepoDir.getAbsolutePath());

            Git.cloneRepository().setURI(repoUrl).setDirectory(localRepoDir)
                    .setCloneAllBranches(false)
                    .setNoCheckout(false)
                    .setDepth(1)
                    .call();

            Git git = Git.open(localRepoDir);
            git.fetch()
                    .setRemote("origin")
                    .setRefSpecs("+refs/heads/*:refs/remotes/origin/*", "+refs/tags/*:refs/tags/*", "+refs/*:refs/*", "+" + commitId + ":" + commitId)
                    .call();

            Repository repository = new FileRepositoryBuilder()
                    .setGitDir(new File(localRepoDir, ".git"))
                    .build();

            System.out.println("Analyzing commit using local clone: " + commitId);
            refactoringMessages.setLength(0);
            refactoringInstances.clear();

            miner.detectAtCommit(repository, commitId, new RefactoringHandler() {
                @Override
                public void handle(String commitId, List<Refactoring> refactorings) {
                    System.out.println("Found " + refactorings.size() + " refactorings in local clone");
                    int x = 1;
                    for (Refactoring ref : refactorings) {
                        refactoringMessages.append(x + ". " + ref.toString() + "\n");
                        System.out.println("Refactoring found: " + ref.getRefactoringType());
                        String refType = ref.getRefactoringType().toString();
                        refactoringInstances.put(refType, refactoringInstances.getOrDefault(refType, 0) + 1);
                        x++;
                    }
                    CommitRefactorings commitRef = new CommitRefactorings(commitId, refactoringMessages.toString());
                    commitRefactoringsRepository.save(commitRef);
                    System.out.println("Saved refactorings for commit " + commitId + " into database (Local Clone method)");
                }
                @Override
                public void handleException(String commitId, Exception e) {
                    System.err.println("Error detecting refactorings for commit " + commitId + " in local clone");
                    e.printStackTrace();
                }
            }, 120);
            repository.close();
            System.out.println("Shallow clone analysis completed successfully");
        } catch (Exception e) {
            System.err.println("Error during local clone analysis: " + e.getMessage());
            e.printStackTrace();
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
        System.out.println("Caching Enabled: " + cachingEnabled);
        if (cachingEnabled) {
            Optional<String> commitmsg = cService.getCommitfromDB(url, id);
            if (commitmsg.isPresent()) {
                System.out.println("Retrieved cached summary for commit: " + id);
                return new Greeting(counter.incrementAndGet(), commitmsg.get());
            }
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

    @CrossOrigin(origins = "*")
    @GetMapping("/api/refactorings")
    public ResponseEntity<String> getRefactorings(@RequestParam String url, @RequestParam String id, @RequestParam(required = false) String uuid) {
        try {
            // Clean the commit ID
            String cleanId = new ReactoringHelper().cleanCommitId(id);
            
            // First check if refactorings are already in the database
            Optional<CommitRefactorings> refactoringsOpt = commitRefactoringsRepository.findByCommitId(cleanId);
            
            if (refactoringsOpt.isPresent()) {
                Map<String, String> response = new HashMap<>();
                response.put("refactorings", refactoringsOpt.get().getRefactorings());
                return ResponseEntity.ok(new Gson().toJson(response));
            }
            
            // If not in database, fetch them
            String repoUrl = new ReactoringHelper().getRepoUrl(url);
            
            GitHistoryRefactoringMinerImpl miner = new GitHistoryRefactoringMinerImpl();
            ApiKey apiKey = retrieveApiKey(uuid);
            String githubToken = apiKey.getGithubApiKey();
            setupGitHubAuthentication(githubToken, miner);
            
            StringBuilder refactoringMessages = new StringBuilder();
            Map<String, Integer> refactoringInstances = new HashMap<>();
            
            boolean apiSuccess = analyzeCommitUsingGitHubApi(repoUrl, cleanId, miner, refactoringMessages, refactoringInstances, commitRefactoringsRepository);
            
            if (!apiSuccess) {
                analyzeCommitUsingLocalClone(repoUrl, cleanId, miner, refactoringMessages, refactoringInstances, commitRefactoringsRepository);
            }
            
            Map<String, String> response = new HashMap<>();
            response.put("refactorings", refactoringMessages.toString());
            return ResponseEntity.ok(new Gson().toJson(response));
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new Gson().toJson(error));
        }
    }
}
