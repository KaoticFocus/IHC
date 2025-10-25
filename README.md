# Contractor Voice Notes

A mobile app designed for residential remodeling contractors and tradespeople to record client meetings, site consultations, and project discussions with AI-powered transcription and analysis.

## Features

### For Contractors & Tradespeople
- **Client Meeting Recording**: Record initial consultations, site visits, and project discussions
- **Long Duration Support**: Record meetings up to 120+ minutes without interruption
- **Real-Time Transcription**: Live speech-to-text conversion during meetings
- **AI-Enhanced Accuracy**: OpenAI Whisper integration for professional-grade transcription
- **Meeting Analysis**: AI-powered insights into client needs, project requirements, and action items
- **Professional Summaries**: Automatic generation of meeting summaries and key points
- **Action Item Tracking**: Extract follow-up tasks and commitments from conversations
- **Client Insights**: Understand client preferences, budget considerations, and project priorities

### Technical Features
- **High Quality Audio**: AAC encoding for optimal quality and file size
- **Multi-Speaker Support**: Distinguish between contractor, client, and other participants
- **Advanced Speaker Detection**: AI-powered identification of different speakers
- **Local Storage**: All recordings and transcripts stored securely on device
- **Export Options**: Share meeting notes and transcripts with team members
- **Cross-Platform**: Works on both iOS and Android devices
- **Offline Capable**: Works without internet connection for recording

## Technical Specifications

- **Audio Format**: AAC (.m4a)
- **Sample Rate**: 44.1 kHz
- **Channels**: Stereo (2 channels)
- **Bitrate**: High quality encoding
- **Transcription**: Real-time speech-to-text using device's speech recognition
- **Speaker Detection**: Automatic speaker identification and labeling
- **Storage**: Local device storage with automatic file management
- **Permissions**: Microphone and speech recognition access required

## Installation

### Prerequisites

- Node.js (v16 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Setup

1. Install dependencies:
```bash
npm install
```

2. For iOS (macOS only):
```bash
cd ios && pod install && cd ..
```

3. Run the app:

For Android:
```bash
npm run android
```

For iOS:
```bash
npm run ios
```

## Usage

### First Time Setup
1. **Download & Install**: Install the app on your mobile device
2. **Complete Onboarding**: Follow the guided setup (AI features are pre-configured)
3. **Start Recording**: Begin recording client meetings immediately with AI-powered features

### Recording Client Meetings
1. **Start Recording**: Tap the microphone button to begin recording your client meeting
2. **AI Transcription**: Watch real-time AI-powered transcription with 95%+ accuracy
3. **Monitor Progress**: Keep track of recording time and AI processing status
4. **Stop Recording**: Tap the stop button when the meeting concludes
5. **AI Analysis**: Automatic generation of meeting summaries, action items, and insights

### Reviewing & Managing
1. **View Transcripts**: Tap the eye icon to review the full meeting transcript
2. **AI Analysis**: Tap the brain icon to see AI-generated meeting insights and summaries
3. **Export Notes**: Share meeting transcripts and analysis with your team
4. **Organize Meetings**: View all your client meetings in chronological order
5. **Clean Up**: Delete old recordings to free up storage space

### Best Practices for Contractors
- **Record Initial Consultations**: Capture client needs and project requirements
- **Site Visit Documentation**: Record on-site discussions and measurements
- **Change Order Meetings**: Document scope changes and approvals
- **Progress Updates**: Record client check-ins and progress reviews
- **Final Walkthroughs**: Document final inspections and client feedback

## File Storage

- Recordings are stored in the app's document directory
- Transcripts are stored as JSON files alongside recordings
- Files are automatically named with timestamps
- Each recording includes metadata (date, size, duration, transcript status)
- Transcripts include speaker identification and confidence scores
- No cloud storage - all data remains on your device

## Permissions

The app requires the following permissions:
- **Microphone**: To record audio
- **Speech Recognition**: To generate real-time transcripts
- **Storage**: To save and manage recording files and transcripts
- **Internet**: To access AI services for transcription and analysis

## Technical Details

### Audio Recording
- Uses `react-native-audio-recorder-player` for high-quality recording
- AAC encoding for optimal compression and quality
- Stereo recording for better multi-speaker detection
- Automatic file management and storage

### Transcription
- Real-time speech-to-text using `@react-native-voice/voice`
- AI-enhanced transcription using OpenAI Whisper API
- Automatic speaker detection and labeling
- Advanced speaker role identification
- Confidence scoring for transcription accuracy
- JSON format storage with timestamps and metadata
- Export capabilities for text files and sharing

### AI Analysis
- OpenAI GPT-4 powered conversation analysis
- Automatic summary generation
- Key points extraction
- Action item identification
- Sentiment analysis
- Topic categorization
- Speaker insights and role analysis
- Comprehensive conversation insights

### Storage Management
- Local file system storage using `react-native-fs`
- Automatic directory creation and management
- File size tracking and display
- Efficient storage cleanup

### UI/UX
- Modern gradient design with intuitive controls
- Real-time recording status and timer
- Responsive layout for different screen sizes
- Clear visual feedback for all actions

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure microphone permissions are granted in device settings
2. **Recording Not Starting**: Check that no other apps are using the microphone
3. **Storage Full**: Delete old recordings to free up space
4. **Audio Quality Issues**: Ensure device microphone is not obstructed

### Performance Tips

- Close other audio apps before recording
- Ensure device has sufficient battery and storage
- Use headphones to monitor audio quality during recording

## Development

### Project Structure
```
├── App.tsx                 # Main application component
├── android/               # Android-specific files
├── ios/                   # iOS-specific files
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

### Key Dependencies
- `react-native-audio-recorder-player`: Audio recording functionality
- `@react-native-voice/voice`: Real-time speech recognition and transcription
- `openai`: OpenAI API integration for Whisper and GPT-4
- `react-native-permissions`: Permission management
- `react-native-fs`: File system operations
- `react-native-vector-icons`: UI icons
- `react-native-linear-gradient`: Gradient backgrounds
- `react-native-share`: Transcript sharing functionality
- `@react-native-async-storage/async-storage`: Local storage for API keys

## Target Users

This app is specifically designed for:
- **Residential Remodeling Contractors**
- **Home Improvement Specialists**
- **Construction Project Managers**
- **Interior Designers**
- **Tradespeople** (plumbers, electricians, HVAC technicians)
- **Real Estate Professionals**
- **Property Managers**

## License

This project is for commercial use by contractors and tradespeople in the residential remodeling industry.

## Support

For technical support or feature requests, please contact the development team.
