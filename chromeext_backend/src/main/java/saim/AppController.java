package saim;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
public class AppController {

    @Autowired
    private ApiKeyRepo apiKeyRepo;

    @CrossOrigin(origins = "http://localhost:8080/")
    @PostMapping("/add-llm-key")
    public ResponseEntity<Map<String, String>> addLlmKey(@RequestParam("uuid") String uuid,
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

    @CrossOrigin(origins = "http://localhost:8080/")
    @PostMapping("/add-github-key")
    public ResponseEntity<Map<String, String>> addGithubKey(@RequestParam("uuid") String uuid,
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
}
