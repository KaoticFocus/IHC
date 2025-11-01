import StorageService from './StorageService';

export interface AudioDevice {
  id: string;
  name: string;
  type: 'input' | 'output';
}

class AudioService {
  private currentInputDevice: string | null = null;
  private currentOutputDevice: string | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private currentStream: MediaStream | null = null;
  private currentAudioBlob: Blob | null = null;

  async getAudioDevices(): Promise<AudioDevice[]> {
    try {
      // Request permission first to get device labels
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.warn('Microphone permission denied:', error);
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const audioDevices: AudioDevice[] = devices
        .filter(device => device.kind === 'audioinput' || device.kind === 'audiooutput')
        .map(device => ({
          id: device.deviceId,
          name: device.label || `${device.kind === 'audioinput' ? 'Microphone' : 'Speaker'} (${device.deviceId.slice(0, 8)})`,
          type: device.kind === 'audioinput' ? 'input' : 'output'
        }));

      return audioDevices;
    } catch (error) {
      console.error('Failed to get audio devices:', error);
      throw error;
    }
  }

  async setInputDevice(deviceId: string): Promise<void> {
    this.currentInputDevice = deviceId;
    await StorageService.setSetting('inputDevice', deviceId);
  }

  async setOutputDevice(deviceId: string): Promise<void> {
    this.currentOutputDevice = deviceId;
    await StorageService.setSetting('outputDevice', deviceId);
  }

  async startRecording(): Promise<string> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: this.currentInputDevice 
          ? { deviceId: { exact: this.currentInputDevice } }
          : true
      };
      
      this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.currentStream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      console.log('Recording started with device:', this.currentInputDevice || 'default');
      return `recording_${Date.now()}`;
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<string> {
    try {
      if (!this.mediaRecorder) {
        throw new Error('No active recording');
      }

      return new Promise((resolve, reject) => {
        this.mediaRecorder!.onstop = async () => {
          try {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            this.currentAudioBlob = audioBlob;
            
            const recordingId = `recording_${Date.now()}`;
            await StorageService.saveRecording(recordingId, audioBlob);
            
            // Stop all tracks
            if (this.currentStream) {
              this.currentStream.getTracks().forEach(track => track.stop());
              this.currentStream = null;
            }
            
            this.mediaRecorder = null;
            this.audioChunks = [];

            resolve(recordingId);
          } catch (error) {
            reject(error);
          }
        };

        this.mediaRecorder!.stop();
      });
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  async playAudio(recordingId: string): Promise<void> {
    try {
      const blob = await StorageService.getRecording(recordingId);
      if (!blob) {
        throw new Error('Recording not found');
      }

      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      if (this.currentOutputDevice && 'setSinkId' in audio) {
        await (audio as any).setSinkId(this.currentOutputDevice);
      }

      return new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          reject(error);
        };
        audio.play();
      });
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  async stopPlayback(): Promise<void> {
    // Audio playback is handled by individual Audio elements
    // This method is kept for API compatibility
    return Promise.resolve();
  }

  getCurrentInputDevice(): string | null {
    return this.currentInputDevice;
  }

  getCurrentOutputDevice(): string | null {
    return this.currentOutputDevice;
  }

  async loadSettings(): Promise<void> {
    const inputDevice = await StorageService.getSetting('inputDevice');
    const outputDevice = await StorageService.getSetting('outputDevice');
    
    if (inputDevice) {
      this.currentInputDevice = inputDevice;
    }
    if (outputDevice) {
      this.currentOutputDevice = outputDevice;
    }
  }

  getCurrentAudioBlob(): Blob | null {
    return this.currentAudioBlob;
  }
}

export default new AudioService();

