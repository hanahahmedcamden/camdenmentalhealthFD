#!/bin/zsh
set -e

cd -- "$(dirname "$0")"

echo "Camden prototype kit"
echo "Updating from: $(pwd)"
echo ""

if [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
  nvm install
  nvm use
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed."
  echo "Install Node.js 22.23.4, then double-click this file again."
  echo "See DESIGNER-SETUP.md for setup steps."
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "Git is not available. Install GitHub Desktop, then try again."
  exit 1
fi

echo "Checking for project updates."
git pull --ff-only
echo ""

echo "Installing the exact dependencies for this version of the kit."
npm ci
echo ""

echo "Building assets to check the project still starts cleanly."
npm run build
echo ""

echo "Update complete. Double-click start.command to run the prototype."
