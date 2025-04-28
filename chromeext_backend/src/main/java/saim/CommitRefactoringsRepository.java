package saim;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CommitRefactoringsRepository extends JpaRepository<CommitRefactorings, Long> {
    Optional<CommitRefactorings> findByCommitId(String commitId);
}
