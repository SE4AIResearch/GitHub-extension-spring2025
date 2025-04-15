package saim;

// Ensure this class is public so it can be accessed from other packages (like controller)
public class UnderstandStatus {
    public UnderstandStatusValue status;
    public String message; // Optional: for error messages
    public String[] outputFiles; // Optional: paths or names of result files

    // Default constructor for frameworks like Jackson (JSON serialization)
    public UnderstandStatus() {}

    public UnderstandStatus(UnderstandStatusValue status) {
        this.status = status;
    }

    public UnderstandStatus(UnderstandStatusValue status, String message) {
        this.status = status;
        this.message = message;
    }

    // Getters and setters might be needed depending on JSON library or usage
    public UnderstandStatusValue getStatus() {
        return status;
    }

    public void setStatus(UnderstandStatusValue status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String[] getOutputFiles() {
        return outputFiles;
    }

    public void setOutputFiles(String[] outputFiles) {
        this.outputFiles = outputFiles;
    }
}
