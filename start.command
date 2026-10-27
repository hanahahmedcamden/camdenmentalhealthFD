#!/bin/zsh
set -e

cd -- "$(dirname "$0")"

echo "Camden prototype kit"
echo "Starting from: $(pwd)"
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

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is not available. Reinstall Node.js, then try again."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Installing project dependencies. This can take a few minutes on first run."
  npm ci
  echo ""
fi

PORT_NUMBER="${PORT:-3000}"

if command -v lsof >/dev/null 2>&1 && lsof -iTCP:"$PORT_NUMBER" -sTCP:LISTEN >/dev/null 2>&1; then
  if [ "$PORT_NUMBER" = "3000" ] && ! lsof -iTCP:3010 -sTCP:LISTEN >/dev/null 2>&1; then
    PORT_NUMBER="3010"
    echo "Port 3000 is busy, so the prototype will start on port 3010 instead."
  else
    echo "Port $PORT_NUMBER is already busy."
    echo "Close the other prototype window or set another port, for example:"
    echo "PORT=3010 ./start.command"
    exit 1
  fi
fi

echo "Open this address in your browser:"
echo "http://localhost:$PORT_NUMBER"
echo ""
echo "Press Control+C in this window to stop the prototype."
echo ""

PORT="$PORT_NUMBER" npm run dev
