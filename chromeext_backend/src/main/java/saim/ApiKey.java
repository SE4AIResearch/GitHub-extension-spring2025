package saim;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "api_keys")
public class ApiKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Using a CHAR(36) column for UUID
    @Column(nullable = false, length = 36, unique = true)
    private String uuid = UUID.randomUUID().toString();

    @Column(name = "github_api_key", nullable = true, length = 255)
    private String githubApiKey;

    @Column(name = "openai_llm_api_key", nullable = true, length = 255)
    private String openaiLlmApiKey;

    // Database provides a default value if not set, but you can also initialize it here if desired.
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public ApiKey() {}


    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public String getGithubApiKey() {
        return githubApiKey;
    }

    public void setGithubApiKey(String githubApiKey) {
        this.githubApiKey = githubApiKey;
    }

    public String getOpenaiLlmApiKey() {
        return openaiLlmApiKey;
    }

    public void setOpenaiLlmApiKey(String openaiLlmApiKey) {
        this.openaiLlmApiKey = openaiLlmApiKey;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
