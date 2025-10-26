export interface ElectronAPI {
  startRecording: () => Promise<{ success: boolean; audioPath?: string; error?: string }>;
  stopRecording: () => Promise<{ success: boolean; audioPath?: string; error?: string }>;
  playAudio: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  stopPlayback: () => Promise<{ success: boolean; error?: string }>;
  getAudioDevices: () => Promise<{ success: boolean; devices?: any[]; error?: string }>;
  setInputDevice: (deviceId: string) => Promise<{ success: boolean; error?: string }>;
  setOutputDevice: (deviceId: string) => Promise<{ success: boolean; error?: string }>;
  setOpenAIKey: (key: string) => Promise<{ success: boolean; error?: string }>;
  transcribeAudio: (audioPath: string) => Promise<{ success: boolean; text?: string; error?: string }>;
  generateSpeech: (text: string) => Promise<{ success: boolean; audioPath?: string; error?: string }>;
  checkOpenAIKey: () => Promise<{ success: boolean }>;
  selectDirectory: () => Promise<string>;
  saveFile: (options: { path: string; content: string }) => Promise<void>;
  getAppPath: () => Promise<string>;
  onStartRecordingHotkey: (callback: () => void) => void;
  onStopRecordingHotkey: (callback: () => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
