package saim;

import org.springframework.stereotype.Component;

/**
 * Utility class for validating API keys
 */
@Component
public class ApiKeyValidator {

    /**
     * Validates a GitHub API key
     * 
     * @param githubApiKey The GitHub API key to validate
     * @return true if the key is valid, false otherwise
     */
    public boolean isValidGithubApiKey(String githubApiKey) {
        // Basic validation - check if the key is not null or empty
        if (githubApiKey == null || githubApiKey.trim().isEmpty()) {
            return false;
        }
        
        // GitHub personal access tokens typically start with "ghp_" for fine-grained tokens
        // or are 40 characters long for classic tokens
        return githubApiKey.startsWith("ghp_") || 
               (githubApiKey.length() == 40 && githubApiKey.matches("[a-zA-Z0-9]+"));
    }

    /**
     * Validates an OpenAI API key
     * 
     * @param openaiApiKey The OpenAI API key to validate
     * @return true if the key is valid, false otherwise
     */
    public boolean isValidOpenaiApiKey(String openaiApiKey) {
        // Basic validation - check if the key is not null or empty
        if (openaiApiKey == null || openaiApiKey.trim().isEmpty()) {
            return false;
        }
        
        // OpenAI API keys typically start with "sk-" and are followed by a string of characters
        return openaiApiKey.startsWith("sk-") && openaiApiKey.length() >= 20;
    }
} 