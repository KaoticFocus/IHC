// Type definitions for extension integration
export interface ExtensionAPI {
  startRecording: () => void;
  stopRecording: () => void;
  getRecordingStatus: () => Promise<{ isRecording: boolean; recordingStartTime: number | null }>;
  showNotification: (title: string, message: string) => void;
  onRecordingStarted: ((timestamp: number) => void) | null;
  onRecordingStopped: ((duration: number) => void) | null;
}

declare global {
  interface Window {
    ihcExtension?: ExtensionAPI;
  }
}

export {};

