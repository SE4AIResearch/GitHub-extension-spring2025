import argparse, subprocess, tempfile, shutil, json, os, sys

def run(cmd):
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode:
        print(f"ERROR: {' '.join(cmd)}\n{result.stderr}", file=sys.stderr)
        sys.exit(result.returncode)
    return result.stdout.strip()

def clone_repo(repo_url):
    tmp = tempfile.mkdtemp(prefix="und_repo_")
    run(["git", "clone", "--depth", "1", repo_url, tmp])
    return tmp

def create_and_analyze(src_dir, db_file, output_dir):
    print(f"Creating Understand database at {db_file} …")
    print(f"Source directory: {src_dir}")

    create_out = run([
        "und", "create",
        "-languages", "java",
        db_file
    ])
    print(create_out)

    db_file += ".und"

    print('Db file with .und extension: ', db_file)

    add_out = run(["und", "add", src_dir, db_file])
    print(add_out)

    output_out = run(["und", "settings", '-reportOutputDirectory', output_dir, db_file])
    print(output_out)

    metrics_out = run(["und", "settings", '-metrics', 'all', db_file])
    print(metrics_out)

    print("Analyzing database …")
    analyze_out = run(["und", "analyze", db_file])
    print(analyze_out)

def fetch_metrics(db_file, metrics):
    cmd = ["und", "metrics", 'Cyclomatic', '-db' ,db_file+'.und']
    output = run(cmd)
    print(output)

def main():
    parser = argparse.ArgumentParser(description="CommitPro")
    parser.add_argument("repo", help="git URL or local path")
    parser.add_argument("--metrics", nargs="+", default=["CountLine", "CountFunction"])
    args = parser.parse_args()

    if args.repo.startswith(("http://","https://","git@")):
        src = clone_repo(args.repo)
    else:
        src = os.path.abspath(args.repo)
        if not os.path.isdir(src):
            print("ERROR: Path not found.", file=sys.stderr)
            sys.exit(1)
    

    print("Source Directory: ", src)
    output_dir = tempfile.mkdtemp(prefix="und_output_")
    temp_dir = tempfile.gettempdir()
    print(temp_dir)
    db = os.path.join(tempfile.gettempdir(), "und_project")
    print("Temo File Path: ", db)
    create_and_analyze(src, db, output_dir)
    metrics = fetch_metrics(db, args.metrics)
    # print(json.dumps(metrics, indent=2))

    # if args.repo.startswith(("http://","https://","git@")):
    #     shutil.rmtree(src)
    # try:
    #     os.remove(db + ".und")
    # except PermissionError:
    #     subprocess.run(["sudo", "rm", "-rf", db + ".und"])

if __name__ == "__main__":
    main()
