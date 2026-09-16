#!/bin/sh
# The board is one file. The app is that same file plus the few things a
# browser needs before it will install it to a home screen.
set -e
cd "$(dirname "$0")"
cp delivery-board.html docs/index.html
echo "docs/index.html refreshed from delivery-board.html"
