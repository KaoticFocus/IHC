import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script is loading...');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Audio handlers
  startRecording: () => ipcRenderer.invoke('start-recording'),
  stopRecording: () => ipcRenderer.invoke('stop-recording'),
  playAudio: (filePath: string) => ipcRenderer.invoke('play-audio', filePath),
  stopPlayback: () => ipcRenderer.invoke('stop-playback'),
  getAudioDevices: () => ipcRenderer.invoke('get-audio-devices'),
  setInputDevice: (deviceId: string) => ipcRenderer.invoke('set-input-device', deviceId),
  setOutputDevice: (deviceId: string) => ipcRenderer.invoke('set-output-device', deviceId),

  // OpenAI / Voice Assistant
  setOpenAIKey: (key: string) => ipcRenderer.invoke('set-openai-key', key),
  transcribeAudio: (audioPath: string) => ipcRenderer.invoke('transcribe-audio', audioPath),
  generateSpeech: (text: string) => ipcRenderer.invoke('generate-speech', text),
  checkOpenAIKey: () => ipcRenderer.invoke('check-openai-key'),

  // File system
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  saveFile: (options: { path: string; content: string }) => ipcRenderer.invoke('save-file', options),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),

  // Event listeners
  onStartRecordingHotkey: (callback: () => void) => {
    ipcRenderer.on('start-recording-hotkey', callback);
  },
  onStopRecordingHotkey: (callback: () => void) => {
    ipcRenderer.on('stop-recording-hotkey', callback);
  },
});

console.log('Preload script loaded successfully. electronAPI exposed to window.');