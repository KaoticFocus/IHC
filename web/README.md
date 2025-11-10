# IHC Conversation Recorder - Web App

A browser-based voice recording and transcription application with AI-powered voice assistant capabilities.

## Features

- **Voice Recording**: Record audio using your browser's microphone
- **AI Transcription**: Transcribe audio using OpenAI Whisper
- **Voice Assistant**: Interactive AI assistant that can navigate the app and answer questions
- **Document Management**: Upload and manage documents
- **Transcript Viewer**: View and save conversation transcripts

## Installation

1. Clone the repository
2. Navigate to the `web` directory
3. Install dependencies:
   ```bash
   npm install
   ```

## Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build

Build for production:
```bash
npm run build
```

The built files will be in the `dist` directory.

## Browser Extension

For enhanced desktop-like features, install the browser extension:

1. Navigate to `chrome://extensions/` (or `edge://extensions/` for Edge)
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` folder

The extension provides:
- Global keyboard shortcuts (Ctrl+Shift+R to start, Ctrl+Shift+S to stop)
- Desktop notifications
- Visual recording indicator
- Background recording support

## Configuration

### Environment Variables

Create a `.env` file in the `web` directory with the following variables:

```env
VITE_SUPABASE_URL=https://xppnphkaeczptxuhmpuv.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

To get your Supabase anon key:
1. Go to https://supabase.com/dashboard/project/xppnphkaeczptxuhmpuv/settings/api
2. Copy the "anon" "public" key
3. Paste it in your `.env` file

### App Settings

1. Open the Settings modal
2. Enter your OpenAI API key (required for transcription and AI features)
3. Configure audio input/output devices
4. Adjust tooltip preferences

## Usage

### Voice Assistant

1. Click the microphone button in the bottom-right corner
2. Speak your command or question
3. Click again to stop recording
4. The AI will process your request and respond

### Keyboard Shortcuts

With the extension installed:
- `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac): Start recording
- `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac): Stop recording

## Technologies

- React 18
- TypeScript
- Material-UI (MUI)
- Vite
- OpenAI API
- IndexedDB (for local storage)
- Web Audio API

## Browser Support

- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT

