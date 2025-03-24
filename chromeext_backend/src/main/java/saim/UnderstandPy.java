package saim;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

public class UnderstandPy {
    public static void main(String[] args) {
        if (args.length < 1) {
            System.err.println("Usage: java PythonServiceCaller <repo-url-or-path>");
            System.exit(1);
        }
        String repo = args[0];

        String scriptPath = "chromeext_metrics/understand.py"; 

        List<String> command = new ArrayList<>();
        command.add("python");      
        command.add(scriptPath);
        command.add(repo);
        
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectErrorStream(true);
        
        try {
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            System.out.println("Output from Python service:");
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
            int exitCode = process.waitFor();
            System.out.println("Python service exited with code: " + exitCode);
        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
        }
    }
}
