#!/usr/bin/env python3

import os
import shutil
import json
from git import Repo
import requests
import sys
import glob

# A tiny script to aid in updating languages.json,
# Mostly verifies paths and prints out warnings for non-standard parser repos

def clone_tmp_repo(lang):
    try:
        shutil.rmtree("/tmp/unifier", ignore_errors=True)
        repo = Repo.clone_from(lang["repo"], "/tmp/unifier")
        return True
    except Exception as e:
        print(f"Error cloning {lang['repo']}: {str(e)}")
        return False

def define_root_queries(lang):
    if not os.path.exists("/tmp/unifier/queries"):
        print("- WARN: Queries dir not found")
        return
    
    entry = {
        "match_block": [],
        "highlights": "queries/highlights.scm",
        "locals": "queries/locals.scm",
        "injections": "queries/injections.scm"
    }
    
    found = 3
    if not os.path.exists("/tmp/unifier/queries/highlights.scm"):
        print("- Highlights not found.")
        found = found - 1
        del entry["highlights"]
    if not os.path.exists("/tmp/unifier/queries/locals.scm"):
        print("- Locals not found.")
        found = found - 1
        del entry["locals"]
    if not os.path.exists("/tmp/unifier/queries/injections.scm"):
        print("- Injections not found.")
        found = found - 1
        del entry["injections"]
    
    if found == 0:
        print("- WARN: queries exists, but none found")
    
    lang["entries"].append(entry)

def cleanup_lang_pass_a(lang):
    print(f"Working on {lang['name']} ({lang['repo']})")
    if not clone_tmp_repo(lang):
        print(f"- ERROR: unable to clone {lang['name']}")
        return
    
    lang['entries'] = lang.get('entries', [])
    if len(lang['entries']) == 0:
        define_root_queries(lang)
    
    if not os.path.exists("/tmp/unifier/src"):
        print("- WARN: relative parser path?")
    
    print("- Done.")

def main():
    if len(sys.argv) != 2:
        print("Usage: python unifier.py <languages.json>")
        sys.exit(1)
    
    source_path = sys.argv[1]
    content = None
    with open(source_path, "r") as file:
        content = json.loads(file.read())
    
    if content is None:
        print("Provided document empty, no work to do.")

    for lang in content:
        cleanup_lang(lang)

    shutil.rmtree("/tmp/unifier", ignore_errors=True)
    
    with open(source_path, "w") as file:
        file.write(json.dumps(content))

if __name__ == "__main__":
    main()
