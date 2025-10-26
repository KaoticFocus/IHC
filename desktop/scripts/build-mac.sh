#!/bin/bash

# Clean previous builds
rm -rf dist
rm -rf release

# Build React app
npm run build:react

# Build Electron app
npm run build:electron

# Package for macOS
npm run package:mac
