#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: $0 package-name"
  exit 1
fi

STARTING_DIR=$(pwd)
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

# Change to the script directory
cd "$SCRIPT_DIR"

# Run the pre-publish script to ensure that changes are checked in
source ./_publish-pre-check.sh

pkg_file="../projects/$1/package.json"

if [ ! -f "$pkg_file" ]; then
  echo "File not found: $pkg_file"
  exit 1
fi

version=$(jq -r '.version' "$pkg_file")

if [[ ! $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Invalid version format: $version"
  exit 1
fi

IFS='.' read -r major minor patch <<<"$version"
patch=$((patch + 1))
new_version="$major.$minor.$patch"

jq --arg v "$new_version" '.version = $v' "$pkg_file" >"$pkg_file.tmp" && mv "$pkg_file.tmp" "$pkg_file"

echo "$1 version bumped to $new_version!"

# Change to the starting directory
cd "$STARTING_DIR"

# Make sure the new version is checked in and the working directory is clean
git fetch origin
git pull
git add .
git commit -m "chore: update version for $1"
git push
