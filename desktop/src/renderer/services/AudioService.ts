const { ipcRenderer } = window.require('electron');

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
  private currentAudioPath: string = '';

  async getAudioDevices(): Promise<AudioDevice[]> {
    try {
      // Use browser's MediaDevices API to enumerate real devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const audioDevices: AudioDevice[] = devices
        .filter(device => device.kind === 'audioinput' || device.kind === 'audiooutput')
        .map(device => ({
          id: device.deviceId,
          name: device.label || `${device.kind === 'audioinput' ? 'Microphone' : 'Speaker'} (${device.deviceId.slice(0, 8)})`,
          type: device.kind === 'audioinput' ? 'input' : 'output'
        }));

      console.log('Enumerated audio devices:', audioDevices);
      return audioDevices;
    } catch (error) {
      console.error('Failed to get audio devices:', error);
      throw error;
    }
  }

  async setInputDevice(deviceId: string): Promise<void> {
    try {
      const result = await ipcRenderer.invoke('set-input-device', deviceId);
      if (!result.success) {
        throw new Error(result.error);
      }
      this.currentInputDevice = deviceId;
    } catch (error) {
      console.error('Failed to set input device:', error);
      throw error;
    }
  }

  async setOutputDevice(deviceId: string): Promise<void> {
    try {
      const result = await ipcRenderer.invoke('set-output-device', deviceId);
      if (!result.success) {
        throw new Error(result.error);
      }
      this.currentOutputDevice = deviceId;
    } catch (error) {
      console.error('Failed to set output device:', error);
      throw error;
    }
  }

  async startRecording(): Promise<string> {
    try {
      // Get audio path from main process
      const result = await ipcRenderer.invoke('start-recording');
      if (!result.success) {
        throw new Error(result.error);
      }
      this.currentAudioPath = result.audioPath;

      // Request microphone access with specific device if selected
      const constraints: MediaStreamConstraints = {
        audio: this.currentInputDevice 
          ? { deviceId: { exact: this.currentInputDevice } }
          : true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Create MediaRecorder
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      console.log('Recording started with device:', this.currentInputDevice || 'default');
      return this.currentAudioPath;
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
            // Create blob from chunks
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            
            // Convert blob to buffer
            const arrayBuffer = await audioBlob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Send to main process to save
            const result = await ipcRenderer.invoke('stop-recording', buffer);
            
            // Stop all tracks
            this.mediaRecorder!.stream.getTracks().forEach(track => track.stop());
            this.mediaRecorder = null;
            this.audioChunks = [];

            if (!result.success) {
              throw new Error(result.error);
            }

            resolve(result.audioPath);
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

  async playAudio(filePath: string): Promise<void> {
    try {
      const result = await ipcRenderer.invoke('play-audio', filePath);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  async stopPlayback(): Promise<void> {
    try {
      const result = await ipcRenderer.invoke('stop-playback');
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to stop playback:', error);
      throw error;
    }
  }

  getCurrentInputDevice(): string | null {
    return this.currentInputDevice;
  }

  getCurrentOutputDevice(): string | null {
    return this.currentOutputDevice;
  }
}

export default new AudioService();