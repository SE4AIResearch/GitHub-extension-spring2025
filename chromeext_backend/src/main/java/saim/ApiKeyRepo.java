package saim;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ApiKeyRepo extends JpaRepository<ApiKey, Long>{

    Optional<ApiKey> findByUuid(String uuid);
}
