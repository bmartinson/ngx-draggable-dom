#!/bin/bash

STARTING_DIR=$(pwd)
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

PKG_NAME="ngx-draggable-dom"
SCOPED_NAME="@bmartinson/ngx-draggable-dom"

# check if stdout is a terminal...
if test -t 1; then
  # see if it supports colors...
  ncolors=$(tput colors)

  if test -n "$ncolors" && test $ncolors -ge 8; then
    BOLD="$(tput bold)"
    UNDERLINE="$(tput smul)"
    STANDOUT="$(tput smso)"
    NC="$(tput sgr0)"
    BLACK="$(tput setaf 0)"
    RED="$(tput setaf 1)"
    GREEN="$(tput setaf 2)"
    YELLOW="$(tput setaf 3)"
    BLUE="$(tput setaf 4)"
    MAGENTA="$(tput setaf 5)"
    CYAN="$(tput setaf 6)"
    WHITE="$(tput setaf 7)"
  fi
fi

# work within the root of the project
cd "$SCRIPT_DIR"
cd ..

# ---------------------------------------------------------------------------
# 1. Ensure clean working directory
# ---------------------------------------------------------------------------

DIRTY=$(git status --porcelain)

if [ -n "$DIRTY" ]; then
  echo ""
  echo "${RED}${BOLD}Error:${NC} You have uncommitted changes. Please commit or stash them before publishing."
  echo ""
  git status --short
  echo ""
  cd "$STARTING_DIR"
  exit 1
fi

# ---------------------------------------------------------------------------
# 2. Interactive version bump prompt
# ---------------------------------------------------------------------------

# Cancel cleanly on Ctrl+C
trap 'echo ""; echo "${YELLOW}Release cancelled.${NC}"; cd "$STARTING_DIR"; exit 0' INT

PKG_FILE="projects/${PKG_NAME}/package.json"
CURRENT_VERSION=$(jq -r '.version' "$PKG_FILE")

# Increment patch number for the suggested default
IFS='.' read -r V_MAJOR V_MINOR V_PATCH <<< "$CURRENT_VERSION"
V_PATCH=$((V_PATCH + 1))
SUGGESTED_VERSION="${V_MAJOR}.${V_MINOR}.${V_PATCH}"

echo ""
echo "${CYAN}${BOLD}${PKG_NAME} release${NC}"
echo "Current version: ${BOLD}${CURRENT_VERSION}${NC}"
echo "Press ${YELLOW}Enter${NC} to accept the suggested version, or type a new one."
echo "Press ${YELLOW}Ctrl+C${NC} or type ${YELLOW}q${NC} to cancel."
echo ""

read -r -p "New version [${SUGGESTED_VERSION}]: " NEW_VERSION

# q / quit = cancel
if [ "$NEW_VERSION" = "q" ] || [ "$NEW_VERSION" = "quit" ]; then
  echo ""
  echo "${YELLOW}Release cancelled.${NC}"
  cd "$STARTING_DIR"
  exit 0
fi

# Empty input = accept the suggested version
if [ -z "$NEW_VERSION" ]; then
  NEW_VERSION="$SUGGESTED_VERSION"
  echo "${GREEN}Using suggested version: ${BOLD}${NEW_VERSION}${NC}"
fi

# Basic semver validation (X.Y.Z with numeric segments)
if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo ""
  echo "${RED}Error:${NC} \"${NEW_VERSION}\" is not a valid version. Expected format: X.Y.Z"
  cd "$STARTING_DIR"
  exit 1
fi

echo ""
echo "${GREEN}Preparing release ${BOLD}v${NEW_VERSION}${NC}${GREEN}...${NC}"
echo ""

# Update the library package.json version
jq --arg v "$NEW_VERSION" '.version = $v' "$PKG_FILE" > "$PKG_FILE.tmp" && mv "$PKG_FILE.tmp" "$PKG_FILE"

# Commit the version bump
git add "$PKG_FILE"
git commit -m "Preparing for Release v${NEW_VERSION}"

echo ""
echo "${GREEN}Version bumped and committed. Starting build and publish...${NC}"
echo ""

# Remove the INT trap now that the pre-flight is done
trap - INT

# ---------------------------------------------------------------------------
# 3. Publish to npmjs (original package name)
# ---------------------------------------------------------------------------

echo "${CYAN}Publishing ${PKG_NAME}@${NEW_VERSION} to npmjs...${NC}"

ng build "$PKG_NAME" --configuration=production

if [ $? -ne 0 ] || [ ! -d "dist/${PKG_NAME}" ]; then
  echo "${RED}${BOLD}Error:${NC} Build failed or dist/${PKG_NAME} not found."
  cd "$STARTING_DIR"
  exit 1
fi

(cd "dist/${PKG_NAME}" && npm publish --tag latest)
NPMJS_EXIT=$?
rm -rf ./dist

if [ $NPMJS_EXIT -ne 0 ]; then
  echo "${RED}${BOLD}Error:${NC} npmjs publish failed."
  cd "$STARTING_DIR"
  exit 1
fi

echo "${GREEN}Published to npmjs ✓${NC}"
echo ""

# ---------------------------------------------------------------------------
# 4. Publish to GitHub Packages (@bmartinson scoped name)
# ---------------------------------------------------------------------------

echo "${CYAN}Publishing ${SCOPED_NAME}@${NEW_VERSION} to GitHub Packages...${NC}"

# Temporarily rename the package for the GitHub registry
sed -i '' "s/\"name\": \"[^\"]*\"/\"name\": \"${SCOPED_NAME//\//\\/}\"/" "$PKG_FILE"

ng build "$PKG_NAME" --configuration=production

if [ $? -ne 0 ] || [ ! -d "dist/${PKG_NAME}" ]; then
  echo "${RED}${BOLD}Error:${NC} Build failed or dist/${PKG_NAME} not found."
  git checkout -- "$PKG_FILE"
  cd "$STARTING_DIR"
  exit 1
fi

(cd "dist/${PKG_NAME}" && npm publish --tag latest)
GITHUB_PUBLISH_EXIT=$?
rm -rf ./dist

# Restore the original package name
git checkout -- "$PKG_FILE"

if [ $GITHUB_PUBLISH_EXIT -ne 0 ]; then
  echo "${RED}${BOLD}Error:${NC} GitHub Packages publish failed."
  cd "$STARTING_DIR"
  exit 1
fi

echo "${GREEN}Published to GitHub Packages ✓${NC}"
echo ""

# ---------------------------------------------------------------------------
# 5. Tag and push
# ---------------------------------------------------------------------------

echo "${CYAN}Tagging release v${NEW_VERSION}...${NC}"

GITHUB_REPO=$(git remote get-url origin | sed -E 's|.*github\.com[/:]||; s|\.git$||')
git tag -a "$NEW_VERSION" -m "$NEW_VERSION"
git push --follow-tags

echo ""
echo "${GREEN}${BOLD}Release v${NEW_VERSION} complete! ✓${NC}"
echo ""

open "https://github.com/${GITHUB_REPO}/releases/tag/${NEW_VERSION}"

cd "$STARTING_DIR"
