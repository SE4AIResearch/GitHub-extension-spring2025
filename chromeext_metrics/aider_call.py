#!/usr/bin/env python3
import argparse
import subprocess
import textwrap
import shutil
import os
import sys
import stat
import shlex
import re

def run(cmd):
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode:
        print(f"ERROR: {' '.join(cmd)}\n{result.stderr}", file=sys.stderr)
        sys.exit(result.returncode)
    return result.stdout.strip()

def get_script_dir():
    # Get the absolute path of the directory where this script is located.
    return os.path.dirname(os.path.abspath(__file__))

def remove_readonly(func, path, excinfo):
    """
    Error handler for `shutil.rmtree` to change file permission and retry.
    """
    # Remove read-only attribute and try again
    os.chmod(path, stat.S_IWRITE)
    func(path)

def clone_repo(repo_url):
    # Create a clone destination in the script's directory
    script_dir = get_script_dir()
    dest_dir = os.path.join(script_dir, "cloned_repo")
    
    # If the directory exists, remove it first for a clean clone
    if os.path.isdir(dest_dir):
        print(f"Removing existing directory: {dest_dir}")
        shutil.rmtree(dest_dir, onerror=remove_readonly)
    
    print(f"Cloning repository into: {dest_dir}")
    run(["git", "clone", "--depth", "1", repo_url, dest_dir])
    return dest_dir

def _trim_aider_output(raw: str) -> str:
    """
    Keep only the part starting at 'Summary:' and ending after the JSON list.
    Falls back to the full text if it cannot be parsed.
    """
    m = re.search(
        r"(?s)Summary:\s*.*?\nKey Files:\s*\n\[[^\]]*\]",
        raw
    )
    return m.group(0).strip() if m else raw.strip()

def get_summary_from_aider(repo_url: str) -> str:
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ OPENAI_API_KEY not found in environment", file=sys.stderr)
        sys.exit(1)

    """Run Aider on the repo and return just the formatted summary block."""
    is_remote = repo_url.startswith(("http://", "https://", "git@"))
    if is_remote:
        src_dir = clone_repo(repo_url)
    else:
        src_dir = os.path.abspath(repo_url)
        if not os.path.isdir(src_dir):
            print("ERROR: Repository path not found.", file=sys.stderr)
            sys.exit(1)
    
    message = textwrap.dedent("""\
        Give me a 5‑7 sentence, one‑paragraph summary of the project and a
        JSON‑formatted list of 5‑7 key files with a 1-2 sentence description of each file.
        The format should be as follows:
        Summary:
        <summary of the project>
        Key Files:
        [
        {
            "file" : 1
            "path": "path/to/file1",
            "description: 1-2 sentence description of file1"
        },
        {
            "file" : 2
            "path": "path/to/file2",
            "description: 1-2 sentence description of file2"
        },
        ...
        ]
    """)

    cmd = [
        "/usr/local/bin/aider",
        "--no-gitignore",
        "--reasoning-effort", "2",
        "--yes-always",
        "--message", message,
        src_dir,
    ]

    print("Executing Aider command …")
    print("Full command string:", cmd)

    try:
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=600
        )
    except subprocess.TimeoutExpired:
        print("ERROR: Aider command timed out.", file=sys.stderr)
        if is_remote:
            shutil.rmtree(src_dir, onerror=remove_readonly)
        return ''
    
    if result.returncode:
        print(f"ERROR executing command:\n{result.stderr}", file=sys.stderr)
        if is_remote:
            shutil.rmtree(src_dir, onerror=remove_readonly)
        return ''
    
    trimmed = _trim_aider_output(result.stdout)
    
    if is_remote:
        print("\nCleaning up cloned repository ...")
        shutil.rmtree(src_dir, onerror=remove_readonly)
    
    return trimmed

def main():
    parser = argparse.ArgumentParser(description="Aider Project Summary")
    parser.add_argument("repo", help="Git URL or local path of the repository")
    args = parser.parse_args()

    summary = get_summary_from_aider(args.repo)
    if summary:
        print("\n=== Final Summary ===")
        print(summary)

if __name__ == "__main__":
    main()
