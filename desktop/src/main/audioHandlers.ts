import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { Howl } from 'howler';

let audioPath: string = '';
let currentPlayback: Howl | null = null;
let selectedInputDevice: string | null = null;
let selectedOutputDevice: string | null = null;
let nativeRecordingAvailable = false;

// Check if native recording (sox) is available
try {
  const { execSync } = require('child_process');
  execSync('sox --version', { stdio: 'ignore' });
  nativeRecordingAvailable = true;
  console.log('Native audio recording (sox) is available');
} catch (error) {
  console.log('Native audio recording (sox) not available, using browser MediaRecorder');
}

export function setupAudioHandlers() {
  // Check if native recording is available
  ipcMain.handle('check-native-recording', async () => {
    return { success: true, available: nativeRecordingAvailable };
  });

  // Get available audio devices
  ipcMain.handle('get-audio-devices', async () => {
    try {
      // Return default devices for both input and output
      const devices = [
        { id: 'default-input', name: 'Default Microphone', type: 'input' },
        { id: 'default-output', name: 'Default Speakers', type: 'output' },
      ];
      console.log('Returning audio devices:', devices);
      return { success: true, devices };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Failed to get audio devices:', err);
      return { success: false, error: err.message };
    }
  });

  // Set input device
  ipcMain.handle('set-input-device', async (event, deviceId: string) => {
    try {
      selectedInputDevice = deviceId;
      console.log('Input device set to:', deviceId);
      return { success: true };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Failed to set input device:', err);
      return { success: false, error: err.message };
    }
  });

  // Set output device
  ipcMain.handle('set-output-device', async (event, deviceId: string) => {
    try {
      selectedOutputDevice = deviceId;
      console.log('Output device set to:', deviceId);
      return { success: true };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Failed to set output device:', err);
      return { success: false, error: err.message };
    }
  });

  // Start recording - will be handled in renderer process using MediaRecorder
  ipcMain.handle('start-recording', async () => {
    try {
      const timestamp = Date.now();
      audioPath = path.join(app.getPath('userData'), `recording_${timestamp}.webm`);
      
      return { 
        success: true, 
        audioPath,
        useNative: nativeRecordingAvailable 
      };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Failed to start recording:', err);
      return { success: false, error: err.message };
    }
  });

  // Stop recording and save audio data
  ipcMain.handle('stop-recording', async (event, audioData?: Buffer | Uint8Array) => {
    try {
      if (audioData) {
        // Create recordings directory if it doesn't exist
        const recordingsDir = path.join(app.getPath('userData'), 'recordings');
        if (!fs.existsSync(recordingsDir)) {
          fs.mkdirSync(recordingsDir, { recursive: true });
        }

        // Update audioPath to use recordings directory
        audioPath = path.join(recordingsDir, `recording_${Date.now()}.webm`);
        
        // Convert Uint8Array to Buffer if needed
        const dataToWrite = Buffer.isBuffer(audioData) ? audioData : Buffer.from(audioData);
        fs.writeFileSync(audioPath, dataToWrite);
        
        console.log('Audio saved to:', audioPath);
        return { success: true, audioPath };
      }
      return { success: false, error: 'No audio data provided' };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Failed to stop recording:', err);
      return { success: false, error: err.message };
    }
  });

  // Play audio
  ipcMain.handle('play-audio', async (event, filePath: string) => {
    try {
      if (currentPlayback) {
        currentPlayback.stop();
      }

      currentPlayback = new Howl({
        src: [filePath],
        html5: true,
        format: ['wav', 'mp3', 'webm'],
        onend: () => {
          currentPlayback = null;
        }
      });

      currentPlayback.play();
      return { success: true };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Failed to play audio:', err);
      return { success: false, error: err.message };
    }
  });

  // Stop playback
  ipcMain.handle('stop-playback', async () => {
    try {
      if (currentPlayback) {
        currentPlayback.stop();
        currentPlayback = null;
      }
      return { success: true };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Failed to stop playback:', error);
      return { success: false, error: err.message };
    }
  });
}