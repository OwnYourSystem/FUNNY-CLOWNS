#!/bin/sh
# The board ships as one file. It is written in parts so that the rules of the
# board (the engine) can be told apart from the things that draw it. This joins
# the parts, in name order, into the one file, and copies it to index.html.
set -e
cd "$(dirname "$0")"
export LC_ALL=C
{ cat head.html; cat parts/*.js; cat tail.html; } > delivery-board.html
cp delivery-board.html ../index.html
echo "delivery-board.html and index.html built from $(ls parts | wc -l) parts"
