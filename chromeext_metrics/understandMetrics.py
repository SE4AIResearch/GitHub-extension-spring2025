#
# Sample Understand Python API program 
#
# Synopsis: Outputs metrics for specified kinds of entities
#
# Categories: Project Metrics, Entity Metrics
#
# Languages: Ada, Fortran, C/C++, Java
#
# Written by Jason Quinn
#

# 1/22/21

import understand
import sys
import argparse
import subprocess
import os
import json 

# --- Helper Functions ---

# Function for finding the Understand executable path
def find_understand_executable():
    potential_paths = [
        r"C:\Program Files\SciTools\bin\pc-win64\und.exe", # Windows
        "/Applications/Understand.app/Contents/MacOS/und", # macOS
        "/opt/scitools/bin/und", # Linux
        "/usr/local/bin/und", # Linux
    ]
    
    for path in potential_paths:
        if path and os.path.isfile(path):
            print(f"Found Understand executable at: {path}", file=sys.stderr)
            return path

    print("Warning: Understand executable not found in common locations. Using 'und' and relying on PATH.", file=sys.stderr)
    return "und"

# Function for running a command and capturing its output
def run_command(command, cwd=None, shell=False):
    print(f"Running: {' '.join(command) if isinstance(command, list) else command}", file=sys.stderr)
    try:
        result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=False, cwd=cwd, shell=shell)
        output = result.stdout
        if result.stderr:
            if output and not output.endswith('\n'):
                output += "\n"
            output += "STDERR: " + result.stderr
        
        if result.returncode != 0:
            print(f"Warning: Command finished with return code {result.returncode}", file=sys.stderr)
            print(f"Output:\n{output}", file=sys.stderr)

        return output, result.returncode
    except FileNotFoundError:
        cmd_name = command[0] if isinstance(command, list) else command.split()[0]
        print(f"ERROR: Command executable not found: {cmd_name}", file=sys.stderr)
        return f"ERROR: Command executable not found: {cmd_name}", -1
    except Exception as e:
        print(f"ERROR: Failed to run command '{' '.join(command) if isinstance(command, list) else command}': {e}", file=sys.stderr)
        return f"ERROR: Failed to run command: {e}", -1

# Function for creating/checking Understand database using 'und create'
def create_database(src_dir, db_path_with_ext, und_executable, language="all"):
    print(f"Checking/Creating Understand database at {db_path_with_ext}", file=sys.stderr)
    print(f"Source directory: {src_dir}", file=sys.stderr)

    if os.path.exists(db_path_with_ext):
        print(f"Database already exists at {db_path_with_ext}. Skipping creation.", file=sys.stderr)
        return True
    else:
        print("Creating a new Understand database using command-line...", file=sys.stderr)
        # Remove .und extension for create command if present in und_executable logic
        db_base_path = os.path.splitext(db_path_with_ext)[0]
        create_cmd = [und_executable, "create", "-languages", language, db_base_path]
        stdout, returncode = run_command(create_cmd)
        
        if returncode != 0:
            print(f"ERROR: Failed to create database {db_path_with_ext} with language '{language}'.", file=sys.stderr)
            return False
        else:
            if os.path.exists(db_path_with_ext):
                 print(f"Database {db_path_with_ext} created successfully.", file=sys.stderr)
                 return True
            else:
                 print(f"ERROR: 'und create' command succeeded but database file {db_path_with_ext} not found.", file=sys.stderr)
                 return False

# Function for adding source code to the database using 'und add'
def add_source_code(src_dir, db_path_with_ext, und_executable):
    print(f"Adding source code from {src_dir} to database {db_path_with_ext}...", file=sys.stderr)
    add_cmd = [und_executable, "add", src_dir, db_path_with_ext]
    stdout, returncode = run_command(add_cmd)
    
    if returncode != 0:
        print("ERROR: Failed to add source code.", file=sys.stderr)
        return False
    
    print("Source code added successfully.", file=sys.stderr)
    return True

