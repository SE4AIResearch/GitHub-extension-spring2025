package saim;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "commit_refactorings")
public class CommitRefactorings {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "commit_id", nullable = false)
    private String commitId;

    @Column(name = "refactorings", columnDefinition = "TEXT")
    private String refactorings;

    public CommitRefactorings() {}

    public CommitRefactorings(String commitId, String refactorings) {
        this.commitId = commitId;
        this.refactorings = refactorings;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public String getCommitId() {
        return commitId;
    }

    public void setCommitId(String commitId) {
        this.commitId = commitId;
    }

    public String getRefactorings() {
        return refactorings;
    }

    public void setRefactorings(String refactorings) {
        this.refactorings = refactorings;
    }
}
