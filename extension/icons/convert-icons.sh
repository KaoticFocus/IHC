#!/bin/bash
# Convert SVG icons to PNG using ImageMagick or Inkscape
# Make sure ImageMagick is installed: brew install imagemagick (Mac) or apt-get install imagemagick (Linux)

echo "Converting SVG icons to PNG..."

# Check if ImageMagick is installed
if command -v convert &> /dev/null; then
    echo "Using ImageMagick..."
    convert icon16.svg -resize 16x16 icon16.png
    convert icon48.svg -resize 48x48 icon48.png
    convert icon128.svg -resize 128x128 icon128.png
elif command -v inkscape &> /dev/null; then
    echo "Using Inkscape..."
    inkscape icon16.svg --export-filename=icon16.png --export-width=16 --export-height=16
    inkscape icon48.svg --export-filename=icon48.png --export-width=48 --export-height=48
    inkscape icon128.svg --export-filename=icon128.png --export-width=128 --export-height=128
else
    echo "Neither ImageMagick nor Inkscape found."
    echo "Please install one of them, or manually convert the SVG files to PNG."
    echo "Alternative: Use an online converter like https://cloudconvert.com/svg-to-png"
    exit 1
fi

echo "Icons converted successfully!"

