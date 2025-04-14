package saim;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.nio.file.Files;
import java.nio.file.Path;
import java.io.File;
import java.io.FileWriter;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.Properties;
import java.io.InputStream;
import java.io.FileInputStream;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevWalk;

public class UnderstandPy {

    // Configuration Loaded from application.properties file 
    private static final Properties appProps = new Properties();
    private static String UPYTHON_EXECUTABLE;
    private static String SCITOOLS_DIR;
    private static String PYTHON_SCRIPT_NAME;
    private static String OUTPUT_DIR_NAME;
    private static String REPOS_DIR_NAME;

    // Static initializer block to load properties
    static {
        // Determine project root first for finding properties file
        File backendDir = getBackendDirectory(); // Getting backend dir first
        File projectRoot = backendDir.getParentFile(); // Deriving project root
        
        // Path to properties file relative to project root
        Path propertiesPath = Paths.get(projectRoot.getAbsolutePath(), "chromeext_backend", "src", "main", "resources", "application.properties");
        
        try (InputStream input = new FileInputStream(propertiesPath.toFile())) {
            appProps.load(input);
            
            // Loading configuration values
            SCITOOLS_DIR = appProps.getProperty("scitools.directory");
            // Resolving placeholder if present
            UPYTHON_EXECUTABLE = appProps.getProperty("scitools.upython.executable", SCITOOLS_DIR + "/upython.exe") // Default if missing
                                       .replace("${scitools.directory}", SCITOOLS_DIR); 
            PYTHON_SCRIPT_NAME = appProps.getProperty("metrics.script.path", "chromeext_metrics/understandMetrics.py");
            OUTPUT_DIR_NAME = appProps.getProperty("output.directory.name", "output");
            REPOS_DIR_NAME = appProps.getProperty("repos.directory.name", "repos");

            // Basic validation
            if (SCITOOLS_DIR == null || UPYTHON_EXECUTABLE == null) {
                throw new RuntimeException("SciTools configuration (scitools.directory, scitools.upython.executable) not found in application.properties");
            }
            System.out.println("Configuration loaded from application.properties");

        } catch (IOException ex) {
            System.err.println("ERROR: Could not load application.properties from " + propertiesPath);
            ex.printStackTrace();
            System.exit(1); 
        }
    }

    // Inner class to hold Python execution results
    private static class PythonExecutionResult {
        final int exitCode;
        final String stdOut;

        PythonExecutionResult(int exitCode, String stdOut) {
            this.exitCode = exitCode;
            this.stdOut = stdOut;
        }
    }

