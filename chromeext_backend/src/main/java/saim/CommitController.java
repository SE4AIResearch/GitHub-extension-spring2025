package saim;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.google.gson.Gson;

@RestController
@RequestMapping("/api/commits")
public class CommitController {

    @Autowired
    private CommitService commitService;

    @Autowired
    private CommitRefactoringsRepository commitRefactoringsRepository;  // 🛜 New Injection

    private final Gson gson = new Gson();

    /**
     * GET /api/commits/message?url={url}&id={commitId}
     * 
     * @param url       the repository URL
     * @param commitId  the commit identifier
     * @return          JSON with "commitMessage" and "refactorings" or error
     */
    @GetMapping("/message")
    public ResponseEntity<String> getCommitMessage(
            @RequestParam("url") String url,
            @RequestParam("id") String commitId) {
        
        Optional<String> messageOpt = commitService.getCommitfromDB(url, commitId);
        Optional<CommitRefactorings> refactoringsOpt = commitRefactoringsRepository.findByCommitId(commitId);

        if (messageOpt.isPresent()) {
            Map<String, String> resp = new HashMap<>();
            resp.put("commitMessage", messageOpt.get());
            if (refactoringsOpt.isPresent()) {
                resp.put("refactorings", refactoringsOpt.get().getRefactorings());
            } else {
                resp.put("refactorings", "No refactorings found");
            }
            return ResponseEntity.ok(gson.toJson(resp));
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Commit not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                 .body(gson.toJson(error));
        }
    }
}
