# Icon Generation Instructions

To create PNG icons for the browser extension, use one of these methods:

## Quick Method: Online Converter
1. Visit https://cloudconvert.com/svg-to-png
2. Upload `icon16.svg`, `icon48.svg`, or `icon128.svg`
3. Set the output size to match (16, 48, or 128 pixels)
4. Download and save as `icon16.png`, `icon48.png`, `icon128.png`

## ImageMagick (Command Line)
```bash
convert icon16.svg -resize 16x16 icon16.png
convert icon48.svg -resize 48x48 icon48.png
convert icon128.svg -resize 128x128 icon128.png
```

## Inkscape (Command Line)
```bash
inkscape icon16.svg --export-filename=icon16.png --export-width=16 --export-height=16
inkscape icon48.svg --export-filename=icon48.png --export-width=48 --export-height=48
inkscape icon128.svg --export-filename=icon128.png --export-width=128 --export-height=128
```

## Design Tools
- Open SVG files in Figma, Adobe Illustrator, or similar
- Export as PNG at the required sizes
- Save as icon16.png, icon48.png, icon128.png

## Temporary Solution
For testing, you can use any small PNG image and copy it three times:
- Copy any PNG file to icon16.png
- Copy any PNG file to icon48.png  
- Copy any PNG file to icon128.png

The extension will work without proper icons, but will show a default browser icon.