    public static void main(String[] args) {
        if (args.length < 1) {
            System.err.println("Usage: java UnderstandPy <repo-url-or-path>");
            System.exit(1);
        }
        String initialRepoArg = args[0];
        Git git = null;
        String repoPath = null;
        File projectRoot = null;
        boolean cleanupNeeded = false;

        try {
            // 1. Getting the path to the needed directories
            File backendDir = getBackendDirectory();
            projectRoot = backendDir.getParentFile();

            // 2. Cloning (changing depth from 1 to 10, for finding the previous nad latest commit)
            repoPath = handleCloningIfNeeded(initialRepoArg, backendDir);

            // Open the repository
            File repoDir = new File(repoPath);
            git = Git.open(repoDir);
            Repository repository = git.getRepository();

            // 3. Identifying Commits
            System.out.println("\n--- DEBUG: Repository Information ---");
            System.out.println("Repository path: " + repository.getDirectory());
            System.out.println("Current branch: " + repository.getBranch());
            System.out.println("Attempting to resolve HEAD...");
            
            ObjectId headId = repository.resolve("HEAD");
            if (headId == null) {
                throw new IOException("Could not resolve HEAD for repository: " + repoPath);
            }
            System.out.println("HEAD resolved to: " + headId.getName());
            
            ObjectId parentId = null;
            System.out.println("Starting parent commit resolution process...");
            try (RevWalk revWalk = new RevWalk(repository)) {
                RevCommit headCommit = revWalk.parseCommit(headId);
                System.out.println("HEAD commit details: " + headCommit.getShortMessage() + " (author: " + headCommit.getAuthorIdent().getName() + ")");
                System.out.println("HEAD commit has " + headCommit.getParentCount() + " parent(s)");
                
                if (headCommit.getParentCount() > 0) {
                    // Try to resolve the first parent initially
                    RevCommit parentCommit = headCommit.getParent(0);
                    parentId = parentCommit.getId();
                    System.out.println("First parent ID: " + parentId.getName() + " (not yet fully resolved)");
                    
                    // Try resolving the actual parent commit object (will be null if not in local repo)
                    ObjectId resolvedParent = repository.resolve(parentId.getName());
                    if (resolvedParent == null) {
                        System.out.println("WARNING: Cannot directly resolve parent by ID! This is unexpected.");
                    } else {
                        System.out.println("Parent commit ID can be resolved directly: " + resolvedParent.getName());
                    }
                    
                    // Verify the parent object exists fully by trying to load it in a RevWalk
                    try {
                        RevCommit fullParentCommit = revWalk.parseCommit(parentId);
                        System.out.println("Parent commit fully resolved locally - details: " 
                            + fullParentCommit.getShortMessage() 
                            + " (author: " + fullParentCommit.getAuthorIdent().getName() + ")");
                    } catch (Exception e) {
                        System.out.println("Cannot fully resolve parent commit: " + e.getMessage());
                        
                        // Verify the parent object exists locally using the alternative check
                        System.out.println("Checking if parent " + parentId.getName() + " exists using alternative method...");
                        if (repository.resolve(parentId.getName() + "^{commit}") == null) { 
                            System.out.println("Parent commit " + parentId.getName() + " not found in initial shallow clone. Fetching full history to find it...");
                            try {
                                // Fetch full history if parent is missing
                                System.out.println("Executing git.fetch().call()...");
                                git.fetch()
                                   // .setRemote("origin") 
                                   .call();
                                System.out.println("Full fetch completed. Retrying parent resolution...");
                                
                                // Retry resolving the parent after fetching more history
                                ObjectId reresolvedParent = repository.resolve(parentId.getName() + "^{commit}");
                                if (reresolvedParent == null) {
                                    // This should now only happen if the parent commit truly doesn't exist
                                    // or some other very unusual repository state.
                                    System.err.println("WARNING: Parent commit " + parentId.getName() + " still not found after full fetch!");
                                    System.err.println("Attempting to list all commits in repository to verify...");
                                    
                                    // List all commits to see what's available
                                    try {
                                        System.out.println("Available commits after fetch:");
                                        int count = 0;
                                        Iterable<RevCommit> commits = git.log().call();
                                        for (RevCommit commit : commits) {
                                            System.out.println("  " + commit.getId().getName() + " - " + commit.getShortMessage());
                                            count++;
                                            if (count >= 5) {
                                                System.out.println("  ... (more commits available)");
                                                break;
                                            }
                                        }
                                    } catch (Exception logEx) {
                                        System.err.println("Error listing commits: " + logEx.getMessage());
                                    }
                                    
                                    System.err.println("Proceeding with latest commit only.");
                                    parentId = null; // Ensure parentId is null if still not resolvable
                                } else {
                                    try {
                                        RevCommit refetchedParent = revWalk.parseCommit(reresolvedParent);
                                        System.out.println("Parent commit found after full fetch: " 
                                            + refetchedParent.getShortMessage() 
                                            + " (author: " + refetchedParent.getAuthorIdent().getName() + ")");
                                    } catch (Exception parseEx) {
                                        System.err.println("Found parent ID but cannot parse it as a commit: " + parseEx.getMessage());
                                        parentId = null;
                                    }
                                }
                            } catch (GitAPIException fetchEx) {
                                System.err.println("Warning: Failed to fetch full history: " + fetchEx.getMessage());
                                fetchEx.printStackTrace(); // for debugging
                                System.err.println("Proceeding without parent commit.");
                                parentId = null; // Ensuring parentId is null on fetch failure
                            }
                        }
                    }
                } else {
                    System.out.println("HEAD commit has no parents (likely initial commit).");
                }
                revWalk.dispose(); // Release resources promptly
            }

            // 4. Preparing Execution Context
            File workingDir = new File(SCITOOLS_DIR);
            List<String> command = buildPythonCommand(projectRoot, repoPath);
            boolean previousSucceeded = false;
            boolean latestSucceeded = false;

            // 5. Analyzing Previous Commit
            if (parentId != null) {
                System.out.println("\n--- Analyzing Previous Commit (" + parentId.getName() + ") ---");
                try {
                    System.out.println("Checking out previous commit: " + parentId.getName());
                    git.checkout().setName(parentId.getName()).call();

                    System.out.println("Executing Python script for previous commit...");
                    PythonExecutionResult parentResult = executePythonScript(command, workingDir);
                    System.out.println("Previous commit script finished with exit code: " + parentResult.exitCode);

                    if (parentResult.exitCode == 0) {
                        handleSuccessfulExecution(projectRoot, repoPath, parentResult.stdOut, "_previous");
                        previousSucceeded = true;
                    } else {
                        handleFailedExecution(parentResult.exitCode, "previous commit");
                    }
                } catch (Exception e) { 
                     System.err.println("ERROR processing previous commit: " + e.getMessage());
                     e.printStackTrace(); // Continue to latest commit analysis
                }
            } else {
                 System.out.println("\n--- No parent commit found (likely initial commit). Skipping previous commit analysis. ---");
                 // Ensure cleanup logic works if only latest is analyzed
                 previousSucceeded = true; 
            }

            // 6. Analyzing Latest Commit
            System.out.println("\n--- Analyzing Latest Commit (" + headId.getName() + ") ---");
            try {
                 System.out.println("Checking out latest commit: " + headId.getName());
                 // Checkout HEAD commit
                 git.checkout().setName(headId.getName()).call();

                 System.out.println("Executing Python script for latest commit...");
                 PythonExecutionResult latestResult = executePythonScript(command, workingDir);
                 System.out.println("Latest commit script finished with exit code: " + latestResult.exitCode);

                 if (latestResult.exitCode == 0) {
                     handleSuccessfulExecution(projectRoot, repoPath, latestResult.stdOut, "_latest");
                     latestSucceeded = true;
                 } else {
                     handleFailedExecution(latestResult.exitCode, "latest commit");
                 }
            } catch (Exception e) { 
                 System.err.println("ERROR processing latest commit: " + e.getMessage());
                 e.printStackTrace();
            }

            // 7. Cleanup process for the repo and .und database
            // Cleanup if cloning succeeded and at least one analysis attempt finished successfully
            if (previousSucceeded || latestSucceeded) {
                 System.out.println("\n--- Analysis complete (at least one commit processed successfully). Proceeding with cleanup. ---");
                 cleanupNeeded = true;
            } else {
                System.out.println("\n--- Analysis failed for all attempted commits. Skipping cleanup. ---");
            }

        } catch (Exception e) { 
            System.err.println("A critical error occurred during setup or repository handling: " + e.getMessage());
            e.printStackTrace();
            // Do not proceed to cleanup if these critical steps fail
            System.exit(1);
        } finally {
            // 8. Close Git and Cleanup
            if (git != null) {
                System.out.println("Closing Git repository object.");
                git.close();
            }
            // Cleanup only if the flag was set (meaning cloning and at least one analysis succeeded)
            if (cleanupNeeded && repoPath != null && projectRoot != null) {
                performPostExecutionCleanup(repoPath, projectRoot);
            } else {
                System.out.println("Skipping post-execution cleanup due to critical errors or analysis failures.");
            }
        }
    }

