#!/bin/bash
# Bundles src/ into a single playable index.html
set -e
cd "$(dirname "$0")"
{
  cat src/head.html
  echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
  echo '<script>'
  for f in src/js/*.js; do cat "$f"; echo; done
  echo '</script>'
} > index.html
echo "built index.html ($(wc -c < index.html) bytes)"
