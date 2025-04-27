package saim;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevWalk;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UnderstandService {

    private static final Logger log = LoggerFactory.getLogger(UnderstandService.class);

    //  Fetching these values from application.properties 
    @Value("${scitools.directory}")
    private String scitoolsDir;

    @Value("${scitools.upython.executable}")
    private String upythonExecutable;

    @Value("${metrics.script.path}")
    private String pythonScriptName; // Can be relative to project root or absolute

    @Value("${output.directory.name}")
    private String outputDirName;

    @Value("${repos.directory.name}")
    private String reposDirName;
    
    /***************
    * Development mode variables needs to be added here
    ****************/
    @Value("${development.mode:false}")
    private boolean developmentMode;

    /**************
    * Above value is only need to be set if 
    * running in development mode(i.e., Dashboard development) 
    ***************/

    private final Map<String, UnderstandStatus> analysisJobs = new ConcurrentHashMap<>();

    // Constants for Git Operations
    private static final int GIT_CLONE_DEPTH = 10;
    private static final long CLEANUP_DELAY_MS = 3000;
    private static final int MAX_CLEANUP_RETRIES = 5;
    private static final long CLEANUP_RETRY_DELAY_MS = 1000;


    // Public API Methods

    /**
     * Starts the asynchronous analysis of a Git repository.
     *
     * @param repoUrl The URL of the Git repository to analyze.
     * @return A CompletableFuture representing the asynchronous operation.
     */
    @Async
    public CompletableFuture<Void> startAnalysis(String repoUrl) {
        String analysisId = generateAnalysisId(repoUrl);
        log.info("Starting analysis for ID: {} URL: {}", analysisId, repoUrl);
        System.out.println("STARTED ANALYSIS: " + repoUrl);
        updateJobStatus(analysisId, UnderstandStatusValue.RUNNING, "Initializing analysis...");
        updateJobProgress(analysisId, 5);
        
        // Adding for checking if in development mode
        if (developmentMode) {
            return handleDevelopmentMode(analysisId, repoUrl);
        }

        File projectRoot = null;
        File metricsDir = null;
        File repoDir = null; // The directory where the repo is cloned/copied
        Git git = null;
        boolean cleanupNeeded = false;
        List<String> resultFiles = new ArrayList<>();

        try {
            // 1. Setup Paths
            projectRoot = determineProjectRoot();
            metricsDir = locateMetricsDirectory(projectRoot);
            log.info("Using project root: {}", projectRoot.getAbsolutePath());
            log.info("Located metrics directory: {}", metricsDir.getAbsolutePath());
            updateJobProgress(analysisId, 10);

            // 2. Cloning Repository
            repoDir = prepareRepository(repoUrl, projectRoot);
            cleanupNeeded = true; // Mark for cleanup if cloning/copying succeeds
            updateJobProgress(analysisId, 25);

            // 3. Identifying Commits
            git = Git.open(repoDir);
            Repository repository = git.getRepository();
            ObjectId headId = resolveCommit(repository, "HEAD");
            ObjectId parentId = resolveParentCommit(repository, headId);

            // 4. Preparing Python Execution
            File scriptWorkingDir = determineScriptWorkingDirectory();
            List<String> baseCommand = buildPythonCommand(projectRoot, metricsDir, repoDir.getAbsolutePath());

            // 5. Analysis of Commits
            boolean previousSucceeded = analyzeCommit(analysisId, projectRoot, git, parentId, baseCommand, scriptWorkingDir, "_previous", resultFiles);
            boolean latestSucceeded = analyzeCommit(analysisId, projectRoot, git, headId, baseCommand, scriptWorkingDir, "_latest", resultFiles);

            // 6. Setting Final Status
            setFinalAnalysisStatus(analysisId, previousSucceeded, latestSucceeded, resultFiles);

            log.info("Analysis process completed for ID: {}", analysisId);
            return CompletableFuture.completedFuture(null);

        } catch (Exception e) {
            log.error("Critical analysis error for ID: {} - {}", analysisId, e.getMessage(), e);
            System.err.println("ANALYSIS ERROR: " + e.getMessage());
            e.printStackTrace();
            updateJobStatus(analysisId, UnderstandStatusValue.FAILED, "Critical error: " + e.getMessage());
            // For ensuring that cleanup doesn't run if setup failed before repo dir was set
            if (repoDir == null) {
                cleanupNeeded = false;
            }
            return CompletableFuture.failedFuture(e);
        } finally {
            // 7. Cleanup
            closeGitRepository(git);
            if (cleanupNeeded && repoDir != null) {
                performPostExecutionCleanup(repoDir);
            } else {
                log.info("Skipping post-execution cleanup for ID: {}", analysisId);
            }
        }
    }

    /**
     * Retrieves the current status of an analysis job.
     *
     * @param repoUrl The URL of the repository whose status is requested.
     * @return The current UnderstandStatus.
     */
    public UnderstandStatus getStatus(String repoUrl) {
        String analysisId = generateAnalysisId(repoUrl);
        // Return PENDING if not found, or the actual status
        return analysisJobs.getOrDefault(analysisId, new UnderstandStatus(UnderstandStatusValue.PENDING));
    }

    // Private Helper Methods for Setup & Preparation

    private String generateAnalysisId(String repoUrl) {
        // Basic sanitization for repo url
        String id = repoUrl.replaceAll("^https?://", "").replaceAll("[^a-zA-Z0-9.-]", "_");
        log.debug("Generated Analysis ID: {} from URL: {}", id, repoUrl);
        return id;
    }

    private File determineProjectRoot() throws IOException {
        File cwd = new File(System.getProperty("user.dir"));
        System.out.println(System.getProperty("user.dir"));
        log.info("Detected Current Working Directory (CWD): {}", cwd.getAbsolutePath());
        
        // Check if current directory is valid
        if (!cwd.exists() || !cwd.isDirectory()) {
            throw new IOException("Current working directory is invalid: " + cwd.getAbsolutePath());
        }
        
        // Check if the metrics directory exists directly in the current working directory
        File metricsDir = new File(cwd, "chromeext_metrics");
        if (metricsDir.exists() && metricsDir.isDirectory()) {
            log.info("Found metrics directory at same level as CWD: {}", metricsDir.getAbsolutePath());
            return cwd;
        }
        
        // If metrics directory is not found in the current working directory
        // check in the parent directory
        File parentDir = cwd.getParentFile();
        if (parentDir != null && cwd.getName().equals("chromeext_backend")) {
            log.info("Detected launch from chromeext_backend directory, using parent as project root: {}", parentDir.getAbsolutePath());
            File parentMetricsDir = new File(parentDir, "chromeext_metrics");
            if (parentMetricsDir.exists() && parentMetricsDir.isDirectory()) {
                return parentDir;
            }
        }
        
        // Adding log to help debugging if metrics directory is not found
        log.error("Could not locate metrics directory. CWD: {}, Parent: {}", 
                 cwd.getAbsolutePath(), 
                 (parentDir != null ? parentDir.getAbsolutePath() : "null"));
        
        // Fallback to current directory with warning
        log.warn("Falling back to current directory as project root, but metrics directory may not be found");
        return cwd;
    }

    private File locateMetricsDirectory(File projectRoot) throws IOException {
        File metricsDir = new File(projectRoot, "../chromeext_metrics");
        log.info("Looking for metrics directory at: {}", metricsDir.getAbsolutePath());
        if (!metricsDir.exists() || !metricsDir.isDirectory()) {
            throw new IOException("Metrics directory not found at expected location: " + metricsDir.getAbsolutePath());
        }
        return metricsDir;
    }

     private File determineScriptWorkingDirectory() {
        File workingDir = new File(scitoolsDir);
        if (!workingDir.exists() || !workingDir.isDirectory()) {
            log.warn("Configured SciTools working directory does not exist: {}. Falling back to project root.", workingDir.getAbsolutePath());
            try {
                return determineProjectRoot(); // Fallback
            } catch (IOException e) {
                log.error("Could not determine fallback working directory", e);
                return new File(System.getProperty("user.dir"));
            }
        }
        return workingDir;
    }

    private List<String> buildPythonCommand(File projectRoot, File metricsDir, String repoPath) throws IOException {
        File scriptFile = new File(metricsDir, "understandMetrics.py");
        String scriptPath;

        if (scriptFile.exists()) {
            scriptPath = scriptFile.getAbsolutePath();
            log.info("Using script from verified metrics directory: {}", scriptPath);
        } else {
            log.error("understandMetrics.py not found in metrics directory: {}", scriptFile.getAbsolutePath());
            throw new FileNotFoundException("Cannot locate understandMetrics.py script.");
        }

        // Validate upython executable path
        File pythonExeFile = new File(upythonExecutable);
        if (!pythonExeFile.exists() && !pythonExeFile.isAbsolute()) {
           log.warn("upython executable not found at configured path: {}. Relying on PATH.", upythonExecutable);
        }

        List<String> command = new ArrayList<>();
        command.add(upythonExecutable); // Use SciTools upython
        command.add(scriptPath);
        command.add(repoPath);

        log.info("Built Python command: {}", String.join(" ", command));
        return command;
    }

    // Private Helper Methods for Git Operations

    private File prepareRepository(String repoUrlOrPath, File projectRoot) throws IOException, GitAPIException {
        File reposBaseDir = new File(projectRoot, reposDirName);
        if (!reposBaseDir.exists() && !reposBaseDir.mkdirs()) {
            throw new IOException("Failed to create base repository directory: " + reposBaseDir.getAbsolutePath());
        }

        if (isGitUrl(repoUrlOrPath)) {
            log.info("Input is a URL, attempting to clone...");
            return cloneRepository(repoUrlOrPath, reposBaseDir);
        } else {
           log.error("Local paths are not supported for analysis: {}", repoUrlOrPath);
           throw new IllegalArgumentException("Analysis currently only supports Git URLs, not local paths.");
        }
    }

    private boolean isGitUrl(String path) {
        return path.startsWith("http://") || path.startsWith("https://") || path.startsWith("git@");
    }

    private File cloneRepository(String repoUrl, File reposBaseDir) throws GitAPIException, IOException {
        String repoName = repoUrl.substring(repoUrl.lastIndexOf('/') + 1);
        if (repoName.endsWith(".git")) {
            repoName = repoName.substring(0, repoName.length() - 4);
        }

        // Use a unique directory to avoid conflicts
        String uniqueId = String.valueOf(System.currentTimeMillis()).substring(6);
        File localRepoDir = new File(reposBaseDir, repoName + "_" + uniqueId);

        log.info("Cloning repository with depth {} to: {}", GIT_CLONE_DEPTH, localRepoDir.getAbsolutePath());

        try (Git git = Git.cloneRepository()
                .setURI(repoUrl)
                .setDirectory(localRepoDir)
                .setCloneAllBranches(false) // Only need default branch usually
                .setDepth(GIT_CLONE_DEPTH)  // Limit history depth
                .setNoCheckout(false)    // Checkout the default branch
                .call()) {
            log.info("Clone completed successfully for {}", repoUrl);
            return localRepoDir;
        } catch (Exception e) {
            log.error("Failed to clone repository {}: {}", repoUrl, e.getMessage());
            // Attempt cleanup if clone failed partially
            if (localRepoDir.exists()) {
                 deleteDirectoryRecursively(localRepoDir.toPath());
            }
            if (e instanceof GitAPIException) throw (GitAPIException) e;
            if (e instanceof IOException) throw (IOException) e;
            throw new IOException("Cloning failed due to unexpected error: " + e.getMessage(), e);
        }
    }

     private ObjectId resolveCommit(Repository repository, String revString) throws IOException {
        ObjectId commitId = repository.resolve(revString);
        if (commitId == null) {
            throw new IOException("Could not resolve revision: " + revString);
        }
        log.info("Resolved {} to commit ID: {}", revString, commitId.getName());
        return commitId;
    }

    private ObjectId resolveParentCommit(Repository repository, ObjectId childCommitId) throws IOException {
        try (RevWalk revWalk = new RevWalk(repository)) {
            RevCommit childCommit = revWalk.parseCommit(childCommitId);
            if (childCommit.getParentCount() > 0) {
                RevCommit parentCommit = revWalk.parseCommit(childCommit.getParent(0).getId());
                log.info("Found parent commit ID: {}", parentCommit.getName());
                return parentCommit.getId();
            } else {
                log.info("Commit {} has no parents.", childCommitId.getName());
                return null; // Root commit
            }
        }
    }

    private void closeGitRepository(Git git) {
        if (git != null) {
            log.info("Closing Git repository object.");
            git.close();
        }
    }

    // Private Helper Methods for Python Script Execution & Handling

     private boolean analyzeCommit(String analysisId, File projectRoot, Git git, ObjectId commitId,
                                List<String> baseCommand, File scriptWorkingDir,
                                String fileSuffix, List<String> resultFiles) throws IOException {
        if (commitId == null) {
            log.info("Skipping analysis for null commit ID (suffix: {}).", fileSuffix);
            return fileSuffix.equals("_previous");
        }

        log.info("--- Analyzing Commit {} (Suffix: {}) ---", commitId.getName(), fileSuffix);
        updateJobStatus(analysisId, UnderstandStatusValue.RUNNING, "Analyzing commits...");
        
        // Set progress based on which commit we're analyzing
        if (fileSuffix.equals("_previous")) {
            updateJobProgress(analysisId, 40);
        } else if (fileSuffix.equals("_latest")) {
            updateJobProgress(analysisId, 65);
        }

        boolean success = false;
        String jsonOutput = null; // Will hold the actual json output
        String errorMessage = "";

        try {
            log.info("Checking out commit: {}", commitId.getName());
            git.checkout().setName(commitId.getName()).call();

            log.info("Executing Python script...");
            PythonExecutionResult result = executePythonScript(baseCommand, scriptWorkingDir);

            if (result.exitCode == 0 && result.stdOut != null && !result.stdOut.trim().isEmpty()) {
                log.info("Python script executed successfully for commit {}.", commitId.getName());
                jsonOutput = result.stdOut; // Store the actual output
                success = true;
            } else if (result.exitCode == 0) {
                errorMessage = "Python script returned empty output";
                log.warn("{}. Marking commit analysis as failed.", errorMessage);
                success = false; // Mark as failed
            } else {
                 errorMessage = "Python script failed (exit code " + result.exitCode + ")";
                 log.warn("{}. Marking commit analysis as failed.", errorMessage);
                 success = false; // Mark as failed
            }
        } catch (Exception e) {
            errorMessage = "Error processing commit " + commitId.getName() + ": " + e.getMessage();
            log.error(errorMessage, e);
            success = false; // Mark as failed due to exception
        }

        // Update progress after commit analysis is complete
        if (fileSuffix.equals("_previous")) {
            updateJobProgress(analysisId, 55);
        } else if (fileSuffix.equals("_latest")) {
            updateJobProgress(analysisId, 85);
        }

        // Only save the result if the script succeeded and produced output
        if (success && jsonOutput != null) {
            try {
                handleMetricsResult(projectRoot, baseCommand.get(2), jsonOutput, fileSuffix, resultFiles);
                // Update status only if there was a warning during processing
                if (!errorMessage.isEmpty()) {
                    updateJobStatus(analysisId, UnderstandStatusValue.RUNNING, "Commit " + commitId.getName().substring(0,7) + " analysis warning: " + errorMessage);
                }
            } catch (IOException ioException) {
                log.error("Failed to save metrics JSON for commit {}: {}", commitId.getName(), ioException.getMessage(), ioException);
                // If saving fails, we cannot consider this commit a success
                updateJobStatus(analysisId, UnderstandStatusValue.FAILED, "Failed to save results for commit " + commitId.getName().substring(0,7));
                return false; // Mark as failed
            }
        } else {
            // Log the reason for not saving
            log.warn("Skipping result saving for commit {} (Suffix: {}) due to failure or empty output.", commitId.getName(), fileSuffix);
            // Update status with the failure message
            updateJobStatus(analysisId, UnderstandStatusValue.RUNNING, "Commit " + commitId.getName().substring(0,7) + " analysis failed: " + errorMessage);
            success = false;
        }

        return success;
    }

    private PythonExecutionResult executePythonScript(List<String> command, File executionDir) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(executionDir); // Run from script's directory 

        // Set up environment (PYTHONPATH, PATH, SCITOOLS_DIR)
        setupPythonEnvironment(pb, executionDir);

        logExecutionDetails(command, executionDir);

        StringBuilder outputJson = new StringBuilder();
        StringBuilder errorOutput = new StringBuilder();
        int exitCode = -1;

        Process process = pb.start();

        // Capture stdout/stderr concurrently using separate threads
        Thread outputReaderThread = startStreamReader(process.getInputStream(), "stdout", outputJson);
        Thread errorReaderThread = startStreamReader(process.getErrorStream(), "stderr", errorOutput);

        exitCode = process.waitFor(); // Wait for the process to complete
        outputReaderThread.join(); // Wait for reader threads to finish
        errorReaderThread.join();

        if (exitCode != 0) {
            log.error("Python script failed with exit code: {}", exitCode);
            log.error("Python script stderr: {}", errorOutput);
            analyzeErrorOutput(errorOutput.toString()); // Log analyzed error
        }

        return new PythonExecutionResult(exitCode, outputJson.toString());
    }

     private void setupPythonEnvironment(ProcessBuilder pb, File executionDir) {
        Map<String, String> env = pb.environment();
        String projectRootPath = executionDir.getParentFile() != null ? executionDir.getParentFile().getAbsolutePath() : executionDir.getAbsolutePath(); // Adjust based on executionDir logic
        String metricsDirPath = new File(projectRootPath, "chromeext_metrics").getAbsolutePath();

        // Set PYTHONPATH
        String currentPythonPath = env.get("PYTHONPATH");
        if (currentPythonPath == null || currentPythonPath.isEmpty()) {
            env.put("PYTHONPATH", metricsDirPath);
        } else if (!currentPythonPath.contains(metricsDirPath)) {
            env.put("PYTHONPATH", currentPythonPath + File.pathSeparator + metricsDirPath);
        }

        // Set SCITOOLS_DIR and add to PATH
        if (scitoolsDir != null && !scitoolsDir.isEmpty()) {
            env.put("SCITOOLS_DIR", scitoolsDir);
            String currentPath = env.get("PATH");
            
            // Detect OS and set the appropriate bin path
            String osName = System.getProperty("os.name").toLowerCase();
            String scitoolsBinPath;
            
            if (osName.contains("win")) {
                scitoolsBinPath = Paths.get(scitoolsDir, "bin", "pc-win64").toString();
                log.info("Detected Windows OS, using bin path: {}", scitoolsBinPath);
            } else if (osName.contains("mac") || osName.contains("darwin")) {
                scitoolsBinPath = Paths.get(scitoolsDir, "bin", "macosx").toString();
                log.info("Detected macOS, using bin path: {}", scitoolsBinPath);
            } else {
                scitoolsBinPath = Paths.get(scitoolsDir, "bin", "linux64").toString();
                log.info("Detected Linux/Unix OS, using bin path: {}", scitoolsBinPath);
            }

            if (currentPath == null || currentPath.isEmpty()) {
                 env.put("PATH", scitoolsBinPath);
            } else if (!currentPath.contains(scitoolsBinPath)) {
                 env.put("PATH", currentPath + File.pathSeparator + scitoolsBinPath);
            }
        }
         log.debug("Python Environment - PYTHONPATH: {}", env.get("PYTHONPATH"));
         log.debug("Python Environment - PATH: {}", env.get("PATH"));
         log.debug("Python Environment - SCITOOLS_DIR: {}", env.get("SCITOOLS_DIR"));
    }

    private void logExecutionDetails(List<String> command, File executionDir) {
         log.info("Executing command: {} in directory {}", String.join(" ", command), executionDir.getAbsolutePath());
         // Log file existence checks
         try {
             File scriptFile = new File(command.get(1));
             File pythonExe = new File(command.get(0));
             log.info("Script file exists: {} - Path: {}", scriptFile.exists(), scriptFile.getAbsolutePath());
             log.info("Python executable exists: {} - Path: {}", pythonExe.exists(), pythonExe.getAbsolutePath());
             log.info("Execution directory exists: {} - Path: {}", executionDir.exists(), executionDir.getAbsolutePath());
         } catch (Exception e) {
             log.warn("Could not perform execution detail checks", e);
         }
    }

     private Thread startStreamReader(InputStream inputStream, String type, StringBuilder buffer) {
        Thread thread = new Thread(() -> {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    log.debug("Script {}: {}", type, line);
                    buffer.append(line).append(System.lineSeparator());
                }
            } catch (IOException e) {
                log.error("Error reading script {}: {}", type, e.getMessage());
            }
        });
        thread.start();
        return thread;
    }


    private void analyzeErrorOutput(String errorOutput) {
        if (errorOutput == null || errorOutput.isEmpty()) {
            log.warn("No stderr output captured from Python script.");
            return;
        }
        if (errorOutput.contains("ModuleNotFoundError") || errorOutput.contains("ImportError")) {
            log.error("Error Analysis: Python module not found. Check dependencies and PYTHONPATH.");
        } else if (errorOutput.contains("FileNotFoundError")) {
            log.error("Error Analysis: File not found error within Python script. Check paths.");
        } else if (errorOutput.contains("PermissionError")) {
            log.error("Error Analysis: Permission error during Python script execution.");
        } else if (errorOutput.contains("understand.UnderstandError")) {
            log.error("Error Analysis: Understand API error. Check license and installation.");
        } else {
             log.warn("Error Analysis: Unspecified Python error. Review stderr log for details.");
        }
    }

    private void handleMetricsResult(File projectRoot, String repoPath, String jsonOutput, String suffix, List<String> resultFiles) throws IOException {
        if (jsonOutput == null || jsonOutput.isEmpty()) {
            log.warn("Empty JSON output, skipping metrics file creation");
            return;
        }

        // Extract repository name from repo path
        String repoName = new File(repoPath).getName();
        
        // Create output directory if it doesn't exist
        File outputDir = new File(projectRoot, outputDirName);
        log.debug("Checking output directory: {}", outputDir.getAbsolutePath());
        if (!outputDir.exists() && !outputDir.mkdirs()) {
            throw new IOException("Failed to create output directory: " + outputDir.getAbsolutePath());
        }
        
        // Create output file with repository name and suffix
        String outputFileName = repoName + suffix + ".json";
        File outputFile = new File(outputDir, outputFileName);
        log.info("Creating metrics output file: {}", outputFile.getAbsolutePath());
        
        // Write the JSON to the output file
        try (FileWriter writer = new FileWriter(outputFile)) {
            writer.write(jsonOutput);
            log.info("Successfully wrote {} bytes to metrics file: {}", jsonOutput.length(), outputFile.getAbsolutePath());
            
            // Verify file was created
            if (outputFile.exists() && outputFile.length() > 0) {
                log.debug("Verified metrics file exists with size: {} bytes", outputFile.length());
                resultFiles.add(outputFileName);
            } else {
                log.error("Failed to verify metrics file was created properly: {}", outputFile.getAbsolutePath());
            }
        } catch (IOException e) {
            log.error("Error writing metrics to file: {}", e.getMessage(), e);
            throw e;
        }
    }

    // Private Helper Methods for Status Update & Finalization

     private void updateJobStatus(String analysisId, UnderstandStatusValue status, String message) {
        analysisJobs.compute(analysisId, (id, currentStatus) -> {
            if (currentStatus == null) {
                return new UnderstandStatus(status, message);
            }
            if (currentStatus.getStatus() == UnderstandStatusValue.FAILED && status != UnderstandStatusValue.FAILED) {
                return currentStatus;
            }
            currentStatus.setStatus(status);
            currentStatus.setMessage(message); // Update message
            return currentStatus;
        });
         log.info("Status updated for ID {}: {} - {}", analysisId, status, message);
    }

     private void updateJobProgress(String analysisId, int progress) {
        analysisJobs.compute(analysisId, (id, currentStatus) -> {
            if (currentStatus == null) {
                return new UnderstandStatus(UnderstandStatusValue.RUNNING, progress);
            }
            currentStatus.setProgress(progress);
            return currentStatus;
        });
        log.info("Progress updated for ID {}: {}%", analysisId, progress);
    }

     private void setFinalAnalysisStatus(String analysisId, boolean previousSucceeded, boolean latestSucceeded, List<String> resultFiles) {
         UnderstandStatus finalStatus;
         
         if (latestSucceeded && previousSucceeded) {
             finalStatus = new UnderstandStatus(UnderstandStatusValue.COMPLETED);
             finalStatus.setMessage("Analysis completed successfully for both commits.");
         } else if (latestSucceeded) {
             finalStatus = new UnderstandStatus(UnderstandStatusValue.COMPLETED); // Still complete overall
             finalStatus.setMessage("Analysis completed for latest commit only. Previous commit analysis failed.");
         } else if (previousSucceeded) {
             finalStatus = new UnderstandStatus(UnderstandStatusValue.COMPLETED); // Still complete overall
             finalStatus.setMessage("Analysis completed for previous commit only. Latest commit analysis failed.");
         } else {
             // Both failed
             finalStatus = new UnderstandStatus(UnderstandStatusValue.FAILED);
             finalStatus.setMessage("Analysis failed for both commits. Could not generate metrics.");
         }
         
         finalStatus.setOutputFiles(resultFiles.toArray(new String[0]));
         finalStatus.setProgress(100); // Set progress to 100% when completed
         analysisJobs.put(analysisId, finalStatus); // Overwrite with final status
         log.info("Final status set for ID {}: {} - {}", analysisId, finalStatus.getStatus(), finalStatus.getMessage());
     }


    // Private Helper Methods for Cleanup

     private void performPostExecutionCleanup(File repoDir) {
        log.info("--- Starting Post-Execution Cleanup for {} ---", repoDir.getName());
        Path repoPath = repoDir.toPath();
        Path parentDir = repoPath.getParent(); // Should be .../chromeext_backend/repos/
        if (parentDir == null) {
             log.error("Cannot determine parent directory for cleanup: {}", repoPath);
             return;
        }
        String repoBaseName = repoDir.getName();
        // Getting .und path (may not always exist if analysis failed early)
        Path dbFilePath = parentDir.resolve(repoBaseName + ".und");

        log.info("Suggesting GC before cleanup delay...");
        System.gc();

        log.info("Waiting {}ms before cleanup...", CLEANUP_DELAY_MS);
        try {
            Thread.sleep(CLEANUP_DELAY_MS);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            log.warn("Cleanup delay interrupted.");
        }

        log.info("Cleaning up temporary files...");
        cleanupPath("Understand database", dbFilePath);
        cleanupPath("Cloned repository directory", repoPath);
        log.info("--- Cleanup attempt complete for {} ---", repoDir.getName());
    }

    private void cleanupPath(String description, Path path) {
         try {
            if (Files.exists(path)) {
                log.info("Attempting to delete {} at: {}", description, path);
                deleteDirectoryRecursively(path); // Handles both files and dirs
                if (!Files.exists(path)) {
                    log.info("Successfully deleted {}: {}", description, path);
                } else {
                    log.warn("{} may not be fully deleted after attempt: {}", description, path);
                }
            } else {
                 log.debug("{} not found for deletion: {}", description, path);
            }
        } catch (IOException e) {
            log.error("Exception during {} deletion: {}", description, path, e);
        }
    }

    private void deleteDirectoryRecursively(Path path) throws IOException {
        if (!Files.exists(path)) return;

        // Simple approach first
        try {
            Files.walk(path)
                .sorted(Comparator.reverseOrder()) // Delete files before directories
                .map(Path::toFile)
                .forEach(file -> {
                    if (!file.delete()) {
                        log.warn("Failed initial delete attempt for: {}", file.getAbsolutePath());
                    }
                });
        } catch (IOException e) {
             log.warn("Error during initial recursive delete walk for {}: {}", path, e.getMessage());
        }


        // Retry logic if necessary 
        if (Files.exists(path)) {
             log.warn("Initial delete failed for directory {}, retrying...", path);
             int attempt = 0;
             while (Files.exists(path) && attempt < MAX_CLEANUP_RETRIES) {
                 attempt++;
                 log.info("Retry {} to delete {}", attempt, path);
                 try { Thread.sleep(CLEANUP_RETRY_DELAY_MS); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); break; }

                 try {
                     Files.walk(path)
                         .sorted(Comparator.reverseOrder())
                         .map(Path::toFile)
                         .forEach(file -> {
                             if (!file.delete()) {
                             }
                         });
                 } catch (IOException e) {
                     log.warn("Error during retry delete walk for {}: {}", path, e.getMessage());
                     // Try deleting the root directory 
                     try {
                         Files.delete(path);
                     } catch (IOException ex) {
                          log.warn("Error deleting root directory {} during retry: {}", path, ex.getMessage());
                     }
                 }
             }
             // Final check
             if (Files.exists(path)) {
                  log.error("Failed to delete directory {} after {} retries.", path, MAX_CLEANUP_RETRIES);
             }
        }
    }

    // Inner Classes

    // This class holds Python execution results
    private static class PythonExecutionResult {
        final int exitCode;
        final String stdOut;

        PythonExecutionResult(int exitCode, String stdOut) {
            this.exitCode = exitCode;
            this.stdOut = stdOut == null ? "" : stdOut; // Ensure stdout is never null
        }
    }

    /**************
     * Handles the analysis in development mode using sample data
     ***************/
    private CompletableFuture<Void> handleDevelopmentMode(String analysisId, String repoUrl) {
        log.info("DEVELOPMENT MODE: Using existing metrics files for {}", repoUrl);
        
        try {
            // Simulate progress for UI development
            updateJobProgress(analysisId, 10);
            Thread.sleep(500);
            updateJobProgress(analysisId, 25);
            Thread.sleep(500);
            updateJobProgress(analysisId, 50);
            Thread.sleep(500);
            updateJobProgress(analysisId, 75);
            Thread.sleep(500);
            
            // Determine project root and locate output directory
            File projectRoot = determineProjectRoot();
            File outputDir = new File(projectRoot, outputDirName);
            if (!outputDir.exists() && !outputDir.mkdirs()) {
                throw new IOException("Failed to create output directory: " + outputDir.getAbsolutePath());
            }
            
            // Extract repository name from repo URL
            String repoName = repoUrl.substring(repoUrl.lastIndexOf('/') + 1);
            if (repoName.endsWith(".git")) {
                repoName = repoName.substring(0, repoName.length() - 4);
            }

            // Define regex patterns for the filenames
            String previousFilePattern = repoName + "_\\d+_previous\\.json";
            String latestFilePattern = repoName + "_\\d+_latest\\.json";

            List<String> resultFiles = new ArrayList<>();

            // Search for files matching the patterns in the output directory
            try (DirectoryStream<Path> stream = Files.newDirectoryStream(outputDir.toPath())) {
                for (Path entry : stream) {
                    String fileName = entry.getFileName().toString();
                    if (fileName.matches(previousFilePattern)) {
                        log.info("Using existing previous metrics file: {}", entry.toAbsolutePath());
                        resultFiles.add(fileName);
                    } else if (fileName.matches(latestFilePattern)) {
                        log.info("Using existing latest metrics file: {}", entry.toAbsolutePath());
                        resultFiles.add(fileName);
                    }
                }
            } catch (IOException e) {
                 log.error("Error reading output directory {}: {}", outputDir.getAbsolutePath(), e.getMessage(), e);
                 throw new IOException("Error searching for metrics files in " + outputDir.getAbsolutePath(), e);
            }


            // Logs if files not found
            boolean foundPrevious = resultFiles.stream().anyMatch(name -> name.matches(previousFilePattern));
            boolean foundLatest = resultFiles.stream().anyMatch(name -> name.matches(latestFilePattern));

            if (!foundPrevious) {
                log.warn("Previous metrics file matching pattern '{}' not found in {}", previousFilePattern, outputDir.getAbsolutePath());
            }
            if (!foundLatest) {
                 log.warn("Latest metrics file matching pattern '{}' not found in {}", latestFilePattern, outputDir.getAbsolutePath());
            }

            // If neither file exists, throw an exception
            if (resultFiles.isEmpty()) {
                throw new IOException("No existing metrics files found for repository: " + repoName);
            }
            
            // Set progress to 100% and mark as completed
            updateJobProgress(analysisId, 100);
            UnderstandStatus finalStatus = new UnderstandStatus(UnderstandStatusValue.COMPLETED);
            finalStatus.setMessage("Development mode: Using existing metrics files");
            finalStatus.setOutputFiles(resultFiles.toArray(new String[0]));
            finalStatus.setProgress(100);
            analysisJobs.put(analysisId, finalStatus);
            
            log.info("DEVELOPMENT MODE: Completed for {}", repoUrl);
            return CompletableFuture.completedFuture(null);
            
        } catch (Exception e) {
            log.error("Error in development mode for {}: {}", repoUrl, e.getMessage(), e);
            updateJobStatus(analysisId, UnderstandStatusValue.FAILED, "Development mode error: " + e.getMessage());
            return CompletableFuture.failedFuture(e);
        }
    }
}