    // Function for determining the backend directory (current working directory)
    private static File getBackendDirectory() {
        File backendDir = new File(System.getProperty("user.dir"));
        if (!backendDir.getName().equals("chromeext_backend")) {
             System.err.println("Warning: Current directory is not 'chromeext_backend'. Repos path might be unexpected.");
        }
        return backendDir;
    }

    // Function for cloning the repository if the input is a URL, otherwise returns the input path
    private static String handleCloningIfNeeded(String repoUrlOrPath, File backendDir) throws IOException, GitAPIException {
        if (repoUrlOrPath.startsWith("http://") || repoUrlOrPath.startsWith("https://") || repoUrlOrPath.startsWith("git@")) {
            System.out.println("Input is a URL, attempting to clone...");
            String clonedPath = cloneRepository(repoUrlOrPath, backendDir); 
            System.out.println("Repository cloned successfully to: " + clonedPath);
            return clonedPath;
        } else {
            System.out.println("Input is a local path: " + repoUrlOrPath);
            File localPath = new File(repoUrlOrPath);
             if (!localPath.exists() || !localPath.isDirectory()) {
                 throw new IOException("Provided local path does not exist or is not a directory: " + repoUrlOrPath);
             }
            return repoUrlOrPath; 
        }
    }

    // Function for building the command list for executing the understandMetrics.py
    private static List<String> buildPythonCommand(File projectRoot, String repoPath) {
        String pythonScriptPath = new File(projectRoot, PYTHON_SCRIPT_NAME).getAbsolutePath();
        List<String> command = new ArrayList<>();
        command.add(UPYTHON_EXECUTABLE);
        command.add(pythonScriptPath);
        command.add(repoPath);
        return command;
    }

