# IHC Conversation Recorder Browser Extension

This browser extension enhances the IHC Conversation Recorder web app with desktop-like features.

## Features

- **Global Keyboard Shortcuts**: Start/stop recording from anywhere using Ctrl+Shift+R and Ctrl+Shift+S
- **Desktop Notifications**: Get notified when recording starts or stops
- **Extension Badge**: Visual indicator when recording is active
- **Background Recording**: Record audio even when the web app tab is not active

## Installation

1. Open Chrome/Edge and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder
5. The extension will be installed and ready to use

## Usage

1. Open the IHC Conversation Recorder web app
2. Use keyboard shortcuts:
   - `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac) to start recording
   - `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac) to stop recording
3. Or use the extension popup by clicking the extension icon

## Development

The extension communicates with the web app via:
- Custom events: `ihc-recording-started` and `ihc-recording-stopped`
- Global API: `window.ihcExtension` object

The web app can listen for these events or use the API methods to interact with the extension.

