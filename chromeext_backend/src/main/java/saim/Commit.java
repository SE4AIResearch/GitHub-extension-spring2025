package saim;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "commit_details")
public class Commit {
  @Id
  @GeneratedValue(strategy=GenerationType.AUTO)
  private Long id;

  @Column(name = "commit_id")
  private String commitID;

  @Column(name = "url")
  private String url;

  @Column(name = "commit_message", length = 1000)
  private String commitmessage;

  public Long getId() {
    return id;
  }
  public void setId(Long id) {
    this.id = id;
  }

  public String getCommitId() {
    return commitID;
  }
  public void setCommitId(String commitid) {
    this.commitID = commitid;
  }

  public String getUrl() {
    return url;
  }
  public void setUrl(String url) {
    this.url = url;
  }

public String getCommitMessage(){
    return commitmessage;
}
public void setCommitMessage(String commit){
    this.commitmessage = commit;
}

}