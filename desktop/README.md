# IHC Conversation Recorder - Desktop App

A powerful cross-platform desktop application for recording, transcribing, and managing conversations with AI-powered features.

## Features

✅ **Voice Assistant** - AI-powered voice commands
✅ **Real-time Transcription** - Convert speech to text
✅ **Document Management** - Upload, read, and analyze documents
✅ **Voice Notes** - Dictate and save notes
✅ **Lead Management** - Track and manage customer leads
✅ **Text-to-Speech** - Read documents aloud
✅ **AI Analysis** - Analyze documents with GPT-4
✅ **System Tray** - Minimize to tray
✅ **Global Hotkeys** - Quick access shortcuts
✅ **Cross-Platform** - Works on Windows and macOS

## Installation

### Basic Installation (Works Out of the Box)

```bash
cd desktop
npm install
npm run dev
```

The app uses browser-based audio recording by default, which works without any additional dependencies.

### Enhanced Audio Quality (Optional)

For better audio quality and more control, you can optionally install SOX (Sound eXchange):

#### Windows:
1. Download SOX from: https://sourceforge.net/projects/sox/
2. Install and add to PATH
3. Restart the app

#### macOS:
```bash
brew install sox
```

#### Linux:
```bash
sudo apt-get install sox libsox-fmt-all
```

**Benefits of Native Audio (with SOX):**
- Higher quality audio capture
- More control over sample rates and bit depths
- Better device selection
- Lower latency
- Professional-grade audio processing

**Browser-Based Audio (Default):**
- Works immediately, no setup required
- Cross-platform compatibility
- Good quality for most use cases
- Simpler deployment

## Desktop App Advantages

Even with browser-based audio, the desktop app provides significant advantages over a web app:

### 1. **File System Access**
- Save transcripts and recordings locally
- Upload and process documents
- Manage files without browser restrictions

### 2. **System Integration**
- System tray icon
- Global keyboard shortcuts (Ctrl+Shift+R, Ctrl+Shift+S)
- Native notifications
- Runs in background

### 3. **Better Performance**
- Direct access to system resources
- No browser tab limitations
- Faster processing
- Better memory management

### 4. **Privacy & Security**
- All data stays on your computer
- No browser tracking
- Secure API key storage
- Offline capabilities

### 5. **Native Features**
- Window management
- Multi-monitor support
- Custom title bar
- Native menus

### 6. **No Browser Limitations**
- No storage quotas
- No popup blockers
- No tab crashes
- Persistent state

## Configuration

### OpenAI API Key
1. Click Settings (gear icon)
2. Enter your OpenAI API key
3. Click Save

### Audio Devices
1. Go to Settings → Audio Devices
2. Select input/output devices
3. Click Save

### Tooltips
1. Go to Settings → User Interface
2. Toggle "Show helpful tooltips on hover"

## Keyboard Shortcuts

- `Ctrl+Shift+R` (Cmd+Shift+R on Mac) - Start recording
- `Ctrl+Shift+S` (Cmd+Shift+S on Mac) - Stop recording

## Building for Distribution

### Windows
```bash
npm run package:win
```

### macOS
```bash
npm run package:mac
```

### Both Platforms
```bash
npm run package
```

## Development

```bash
# Start development server
npm run dev

# Build React app
npm run build:react

# Build Electron app
npm run build:electron

# Full build
npm run build
```

## Architecture

- **Frontend**: React + TypeScript + Material-UI
- **Backend**: Electron Main Process
- **Audio**: MediaRecorder API (browser) or SOX (native)
- **AI**: OpenAI GPT-4 + Whisper
- **Storage**: LocalStorage + File System

## Troubleshooting

### Audio Not Working
- Check microphone permissions in system settings
- Try restarting the app
- Check if another app is using the microphone

### OpenAI Features Not Working
- Verify API key is set in Settings
- Check internet connection
- Verify API key has credits

### App Won't Start
- Delete `node_modules` and run `npm install`
- Check Node.js version (requires v20+)
- Check console for errors

## Support

For issues or questions, please check the documentation or contact support.

## License

Proprietary - All rights reserved
