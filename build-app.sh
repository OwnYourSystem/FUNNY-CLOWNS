#!/bin/sh
# The board is one file. The app is that same file plus the few things a
# browser needs before it will install it to a home screen.
set -e
cd "$(dirname "$0")"
cp delivery-board.html app/index.html
echo "app/index.html refreshed from delivery-board.html"
