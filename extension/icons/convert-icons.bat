@echo off
REM Convert SVG icons to PNG using ImageMagick
REM Make sure ImageMagick is installed: https://imagemagick.org/script/download.php

echo Converting SVG icons to PNG...

if exist "C:\Program Files\ImageMagick-7.*\magick.exe" (
    echo Using ImageMagick...
    "C:\Program Files\ImageMagick-7.*\magick.exe" icon16.svg -resize 16x16 icon16.png
    "C:\Program Files\ImageMagick-7.*\magick.exe" icon48.svg -resize 48x48 icon48.png
    "C:\Program Files\ImageMagick-7.*\magick.exe" icon128.svg -resize 128x128 icon128.png
    echo Icons converted successfully!
) else (
    echo ImageMagick not found.
    echo Please install ImageMagick from https://imagemagick.org/script/download.php
    echo Or use an online converter like https://cloudconvert.com/svg-to-png
    pause
)

