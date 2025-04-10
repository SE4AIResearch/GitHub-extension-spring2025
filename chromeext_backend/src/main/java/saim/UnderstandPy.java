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
        // Determine project root first (needed to find properties file)
        File backendDir = getBackendDirectory(); // Get backend dir first
        File projectRoot = backendDir.getParentFile(); // Derive project root
        
        // Path to properties file relative to project root
        Path propertiesPath = Paths.get(projectRoot.getAbsolutePath(), "chromeext_backend", "src", "main", "resources", "application.properties");
        
        try (InputStream input = new FileInputStream(propertiesPath.toFile())) {
            appProps.load(input);
            
            // Load configuration values
            SCITOOLS_DIR = appProps.getProperty("scitools.directory");
            // Resolve placeholder if present
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
        final String stdErr;

        PythonExecutionResult(int exitCode, String stdOut, String stdErr) {
            this.exitCode = exitCode;
            this.stdOut = stdOut;
            this.stdErr = stdErr;
        }
    }

    public static void main(String[] args) {
        if (args.length < 1) {
            System.err.println("Usage: java UnderstandPy <repo-url-or-path>");
            System.exit(1);
        }
        String initialRepoArg = args[0];

        try {
            // 1. Determining Backend Directory 
            File backendDir = getBackendDirectory(); // Calls helper
            File projectRoot = backendDir.getParentFile(); // Derive project root

            // 2. Cloning repo if necessary 
            String repoPath = handleCloningIfNeeded(initialRepoArg, backendDir);

            // 3. Preparing upython execution 
            List<String> command = buildPythonCommand(projectRoot, repoPath);
            File workingDir = new File(SCITOOLS_DIR);

            // 4. Execute understandMetrics.py script
            System.out.println("Executing Python script for: " + repoPath);
            PythonExecutionResult result = executePythonScript(command, workingDir);
            System.out.println("Python script finished with exit code: " + result.exitCode);

            // 5. Handle Result
            if (result.exitCode == 0) {
                handleSuccessfulExecution(projectRoot, repoPath, result.stdOut);
                // 6. Cleaning up cloned repo and .und database (only on success)
                performPostExecutionCleanup(repoPath, projectRoot);
            } else {
                handleFailedExecution(result.exitCode);
            }

        } catch (Exception e) {
            System.err.println("An unexpected error occurred during the process: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    // Determines the backend directory (current working directory)
    private static File getBackendDirectory() {
        // Simple assumption: the process is run from chromeext_backend
        File backendDir = new File(System.getProperty("user.dir"));
        if (!backendDir.getName().equals("chromeext_backend")) {
             System.err.println("Warning: Current directory is not 'chromeext_backend'. Repos path might be unexpected.");
             // Optionally, could try finding it relative to a known marker, but this is simpler for now.
        }
        return backendDir;
    }

    // Clones the repository if the input is a URL, otherwise returns the input path
    private static String handleCloningIfNeeded(String repoUrlOrPath, File backendDir) throws IOException, GitAPIException {
        if (repoUrlOrPath.startsWith("http://") || repoUrlOrPath.startsWith("https://") || repoUrlOrPath.startsWith("git@")) {
            System.out.println("Input is a URL, attempting to clone...");
            // Pass backendDir to cloneRepository
            String clonedPath = cloneRepository(repoUrlOrPath, backendDir); 
            System.out.println("Repository cloned successfully to: " + clonedPath);
            return clonedPath;
        } else {
            System.out.println("Input is a local path: " + repoUrlOrPath);
            return repoUrlOrPath; 
        }
    }

    // Builds the command list for executing the understandMetrics.py
    private static List<String> buildPythonCommand(File projectRoot, String repoPath) {
        String pythonScriptPath = new File(projectRoot, PYTHON_SCRIPT_NAME).getAbsolutePath();
        List<String> command = new ArrayList<>();
        command.add(UPYTHON_EXECUTABLE);
        command.add(pythonScriptPath);
        command.add(repoPath);
        return command;
    }

    // Executes the understandMetrics.py script and captures its output. 
    private static PythonExecutionResult executePythonScript(List<String> command, File workingDir) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(workingDir); 
        
        StringBuilder outputJson = new StringBuilder();
        StringBuilder errorOutput = new StringBuilder(); // Capture stderr for the result object
        int exitCode = -1;

        Process process = pb.start();
        
        // Capture stdout (expected JSON)
        try (BufferedReader stdInput = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String s;
            while ((s = stdInput.readLine()) != null) {
                outputJson.append(s).append(System.lineSeparator());
            }
        }

        // Capture stderr (for diagnostics AND result object)
        System.out.println("--- Python stderr --- (Messages below are from the script)");
        try (BufferedReader stdError = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
            String s;
            while ((s = stdError.readLine()) != null) {
                System.err.println(s); // Print errors immediately to console
                errorOutput.append(s).append(System.lineSeparator());
            }
        }
        System.out.println("------------------- (End of script stderr)");

        exitCode = process.waitFor();
        
        return new PythonExecutionResult(exitCode, outputJson.toString(), errorOutput.toString());
    }

    // Handles the successful execution: saves JSON output.
    private static void handleSuccessfulExecution(File projectRoot, String repoPath, String jsonOutput) throws IOException {
        String repoBaseName = new File(repoPath).getName();
        String outputFileName = repoBaseName + ".json";

        Path outputDirPath = Paths.get(projectRoot.getAbsolutePath(), "chromeext_backend", OUTPUT_DIR_NAME);
        Files.createDirectories(outputDirPath); 
        Path outputFilePath = outputDirPath.resolve(outputFileName);

        try (FileWriter writer = new FileWriter(outputFilePath.toFile())) {
            writer.write(jsonOutput.trim()); 
            System.out.println("Successfully wrote metrics JSON to: " + outputFilePath.toString());
        } catch (IOException e) {
            System.err.println("ERROR: Failed to write metrics JSON to file: " + outputFilePath.toString());
            throw e; // Re-throw to indicate failure at this stage
        }
    }

    // Handles the failed execution 
    private static void handleFailedExecution(int exitCode) {
         System.err.println("Python script failed (exit code " + exitCode + "). No metrics file generated. Skipping cleanup.");
         System.exit(1); // Exit with error status
    }

    // Performs cleanup of repo and .und database
    private static void performPostExecutionCleanup(String repoPath, File projectRoot) {
        System.out.println("\n--- Starting Post-Execution Cleanup ---");
        String repoBaseName = new File(repoPath).getName();
        String dbFileName = repoBaseName + ".und";
        // DB is expected in the parent directory of the specific repo clone directory
        Path dbFilePath = Paths.get(new File(repoPath).getParent(), dbFileName);
        Path repoDirPath = Paths.get(repoPath);

        System.out.println("Suggesting GC before cleanup delay...");
        System.gc(); 
        
        System.out.println("Waiting before cleanup...");
        try {
            Thread.sleep(3000); // Wait 3 seconds
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

    // Attempts to delete a path (file or directory recursively)
    private static void cleanupPath(String description, Path path) {
         try {
            if (Files.exists(path)) { 
                System.out.println("Attempting to delete " + description + ": " + path.toString());
                deleteDirectoryRecursively(path); // Use the recursive delete for both
                // Final check after recursive delete
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
     * 
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
     * Clone a Git repository using JGit.
     * 
     * @param repoUrl The URL of the repository to clone.
     * @param backendDir The directory where the 'repos' subdirectory should be created.
     * @return The path to the cloned repository.
     * @throws IOException If an I/O error occurs.
     * @throws GitAPIException If a Git-related error occurs.
     */
    private static String cloneRepository(String repoUrl, File backendDir) throws IOException, GitAPIException {
        // Determine repo name from URL
        String repoName = repoUrl.substring(repoUrl.lastIndexOf('/') + 1);
        if (repoName.endsWith(".git")) {
            repoName = repoName.substring(0, repoName.length() - 4);
        }
        
        // Create base 'repos' directory relative to the backend directory
        File reposDir = new File(backendDir, REPOS_DIR_NAME); 
        if (!reposDir.exists() && !reposDir.mkdirs()) {
             throw new IOException("Failed to create base repository directory: " + reposDir.getAbsolutePath());
        }
        
        // Create a unique directory for this specific clone
        String uniqueId = String.valueOf(System.currentTimeMillis()).substring(6);
        File localRepoDir = new File(reposDir, repoName + "_" + uniqueId);
        
        System.out.println("Cloning repository to: " + localRepoDir.getAbsolutePath());
        
        Git git = null; 
        try {
            git = Git.cloneRepository()
                .setURI(repoUrl)
                .setDirectory(localRepoDir)
                .setCloneAllBranches(false) 
                .setDepth(1)             
                .call();
        } finally {
            if (git != null) {
                System.out.println("Closing JGit repository object...");
                git.close();
            }
        }
        return localRepoDir.getAbsolutePath();
    }
}
