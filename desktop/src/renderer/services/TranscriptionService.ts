const { ipcRenderer } = window.require('electron');

export interface TranscriptEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: number;
}

export interface TranscriptionSession {
  id: string;
  startTime: number;
  entries: TranscriptEntry[];
  isActive: boolean;
}

class TranscriptionService {
  private currentSession: TranscriptionSession | null = null;
  private isListening: boolean = false;
  private onTranscriptUpdate: ((entries: TranscriptEntry[]) => void) | null = null;
  private onError: ((error: string) => void) | null = null;

  async startTranscription(
    onUpdate: (entries: TranscriptEntry[]) => void,
    onError: (error: string) => void
  ): Promise<string> {
    try {
      this.onTranscriptUpdate = onUpdate;
      this.onError = onError;

      const sessionId = `transcript_${Date.now()}`;
      this.currentSession = {
        id: sessionId,
        startTime: Date.now(),
        entries: [],
        isActive: true,
      };

      const result = await ipcRenderer.invoke('start-recording');
      
      if (!result.success) {
        throw new Error(result.error);
      }

      this.isListening = true;
      return sessionId;
    } catch (error) {
      console.error('Failed to start transcription:', error);
      throw error;
    }
  }

  async stopTranscription(): Promise<TranscriptEntry[]> {
    try {
      if (!this.currentSession) {
        throw new Error('No active transcription session');
      }

      const result = await ipcRenderer.invoke('stop-recording');
      
      if (!result.success) {
        throw new Error(result.error);
      }

      const transcription = await ipcRenderer.invoke('transcribe-audio', result.audioPath || '');
      
      if (!transcription.success) {
        throw new Error(transcription.error);
      }

      const entry: TranscriptEntry = {
        id: `entry_${Date.now()}`,
        speaker: this.detectSpeaker(transcription.text || ''),
        text: transcription.text || '',
        timestamp: Date.now(),
      };

      this.currentSession.entries.push(entry);
      this.isListening = false;

      if (this.onTranscriptUpdate) {
        this.onTranscriptUpdate(this.currentSession.entries);
      }

      return this.currentSession.entries;
    } catch (error: any) {
      console.error('Failed to stop transcription:', error);
      if (this.onError) {
        this.onError(error.message);
      }
      throw error;
    }
  }

  private detectSpeaker(text: string): string {
    const entryCount = this.currentSession?.entries.length || 0;
    return entryCount % 2 === 0 ? 'Speaker 1' : 'Speaker 2';
  }

  getCurrentSession(): TranscriptionSession | null {
    return this.currentSession;
  }

  isRecording(): boolean {
    return this.isListening;
  }
}

export default new TranscriptionService();