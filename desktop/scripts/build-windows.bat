@echo off

:: Clean previous builds
rmdir /s /q dist
rmdir /s /q release

:: Build React app
call npm run build:react

:: Build Electron app
call npm run build:electron

:: Package for Windows
call npm run package:win
