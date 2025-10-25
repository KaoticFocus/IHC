import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import RNFS from 'react-native-fs';

export interface TranscriptEntry {
  id: string;
  timestamp: number;
  speaker: string;
  text: string;
  confidence: number;
}

export interface TranscriptionSession {
  id: string;
  startTime: number;
  entries: TranscriptEntry[];
  isActive: boolean;
}

class TranscriptionService {
  private currentSession: TranscriptionSession | null = null;
  private isListening = false;
  private onTranscriptUpdate?: (entries: TranscriptEntry[]) => void;
  private onError?: (error: string) => void;

  constructor() {
    this.initializeVoice();
  }

  private initializeVoice() {
    Voice.onSpeechStart = this.onSpeechStart;
    Voice.onSpeechRecognized = this.onSpeechRecognized;
    Voice.onSpeechEnd = this.onSpeechEnd;
    Voice.onSpeechError = this.onSpeechError;
    Voice.onSpeechResults = this.onSpeechResults;
    Voice.onSpeechPartialResults = this.onSpeechPartialResults;
  }

  private onSpeechStart = () => {
    console.log('Speech recognition started');
  };

  private onSpeechRecognized = () => {
    console.log('Speech recognized');
  };

  private onSpeechEnd = () => {
    console.log('Speech recognition ended');
  };

  private onSpeechError = (e: SpeechErrorEvent) => {
    console.error('Speech recognition error:', e.error);
    this.onError?.(e.error?.message || 'Speech recognition error');
  };

  private onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value.length > 0 && this.currentSession) {
      const transcript = e.value[0];
      const confidence = e.confidence?.[0] || 0.8;
      
      const entry: TranscriptEntry = {
        id: Date.now().toString(),
        timestamp: Date.now() - this.currentSession.startTime,
        speaker: this.detectSpeaker(transcript),
        text: transcript,
        confidence: confidence,
      };

      this.currentSession.entries.push(entry);
      this.onTranscriptUpdate?.(this.currentSession.entries);
    }
  };

  private onSpeechPartialResults = (e: SpeechResultsEvent) => {
    // Handle partial results for real-time display
    if (e.value && e.value.length > 0) {
      console.log('Partial result:', e.value[0]);
    }
  };

  private detectSpeaker(text: string): string {
    // Simple speaker detection based on text patterns
    // In a real implementation, you might use more sophisticated methods
    const words = text.toLowerCase().split(' ');
    
    // Look for common speaker indicators
    if (words.includes('doctor') || words.includes('physician') || words.includes('consultant')) {
      return 'Consultant';
    }
    if (words.includes('patient') || words.includes('client')) {
      return 'Patient';
    }
    
    // Default speaker assignment based on session context
    const entryCount = this.currentSession?.entries.length || 0;
    return entryCount % 2 === 0 ? 'Speaker 1' : 'Speaker 2';
  }

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

      await Voice.start('en-US');
      this.isListening = true;

      return sessionId;
    } catch (error) {
      console.error('Failed to start transcription:', error);
      throw error;
    }
  }

  async stopTranscription(): Promise<TranscriptEntry[]> {
    try {
      await Voice.stop();
      this.isListening = false;
      
      const entries = this.currentSession?.entries || [];
      this.currentSession = null;
      
      return entries;
    } catch (error) {
      console.error('Failed to stop transcription:', error);
      throw error;
    }
  }

  async saveTranscript(sessionId: string, entries: TranscriptEntry[]): Promise<string> {
    try {
      const transcriptsPath = `${RNFS.DocumentDirectoryPath}/transcripts`;
      const exists = await RNFS.exists(transcriptsPath);
      
      if (!exists) {
        await RNFS.mkdir(transcriptsPath);
      }

      const transcriptData = {
        sessionId,
        timestamp: new Date().toISOString(),
        entries: entries,
        totalDuration: entries.length > 0 ? entries[entries.length - 1].timestamp : 0,
        wordCount: entries.reduce((count, entry) => count + entry.text.split(' ').length, 0),
      };

      const fileName = `${sessionId}.json`;
      const filePath = `${transcriptsPath}/${fileName}`;
      
      await RNFS.writeFile(filePath, JSON.stringify(transcriptData, null, 2), 'utf8');
      
      return filePath;
    } catch (error) {
      console.error('Failed to save transcript:', error);
      throw error;
    }
  }

  async loadTranscript(sessionId: string): Promise<any> {
    try {
      const filePath = `${RNFS.DocumentDirectoryPath}/transcripts/${sessionId}.json`;
      const exists = await RNFS.exists(filePath);
      
      if (!exists) {
        throw new Error('Transcript not found');
      }

      const content = await RNFS.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to load transcript:', error);
      throw error;
    }
  }

  async getAllTranscripts(): Promise<any[]> {
    try {
      const transcriptsPath = `${RNFS.DocumentDirectoryPath}/transcripts`;
      const exists = await RNFS.exists(transcriptsPath);
      
      if (!exists) {
        return [];
      }

      const files = await RNFS.readDir(transcriptsPath);
      const transcriptFiles = files.filter(file => file.name.endsWith('.json'));
      
      const transcripts = [];
      for (const file of transcriptFiles) {
        try {
          const content = await RNFS.readFile(file.path, 'utf8');
          const transcript = JSON.parse(content);
          transcripts.push({
            ...transcript,
            filePath: file.path,
            fileName: file.name,
            fileSize: file.size,
            modifiedDate: file.mtime,
          });
        } catch (error) {
          console.error(`Failed to load transcript ${file.name}:`, error);
        }
      }

      return transcripts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Failed to load transcripts:', error);
      return [];
    }
  }

  formatTranscript(entries: TranscriptEntry[]): string {
    return entries
      .map(entry => {
        const time = this.formatTime(entry.timestamp);
        return `[${time}] ${entry.speaker}: ${entry.text}`;
      })
      .join('\n\n');
  }

  private formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  isTranscribing(): boolean {
    return this.isListening;
  }

  getCurrentSession(): TranscriptionSession | null {
    return this.currentSession;
  }
}

export default new TranscriptionService();
