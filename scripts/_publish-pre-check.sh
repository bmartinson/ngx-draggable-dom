#!/bin/bash

if [[ -n $(git status --porcelain) ]]; then
  echo "Error: Your git workspace is dirty. Please commit or stash your changes before proceeding."
  exit 1
fi
