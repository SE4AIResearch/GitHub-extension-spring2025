#!/usr/bin/env python3
import argparse
import subprocess
import tempfile
import shutil
import os
import sys
import shlex
# from aider.coders import Coder


def run(cmd):
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode:
        print(f"ERROR: {' '.join(cmd)}\n{result.stderr}", file=sys.stderr)
        sys.exit(result.returncode)
    return result.stdout.strip()

def clone_repo(repo_url):
    tmp = tempfile.mkdtemp(prefix="aider_repo_")
    run(["git", "clone", "--depth", "1", repo_url, tmp])
    return tmp

def get_summary_from_aider(repo_url):
    repo_url = str(repo_url)
    is_remote = repo_url.startswith(("http://", "https://", "git@"))
    if is_remote:
        src_dir = clone_repo(repo_url)
    else:
        src_dir = os.path.abspath(repo_url)
        if not os.path.isdir(src_dir):
            print("ERROR: Repository path not found.", file=sys.stderr)
            sys.exit(1)
    
    message = "give me a brief summary of the project including a brief list of files (not all)"
    quoted_message = shlex.quote(message)
    
    command_string = f"aider --no-gitignore --reasoning-effort 2 --yes-always --message {quoted_message} {shlex.quote(src_dir)}"
    print("Full command string:", command_string)
    
    print("Executing Aider command...")
    try:
        result = subprocess.run(
            command_string,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=300
        )
    except subprocess.TimeoutExpired:
        print("ERROR: Aider command timed out.", file=sys.stderr)
        if is_remote:
            shutil.rmtree(src_dir)
        sys.exit(1)
    
    if result.returncode:
        print(f"ERROR executing command:\n{result.stderr}", file=sys.stderr)
        if is_remote:
            shutil.rmtree(src_dir)
        sys.exit(result.returncode)
    else:
        summary = result.stdout.strip()
        print("Aider Output:\n", summary)
    
    if is_remote:
        print("\nCleaning up temporary cloned repository ...")
        shutil.rmtree(src_dir)
    
    return summary

def main():
    parser = argparse.ArgumentParser(description="Aider Project Summary")
    parser.add_argument("repo", help="Git URL or local path of the repository")
    args = parser.parse_args()

    # Determine if we should clone or use existing local repo
    if args.repo.startswith(("http://", "https://", "git@")):
        src_dir = clone_repo(args.repo)
    else:
        src_dir = os.path.abspath(args.repo)
        if not os.path.isdir(src_dir):
            print("ERROR: Path not found.", file=sys.stderr)
            sys.exit(1)

    print("Source Directory: ", src_dir)
    
    # Build the aider command
    message = "\"give me a brief summary of the project including files\""
    aider_cmd = ["aider", "--no-gitignore", "--message", message, src_dir]
    # message = "give me a brief summary of the project including files"
    # aider_cmd = ["aider", "--message \"", message, "\"", src_dir]
    # aider_cmd = f'aider --message "{message}" {src_dir}'
    # aider_cmd = shlex.split(aider_cmd)
    
    # Call aider and capture its summary output
    # summary = run(aider_cmd)
    
    # print("\nProject Summary:")
    # print(summary)
    message = "\"give me a brief summary of the project including a brief list of files (not all) in a json format\""
    command_string = f"aider --no-gitignore --reasoning-effort 2  --yes-always --message {message} {src_dir}"
    print("Full command string:", command_string)
    
    print("Executing Aider command...")
    result = subprocess.run(command_string, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=120)
    
    if result.returncode:
        print(f"ERROR executing command:\n{result.stderr}", file=sys.stderr)
        sys.exit(result.returncode)
    else:
        print("Aider Output:\n", result.stdout.strip())
    
    
    # Cleanup the temporary clone if a remote repository was used
    if args.repo.startswith(("http://", "https://", "git@")):
        print("\nCleaning up temporary cloned repository ...")
        shutil.rmtree(src_dir)

if __name__ == "__main__":
    main()
