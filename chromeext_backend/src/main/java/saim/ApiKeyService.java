package saim;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Service class for API key operations
 */
@Service
public class ApiKeyService {

    @Autowired
    private ApiKeyRepo apiKeyRepo;

    /**
     * Create a new API key entry
     * 
     * @return The newly created ApiKey
     */
    @Transactional
    public ApiKey createApiKey() {
        ApiKey newApiKey = new ApiKey();
        return apiKeyRepo.save(newApiKey);
    }

    /**
     * Find an API key by UUID
     * 
     * @param uuid The UUID to search for
     * @return An Optional containing the ApiKey if found, or empty if not found
     */
    public Optional<ApiKey> findByUuid(String uuid) {
        return apiKeyRepo.findByUuid(uuid);
    }

    /**
     * Update the GitHub API key for a given UUID
     * 
     * @param uuid The UUID of the application instance
     * @param githubApiKey The GitHub API key to store
     * @return true if the update was successful, false if the UUID was not found
     */
    @Transactional
    public boolean updateGithubApiKey(String uuid, String githubApiKey) {
        Optional<ApiKey> optionalApiKey = apiKeyRepo.findByUuid(uuid);
        if (optionalApiKey.isEmpty()) {
            return false;
        }

        ApiKey apiKey = optionalApiKey.get();
        apiKey.setGithubApiKey(githubApiKey);
        apiKeyRepo.save(apiKey);
        return true;
    }

    /**
     * Update the OpenAI LLM API key for a given UUID
     * 
     * @param uuid The UUID of the application instance
     * @param openaiLlmApiKey The OpenAI LLM API key to store
     * @return true if the update was successful, false if the UUID was not found
     */
    @Transactional
    public boolean updateOpenaiLlmApiKey(String uuid, String openaiLlmApiKey) {
        Optional<ApiKey> optionalApiKey = apiKeyRepo.findByUuid(uuid);
        if (optionalApiKey.isEmpty()) {
            return false;
        }

        ApiKey apiKey = optionalApiKey.get();
        apiKey.setOpenaiLlmApiKey(openaiLlmApiKey);
        apiKeyRepo.save(apiKey);
        return true;
    }
} 