    // Function for executing the understandMetrics.py script and capturing its output. 
    private static PythonExecutionResult executePythonScript(List<String> command, File workingDir) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(workingDir); 
        
        StringBuilder outputJson = new StringBuilder();
        StringBuilder errorOutput = new StringBuilder();
        int exitCode = -1;

        Process process = pb.start();
        
        // Capture stdout i.e., json output
        try (BufferedReader stdInput = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String s;
            while ((s = stdInput.readLine()) != null) {
                outputJson.append(s).append(System.lineSeparator());
            }
        }

        // Capture stderr (for diagnostics)
        System.out.println("--- Python stderr --- (Messages below are from the script)");
        try (BufferedReader stdError = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
            String s;
            while ((s = stdError.readLine()) != null) {
                System.err.println(s); 
                errorOutput.append(s).append(System.lineSeparator());
            }
        }
        System.out.println("------------------- (End of script stderr)");

        exitCode = process.waitFor();
        
        return new PythonExecutionResult(exitCode, outputJson.toString());
    }

    // Function for handling the successful execution: saves JSON output.
    private static void handleSuccessfulExecution(File projectRoot, String repoPath, String jsonOutput, String suffix) throws IOException {
        String repoBaseName = new File(repoPath).getName();
        String outputFileName = repoBaseName + suffix + ".json";

        Path outputDirPath = Paths.get(projectRoot.getAbsolutePath(), "chromeext_backend", OUTPUT_DIR_NAME);
        Files.createDirectories(outputDirPath); 
        Path outputFilePath = outputDirPath.resolve(outputFileName);

        try (FileWriter writer = new FileWriter(outputFilePath.toFile())) {
            writer.write(jsonOutput.trim()); 
            System.out.println("Successfully wrote metrics JSON (" + suffix.substring(1) + ") to: " + outputFilePath.toString());
        } catch (IOException e) {
            System.err.println("ERROR: Failed to write metrics JSON (" + suffix.substring(1) + ") to file: " + outputFilePath.toString());
            throw e; 
        }
    }

    // Function for handling the failed execution 
    private static void handleFailedExecution(int exitCode, String context) {
         System.err.println("Python script failed for " + context + " (exit code " + exitCode + "). No metrics file generated for this commit.");
    }

    // Function for performing cleanup of repo and .und database
    private static void performPostExecutionCleanup(String repoPath, File projectRoot) {
        System.out.println("\n--- Starting Post-Execution Cleanup ---");
        String repoBaseName = new File(repoPath).getName();
        String dbFileName = repoBaseName + ".und";
        Path dbFilePath = Paths.get(new File(repoPath).getParent(), dbFileName);
        Path repoDirPath = Paths.get(repoPath);

        System.out.println("Suggesting GC before cleanup delay...");
        System.gc(); 
        
        System.out.println("Waiting before cleanup...");
        try {
            Thread.sleep(3000); // Wait 3 seconds for resources to be released
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt(); 
            System.err.println("Cleanup delay interrupted.");
        }
        
        System.out.println("Cleaning up temporary files...");
        
        // Delete .und directory/bundle
        cleanupPath("database", dbFilePath);

        // Delete cloned repository directory
        cleanupPath("repository directory", repoDirPath);
        
        System.out.println("--- Cleanup attempt complete --- ");
    }

    // Function for attempting to delete a path (file or directory recursively)
    private static void cleanupPath(String description, Path path) {
         try {
            if (Files.exists(path)) { 
                System.out.println("Attempting to delete " + description + ": " + path.toString());
                deleteDirectoryRecursively(path); // Use the recursive delete for both
                if (!Files.exists(path)) {
                    System.out.println("Deleted " + description + ": " + path.toString());
                } else {
                    System.err.println("Warning: " + description + " may not be fully deleted: " + path.toString());
                }
            } else {
                 System.out.println(description + " not found for deletion: " + path.toString());
            }
        } catch (IOException e) {
            System.err.println("ERROR: Exception during " + description + " deletion: " + path.toString());
            e.printStackTrace();
        }
    }

    /**
     * Helper method to recursively delete a directory. 
     * @param path Path to the directory to delete.
     * @throws IOException If a non-deletable file is encountered or other I/O error.
     */
    private static void deleteDirectoryRecursively(Path path) throws IOException {
        final int MAX_RETRIES = 3;
        final long RETRY_DELAY_MS = 500;

        if (!Files.exists(path)) {
            return; // Nothing to delete
        }
        
        Files.walk(path)
            .sorted(Comparator.reverseOrder())
            .forEach(p -> {
                int retries = 0;
                while (retries < MAX_RETRIES) {
                    try {
                        Files.delete(p);
                        break; 
                    } catch (IOException e) {
                        retries++;
                        if (retries >= MAX_RETRIES) {
                            System.err.println("Warning: Failed to delete file/directory after " + MAX_RETRIES + " attempts: " + p + " (" + e.getMessage() + ")");
                        } else {
                            try {
                                Thread.sleep(RETRY_DELAY_MS);
                            } catch (InterruptedException ie) {
                                Thread.currentThread().interrupt(); 
                                System.err.println("Retry delay interrupted for " + p);
                                break; 
                            }
                        }
                    }
                } 
            }); 
        
        if (Files.exists(path)) {
             System.err.println("Warning: Root path still exists after cleanup attempt: " + path);
        }
    }

    /**
     * Function for cloning a Git repository using JGit. Clones with depth 10.
     * @param repoUrl The URL of the repository to clone.
     * @param backendDir The directory where the 'repos' subdirectory should be created.
     * @return The path to the cloned repository directory.
     * @throws IOException If an I/O error occurs.
     * @throws GitAPIException If a Git-related error occurs.
     */
    private static String cloneRepository(String repoUrl, File backendDir) throws IOException, GitAPIException {
        // Determining repo name from URL
        String repoName = repoUrl.substring(repoUrl.lastIndexOf('/') + 1);
        if (repoName.endsWith(".git")) {
            repoName = repoName.substring(0, repoName.length() - 4);
        }
        
        // Creating base 'repos' directory relative to the backend directory
        File reposDir = new File(backendDir, REPOS_DIR_NAME); 
        if (!reposDir.exists() && !reposDir.mkdirs()) {
             throw new IOException("Failed to create base repository directory: " + reposDir.getAbsolutePath());
        }
        
        // Creating a unique directory for this specific clone to avoid conflicts
        String uniqueId = String.valueOf(System.currentTimeMillis()).substring(6); // Simple unique ID
        File localRepoDir = new File(reposDir, repoName + "_" + uniqueId);
        
        System.out.println("Cloning repository with depth 10 to: " + localRepoDir.getAbsolutePath());
        
        Git git = null; 
        try {
            git = Git.cloneRepository()
                .setURI(repoUrl)
                .setDirectory(localRepoDir)
                .setCloneAllBranches(false) // Clone only the default branch
                .setDepth(10)               // Clone last 10 commits to ensure parent is included
                .setNoCheckout(false)       // Checkout HEAD after cloning
                .call();
            System.out.println("Clone completed successfully.");
        } finally {
            if (git != null) {
                // Close the Git object immediately after clone
                System.out.println("Closing JGit repository object after clone.");
                git.close();
            }
        }
        // Return the path to the directory where the repo was cloned
        return localRepoDir.getAbsolutePath();
    }
}
