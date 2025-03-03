package saim;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ApiKeyRepo extends JpaRepository<ApiKey, Integer> {
    
    /**
     * For finding an ApiKey by its UUID
     * 
     * @param uuid The UUID to search for
     * @return An Optional containing the ApiKey if found, or empty if not found
     */
    Optional<ApiKey> findByUuid(String uuid);
}
