package saim;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

class AnalyzeRequest {
    public String repoUrl;
}

@CrossOrigin("*")
@RestController
@RequestMapping("/api")
public class UnderstandController {

    @Autowired
    private UnderstandService understandService;

    @GetMapping("/status")
    public ResponseEntity<?> getAnalysisStatus(@RequestParam(required = false) String repoUrl, 
                                              @RequestParam(required = false) Boolean check) {
        if (check != null && check) {
            return ResponseEntity.ok().body("Backend service is available");
        }
        
        if (repoUrl == null || repoUrl.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        
        try {
            UnderstandStatus status = understandService.getStatus(repoUrl);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            System.err.println("Error fetching status for " + repoUrl + ": " + e.getMessage());
            UnderstandStatus errorStatus = new UnderstandStatus(UnderstandStatusValue.FAILED, "Error checking status: " + e.getMessage());
            errorStatus.setProgress(0); // Set progress to 0 for error states
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorStatus);
        }
    }

    @PostMapping("/analyze")
    public ResponseEntity<String> startAnalysis(@RequestBody AnalyzeRequest request) {
        System.out.println("POST /analyze received with repoUrl: " + (request != null ? request.repoUrl : "null"));
        if (request.repoUrl == null || request.repoUrl.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Missing 'repoUrl' in request body.");
        }
        try {
            System.out.println("Starting analysis for repo: " + request.repoUrl);
            understandService.startAnalysis(request.repoUrl);
            String analysisId = request.repoUrl.replaceAll("^https?://", "").replaceAll("[^a-zA-Z0-9.-]", "_");
            return ResponseEntity.status(HttpStatus.ACCEPTED).body("Analysis started for: " + request.repoUrl + ". Check status using ID: " + analysisId);
         } catch (Exception e) {
            System.err.println("Error submitting analysis request: " + e.getMessage());
            e.printStackTrace(); // Print the full stack trace for debugging
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error starting analysis: " + e.getMessage());
         }
    }

    @GetMapping("/results/{filename}")
    public ResponseEntity<Resource> getResultFile(@PathVariable String filename) {
         if (filename == null || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
             return ResponseEntity.badRequest().build();
         }

         try {
            // Get the current working directory
            Path currentDir = Paths.get(System.getProperty("user.dir"));
            System.out.println("Current working directory: " + currentDir.toString());
            
            // Define single output directory path
            Path outputDirPath = currentDir.resolve("output");
            System.out.println("Looking for result file in: " + outputDirPath.toString());
            
            Path filePath = outputDirPath.resolve(filename).normalize();
            
            // Ensure no path traversal
            if (!filePath.startsWith(outputDirPath)) {
                System.err.println("Attempted path traversal: " + filename);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            Resource resource = new FileSystemResource(filePath);
            
            if (resource.exists() && resource.isReadable()) {
                System.out.println("Found result file at: " + filePath);
                return ResponseEntity.ok().body(resource);
            } else {
                System.err.println("Result file not found or not readable: " + filePath);
                return ResponseEntity.notFound().build();
            }
         } catch (Exception e) {
             System.err.println("Error serving result file " + filename + ": " + e.getMessage());
             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
         }
    }

    // Health check endpoints - handle both root and empty path
    @GetMapping(value = {"/", ""})
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("API is running");
    }
}
