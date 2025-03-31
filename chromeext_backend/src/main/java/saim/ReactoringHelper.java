package saim;

public class ReactoringHelper {

    public String getRepoUrl(String url) {
        if (!url.endsWith(".git")) {
            return url + ".git";
        }
        return url;
    }

    public String cleanCommitId(String id) {
        if (id.contains("#")) {
            id = id.substring(0, id.indexOf("#"));
            System.out.println("Cleaned commit ID: " + id);
        }
        return id;
    }
}
