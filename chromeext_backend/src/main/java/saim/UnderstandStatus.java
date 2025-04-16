package saim;

// Ensure this class is public so it can be accessed from other packages (like controller)
public class UnderstandStatus {
    public UnderstandStatusValue status;
    public String message; // Optional: for error messages
    public String[] outputFiles; // Optional: paths or names of result files
    public int progress; // Progress percentage (0-100)

    // Default constructor for frameworks like Jackson (JSON serialization)
    public UnderstandStatus() {}

    public UnderstandStatus(UnderstandStatusValue status) {
        this.status = status;
        this.progress = 0;
    }

    public UnderstandStatus(UnderstandStatusValue status, String message) {
        this.status = status;
        this.message = message;
        this.progress = 0;
    }
    
    public UnderstandStatus(UnderstandStatusValue status, int progress) {
        this.status = status;
        this.progress = progress;
    }

    public UnderstandStatus(UnderstandStatusValue status, String message, int progress) {
        this.status = status;
        this.message = message;
        this.progress = progress;
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

    public int getProgress() {
        return progress;
    }
    
    public void setProgress(int progress) {
        this.progress = progress;
    }
}
