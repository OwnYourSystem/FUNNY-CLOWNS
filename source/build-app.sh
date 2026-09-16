#!/bin/sh
# The board is one file. The deployed app is that same file at the root of
# this branch, next to the few things a browser needs before it will install
# it to a home screen.
set -e
cd "$(dirname "$0")/.."
cp source/delivery-board.html index.html
echo "index.html refreshed from source/delivery-board.html"
