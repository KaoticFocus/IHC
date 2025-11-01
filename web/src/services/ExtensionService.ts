// Extension integration service for web app
class ExtensionService {
  private isAvailable: boolean = false;

  constructor() {
    this.checkAvailability();
  }

  private checkAvailability() {
    // Check if extension is installed
    if (typeof window !== 'undefined' && window.ihcExtension) {
      this.isAvailable = true;
      this.setupListeners();
    } else {
      // Check periodically
      const checkInterval = setInterval(() => {
        if (window.ihcExtension) {
          this.isAvailable = true;
          this.setupListeners();
          clearInterval(checkInterval);
        }
      }, 1000);
    }
  }

  private setupListeners() {
    // Listen for extension events
    window.addEventListener('ihc-recording-started', (event: any) => {
      const customEvent = new CustomEvent('extension-recording-started', {
        detail: event.detail
      });
      window.dispatchEvent(customEvent);
    });

    window.addEventListener('ihc-recording-stopped', (event: any) => {
      const customEvent = new CustomEvent('extension-recording-stopped', {
        detail: event.detail
      });
      window.dispatchEvent(customEvent);
    });

    // Setup extension callbacks
    if (window.ihcExtension) {
      window.ihcExtension.onRecordingStarted = (timestamp: number) => {
        window.dispatchEvent(new CustomEvent('extension-recording-started', {
          detail: { timestamp }
        }));
      };

      window.ihcExtension.onRecordingStopped = (duration: number) => {
        window.dispatchEvent(new CustomEvent('extension-recording-stopped', {
          detail: { duration }
        }));
      };
    }
  }

  isExtensionAvailable(): boolean {
    return this.isAvailable;
  }

  startRecording(): void {
    if (this.isAvailable && window.ihcExtension) {
      window.ihcExtension.startRecording();
    }
  }

  stopRecording(): void {
    if (this.isAvailable && window.ihcExtension) {
      window.ihcExtension.stopRecording();
    }
  }

  async getRecordingStatus(): Promise<{ isRecording: boolean; recordingStartTime: number | null } | null> {
    if (this.isAvailable && window.ihcExtension) {
      return await window.ihcExtension.getRecordingStatus();
    }
    return null;
  }

  showNotification(title: string, message: string): void {
    if (this.isAvailable && window.ihcExtension) {
      window.ihcExtension.showNotification(title, message);
    }
  }
}

// Extend Window interface
declare global {
  interface Window {
    ihcExtension?: {
      startRecording: () => void;
      stopRecording: () => void;
      getRecordingStatus: () => Promise<any>;
      showNotification: (title: string, message: string) => void;
      onRecordingStarted: ((timestamp: number) => void) | null;
      onRecordingStopped: ((duration: number) => void) | null;
    };
  }
}

export default new ExtensionService();

