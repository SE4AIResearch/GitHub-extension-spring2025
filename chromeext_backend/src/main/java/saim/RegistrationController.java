package saim;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.HashMap;

@RestController
public class RegistrationController {

    @Autowired
    private ApiKeyRepo apiKeyRepo;

    /**
     * The endpoint for registering a new application instance.
     * Using a new ApiKey entity with a randomly generated UUID 
     * and returns the UUID to the client.
     * 
     * @return A map containing the UUID
     */
    @CrossOrigin(origins = "*")
    @GetMapping("/register-app")
    public ResponseEntity<Map<String, String>> registerApp() {
        ApiKey newApiKey = new ApiKey();
        apiKeyRepo.save(newApiKey);

        Map<String, String> response = new HashMap<>();
        response.put("uuid", newApiKey.getUuid());

        return ResponseEntity.ok(response);
    }
}
