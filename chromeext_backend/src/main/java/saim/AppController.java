package saim;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class AppController {

    @Autowired
    private ApiKeyRepo apiKeyRepo;

    /**
     * This is the endpoint to add or update an OpenAI LLM API key for a given UUID
     * 
     * @param uuid The UUID of the application instance
     * @param llmKey The OpenAI LLM API key to store
     * @return A response indicating success or failure
     */
    @CrossOrigin(origins = "*")
    @PostMapping("/add-llm-key")
    public ResponseEntity<Map<String, String>> addLlmKey(
            @RequestParam("uuid") String uuid,
            @RequestParam("llmKey") String llmKey) {
        
        Optional<ApiKey> optionalApiKey = apiKeyRepo.findByUuid(uuid);
        if (optionalApiKey.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "UUID not found"));
        }

        ApiKey apiKey = optionalApiKey.get();
        apiKey.setOpenaiLlmApiKey(llmKey);
        apiKeyRepo.save(apiKey);

        return ResponseEntity.ok(Map.of("message", "LLM key updated successfully"));
    }

    /**
     * This is the endpoint to add or update a GitHub API key for a given UUID
     * 
     * @param uuid The UUID of the application instance
     * @param githubKey The GitHub API key to store
     * @return A response indicating success or failure
     */
    @CrossOrigin(origins = "*")
    @PostMapping("/add-github-key")
    public ResponseEntity<Map<String, String>> addGithubKey(
            @RequestParam("uuid") String uuid,
            @RequestParam("githubKey") String githubKey) {
        
        Optional<ApiKey> optionalApiKey = apiKeyRepo.findByUuid(uuid);
        if (optionalApiKey.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "UUID not found"));
        }

        ApiKey apiKey = optionalApiKey.get();
        apiKey.setGithubApiKey(githubKey);
        apiKeyRepo.save(apiKey);

        return ResponseEntity.ok(Map.of("message", "GitHub key updated successfully"));
    }
    
    /**
     * This is the endpoint to retrieve API keys for a given UUID
     * 
     * @param uuid The UUID of the application instance
     * @return A response containing the API keys or an error message
     */
    @CrossOrigin(origins = "*")
    @GetMapping("/get-keys")
    public ResponseEntity<?> getKeys(@RequestParam("uuid") String uuid) {
        Optional<ApiKey> optionalApiKey = apiKeyRepo.findByUuid(uuid);
        if (optionalApiKey.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "UUID not found"));
        }

        ApiKey apiKey = optionalApiKey.get();
        Map<String, String> response = Map.of(
            "githubApiKey", apiKey.getGithubApiKey() != null ? apiKey.getGithubApiKey() : "",
            "openaiLlmApiKey", apiKey.getOpenaiLlmApiKey() != null ? apiKey.getOpenaiLlmApiKey() : ""
        );

        return ResponseEntity.ok(response);
    }
}
