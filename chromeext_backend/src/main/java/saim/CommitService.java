package saim;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CommitService {
    
    @Autowired
    private CommitDetailsRepo repo;

    public Optional<String> getCommitfromDB(String url, String id){
        Optional<Commit> c = repo.findByUrlAndCommitId(url,id);
        return c.map(Commit::getCommitMessage);
    }
    public Commit saveCommit(String commitID, String url, String msg){
        Commit c = new Commit();
        c.setCommitId(commitID);
        c.setUrl(url);
        c.setCommitMessage(msg);
        return repo.save(c);
    }
}
