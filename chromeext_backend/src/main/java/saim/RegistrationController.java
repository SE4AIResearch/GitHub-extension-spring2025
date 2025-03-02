package saim;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import  java.util.HashMap;

@RestController
public class RegistrationController {

    @Autowired
    private ApiKeyRepo apiKeyRepo;

    @CrossOrigin(origins = "http://localhost:8080/")
    @GetMapping("/register-app")
    public Map<String, String> registerApp() {
        ApiKey newApiKey = new ApiKey();
        apiKeyRepo.save(newApiKey);

        Map<String, String> response = new HashMap<>();
        response.put("uuid", newApiKey.getUuid());

        return response;
    }
}