# Function for analyzing the database using 'und analyze'
def analyze_database(db_path_with_ext, und_executable):
    print(f"Analyzing database {db_path_with_ext}...", file=sys.stderr)
    analyze_cmd = [und_executable, "analyze", db_path_with_ext]
    stdout, returncode = run_command(analyze_cmd)
    
    if returncode != 0:
        print("ERROR: Failed to analyze database.", file=sys.stderr)
        return False
    
    print("Database analyzed successfully.", file=sys.stderr)
    return True

# --- Understand API Functions (Modified to return data) ---

# Gather project metrics
def get_project_metrics(db):
    required_metrics = ["CountLineCode"]
    metrics = db.metric(required_metrics)
    # Return a simple dictionary {metric_name: value}
    return metrics if metrics else {}

# Gather metrics for class entities
def get_class_metrics(db):
    class_metrics_list = [
        'CountClassCoupled',
        'PercentLackOfCohesion',
        'SumCyclomatic',
        'MaxInheritanceTree',
        'CountClassDerived'
    ]
    class_kind_filter = "Class" # Adjust if needed
    
    results = []
    try:
        ents = db.ents(class_kind_filter)
    except understand.UnderstandError:
        print(f"Warning: Could not query for kind '{class_kind_filter}'.", file=sys.stderr)
        ents = [] # Ensure ents is iterable

    if not ents:
        print(f"No entities found matching kind '{class_kind_filter}'.", file=sys.stderr)
        return results

    print(f"Processing {len(ents)} entities of kind '{class_kind_filter}'...", file=sys.stderr)
    for ent in ents:
        entity_data = {}
        try:
            metrics = ent.metric(class_metrics_list)
            if metrics:
                entity_data['name'] = ent.longname()
                entity_data['kind'] = ent.kindname()
                ref = ent.ref()
                if ref:
                    file_obj = ref.file()
                    entity_data['file'] = file_obj.longname() if file_obj else None
                    entity_data['line'] = ref.line()
                else:
                    entity_data['file'] = None
                    entity_data['line'] = None
                
                # Add metrics, replacing None with null for JSON compatibility if desired
                # Or keep None, Python's json module handles it correctly
                entity_data['metrics'] = {key: metrics.get(key) for key in class_metrics_list}
                
                results.append(entity_data)

        except understand.UnderstandError as e:
            ent_name = "<Unknown>"
            try: ent_name = ent.longname()
            except: pass
            print(f"ERROR processing class entity {ent_name}: {e}", file=sys.stderr)
            continue
            
    return results

# Find entities (methods/functions) with Cyclomatic complexity and return data
def get_cyclomatic_entities(db):
    possible_kinds = ["Function", "Method", "Procedure", "Subroutine", "Task", "Constructor"]
    cyclomatic_metric_name = "Cyclomatic"
    results = []
    found_total = 0

    for kind_filter in possible_kinds:
        #ents_in_kind = 0
        found_in_kind = 0
        try:
            ents = db.ents(kind_filter)
            #ents_in_kind = len(ents) if ents else 0
        except understand.UnderstandError as e:
            print(f"Warning: Could not query for kind '{kind_filter}': {e}", file=sys.stderr)
            continue

        if not ents:
            continue
        
        # print(f"Checking {ents_in_kind} entities of kind '{kind_filter}'...", file=sys.stderr)
        for ent in ents:
            entity_data = {}
            try:
                metrics = ent.metric([cyclomatic_metric_name])
                cyclo_value = metrics.get(cyclomatic_metric_name)

                if cyclo_value is not None:
                    found_in_kind += 1
                    entity_data['name'] = ent.longname()
                    entity_data['kind'] = ent.kindname()
                    ref = ent.ref()
                    if ref:
                        file_obj = ref.file()
                        entity_data['file'] = file_obj.longname() if file_obj else None
                        entity_data['line'] = ref.line()
                    else:
                        entity_data['file'] = None
                        entity_data['line'] = None
                    entity_data['metrics'] = {cyclomatic_metric_name: cyclo_value}
                    results.append(entity_data)

            except understand.UnderstandError as e:
                ent_name = "<Unknown>"
                try: ent_name = ent.longname()
                except: pass
                print(f"ERROR processing cyclomatic entity {ent_name}: {e}", file=sys.stderr)
                continue
        # if found_in_kind > 0:
        #    print(f"  Found {found_in_kind} entities with Cyclomatic in kind '{kind_filter}'.", file=sys.stderr)
        found_total += found_in_kind
        
    print(f"Found {found_total} total entities with Cyclomatic complexity.", file=sys.stderr)
    return results

