#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Capture screenshots to temporary directory
echo "Capturing screenshots..."
mkdir -p img-raw
shot-scraper multi shots.yaml

# Add browser frames (output to img/ with original names)
echo "Adding browser frames..."
mkdir -p img
uv run ./add_browser_frame.py img-raw/ -o img/ --keep-name

# Compress images
echo "Compressing images..."
bunx imageoptim-cli img/*.png

# Clean up raw screenshots
rm -rf img-raw

echo "Done!"
