package saim;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommitDetailsRepo extends JpaRepository<Commit, Long>
{
    @Query("SELECT c FROM Commit c WHERE c.url = :url AND c.commitID = :commitId")
    Optional<Commit> findByUrlAndCommitId(@Param("url") String url, @Param("commitId") String commitId);
}