# --- Main Execution Logic ---

if __name__ == '__main__':
    # --- Argument Parsing and Setup ---
    parser = argparse.ArgumentParser(description="Create/Analyze Understand DB and extract metrics as JSON.")
    parser.add_argument("src_dir", help="Specify source code directory path.")
    parser.add_argument("-l", "--language", help="Specify project language for creation (e.g., Java, C++, Python). Default: 'all'", default="all")
    parser.add_argument("--db_name", help="Optional: Specify a base name for the Understand database file (without .und extension). Defaults to source directory name.", default=None)
    args = parser.parse_args()

    # --- Get Absolute Paths and Validate ---
    src_dir = os.path.abspath(args.src_dir)
    language = args.language
    if not os.path.isdir(src_dir):
        print(f"ERROR: Source directory not found or is not a directory: {src_dir}", file=sys.stderr)
        sys.exit(1)

    # --- Determine DB Path ---
    db_name_base = args.db_name if args.db_name else os.path.basename(src_dir)
    parent_dir = os.path.dirname(src_dir)
    db_path = os.path.join(parent_dir, db_name_base + ".und")
    
    print(f"Source Directory: {src_dir}", file=sys.stderr)
    print(f"Database Path: {db_path}", file=sys.stderr)
    print(f"Language for DB creation: {language}", file=sys.stderr)

    # --- Find 'und' Executable ---
    und_executable = find_understand_executable()
    if und_executable == "und":
        print("Using 'und' from PATH.", file=sys.stderr)
    elif und_executable != "und":
         print(f"Using Understand executable: {und_executable}", file=sys.stderr)

    # --- Database Operations (create, add, analyze) ---
    if not create_database(src_dir, db_path, und_executable, language):
        sys.exit(1)
    if not add_source_code(src_dir, db_path, und_executable):
        sys.exit(1)
    if not analyze_database(db_path, und_executable):
        sys.exit(1)

    # --- Metric Extraction using Understand API ---
    db = None
    all_metrics_data = {
        "project_metrics": {},
        "class_metrics": [],
        "cyclomatic_metrics": []
    }
    exit_code = 0

    try:
        print(f"\nOpening Database {db_path} with Understand API...", file=sys.stderr)
        db = understand.open(db_path)
        print("Database opened successfully via API.", file=sys.stderr)

        # Get metrics data
        all_metrics_data["project_metrics"] = get_project_metrics(db)
        all_metrics_data["class_metrics"] = get_class_metrics(db)
        all_metrics_data["cyclomatic_metrics"] = get_cyclomatic_entities(db)
        
        print("Metric extraction complete.", file=sys.stderr)

    except understand.UnderstandError as e:
        print(f"ERROR: An Understand API error occurred: {e}", file=sys.stderr)
        exit_code = 1 # Indicate failure
    except Exception as e:
        print(f"ERROR: An unexpected error occurred during API operations: {e}", file=sys.stderr)
        exit_code = 1 # Indicate failure
    finally:
        if db:
            db.close()
            print("Database closed via API.", file=sys.stderr)

    # --- Output JSON to stdout --- 
    if exit_code == 0:
        try:
            # Use indent for readability, remove for smaller size if needed
            json_output = json.dumps(all_metrics_data, indent=2) 
            print(json_output) # Print JSON to standard output
        except Exception as e:
            print(f"ERROR: Failed to serialize metrics data to JSON: {e}", file=sys.stderr)
            exit_code = 1
    else:
        # Optionally print an empty JSON or error message to stdout on failure?
        # For now, just rely on stderr messages and exit code.
        print("Metric extraction failed. No JSON output.", file=sys.stderr)

    sys.exit(exit_code)