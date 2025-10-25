import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import RNFS from 'react-native-fs';
import OpenAIService, { AIAnalysis, EnhancedTranscript } from './OpenAIService';

export interface TranscriptionSession {
  id: string;
  startTime: number;
  entries: EnhancedTranscript[];
  isActive: boolean;
  useOpenAI: boolean;
  aiAnalysis?: AIAnalysis;
}

class EnhancedTranscriptionService {
  private currentSession: TranscriptionSession | null = null;
  private isListening = false;
  private onTranscriptUpdate?: (entries: EnhancedTranscript[]) => void;
  private onError?: (error: string) => void;
  private onAIAnalysis?: (analysis: AIAnalysis) => void;

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
      
      const entry: EnhancedTranscript = {
        id: Date.now().toString(),
        timestamp: Date.now() - this.currentSession.startTime,
        speaker: this.detectSpeaker(transcript),
        text: transcript,
        confidence: confidence,
        aiEnhanced: false,
      };

      this.currentSession.entries.push(entry);
      this.onTranscriptUpdate?.(this.currentSession.entries);
    }
  };

  private onSpeechPartialResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value.length > 0) {
      console.log('Partial result:', e.value[0]);
    }
  };

  private detectSpeaker(text: string): string {
    const words = text.toLowerCase().split(' ');
    
    if (words.includes('doctor') || words.includes('physician') || words.includes('consultant')) {
      return 'Consultant';
    }
    if (words.includes('patient') || words.includes('client')) {
      return 'Patient';
    }
    
    const entryCount = this.currentSession?.entries.length || 0;
    return entryCount % 2 === 0 ? 'Speaker 1' : 'Speaker 2';
  }

  async startTranscription(
    useOpenAI: boolean = false,
    onUpdate: (entries: EnhancedTranscript[]) => void,
    onError: (error: string) => void,
    onAIAnalysis?: (analysis: AIAnalysis) => void
  ): Promise<string> {
    try {
      this.onTranscriptUpdate = onUpdate;
      this.onError = onError;
      this.onAIAnalysis = onAIAnalysis;

      const sessionId = `transcript_${Date.now()}`;
      this.currentSession = {
        id: sessionId,
        startTime: Date.now(),
        entries: [],
        isActive: true,
        useOpenAI: useOpenAI,
      };

      if (useOpenAI) {
        const hasApiKey = await OpenAIService.hasApiKey();
        if (!hasApiKey) {
          throw new Error('OpenAI API key not configured. Please set your API key in settings.');
        }
      }

      await Voice.start('en-US');
      this.isListening = true;

      return sessionId;
    } catch (error) {
      console.error('Failed to start transcription:', error);
      throw error;
    }
  }

  async stopTranscription(): Promise<EnhancedTranscript[]> {
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

  async enhanceWithOpenAI(audioFilePath: string): Promise<{
    enhancedTranscript: EnhancedTranscript[];
    aiAnalysis: AIAnalysis;
  }> {
    if (!this.currentSession?.useOpenAI) {
      throw new Error('OpenAI enhancement not enabled for this session');
    }

    try {
      // Transcribe audio using OpenAI Whisper
      const whisperResult = await OpenAIService.transcribeAudio(audioFilePath);
      
      // Convert Whisper segments to EnhancedTranscript format
      const enhancedEntries: EnhancedTranscript[] = whisperResult.segments.map((segment, index) => ({
        id: `whisper_${index}`,
        timestamp: segment.start * 1000, // Convert to milliseconds
        speaker: this.identifySpeakerFromText(segment.text),
        text: segment.text,
        confidence: 0.95, // Whisper typically has high confidence
        aiEnhanced: true,
        speakerRole: this.getSpeakerRole(segment.text),
      }));

      // Get AI analysis
      const fullTranscript = whisperResult.text;
      const aiAnalysis = await OpenAIService.analyzeConversation(fullTranscript);

      // Update current session
      if (this.currentSession) {
        this.currentSession.entries = enhancedEntries;
        this.currentSession.aiAnalysis = aiAnalysis;
        this.onTranscriptUpdate?.(enhancedEntries);
        this.onAIAnalysis?.(aiAnalysis);
      }

      return {
        enhancedTranscript: enhancedEntries,
        aiAnalysis: aiAnalysis,
      };
    } catch (error) {
      console.error('Error enhancing with OpenAI:', error);
      throw error;
    }
  }

  private identifySpeakerFromText(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('doctor') || lowerText.includes('physician') || lowerText.includes('consultant')) {
      return 'Consultant';
    }
    if (lowerText.includes('patient') || lowerText.includes('client')) {
      return 'Patient';
    }
    
    // Use AI to identify speaker if available
    return 'Speaker';
  }

  private getSpeakerRole(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('diagnosis') || lowerText.includes('treatment') || lowerText.includes('prescription')) {
      return 'Healthcare Provider';
    }
    if (lowerText.includes('symptoms') || lowerText.includes('pain') || lowerText.includes('feel')) {
      return 'Patient';
    }
    
    return 'Participant';
  }

  async saveEnhancedTranscript(
    sessionId: string, 
    entries: EnhancedTranscript[], 
    aiAnalysis?: AIAnalysis
  ): Promise<string> {
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
        aiAnalysis: aiAnalysis,
        totalDuration: entries.length > 0 ? entries[entries.length - 1].timestamp : 0,
        wordCount: entries.reduce((count, entry) => count + entry.text.split(' ').length, 0),
        aiEnhanced: entries.some(entry => entry.aiEnhanced),
        speakerCount: new Set(entries.map(entry => entry.speaker)).size,
      };

      const fileName = `${sessionId}.json`;
      const filePath = `${transcriptsPath}/${fileName}`;
      
      await RNFS.writeFile(filePath, JSON.stringify(transcriptData, null, 2), 'utf8');
      
      return filePath;
    } catch (error) {
      console.error('Failed to save enhanced transcript:', error);
      throw error;
    }
  }

  async loadEnhancedTranscript(sessionId: string): Promise<any> {
    try {
      const filePath = `${RNFS.DocumentDirectoryPath}/transcripts/${sessionId}.json`;
      const exists = await RNFS.exists(filePath);
      
      if (!exists) {
        throw new Error('Transcript not found');
      }

      const content = await RNFS.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to load enhanced transcript:', error);
      throw error;
    }
  }

  async getAllEnhancedTranscripts(): Promise<any[]> {
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
      console.error('Failed to load enhanced transcripts:', error);
      return [];
    }
  }

  formatEnhancedTranscript(entries: EnhancedTranscript[]): string {
    return entries
      .map(entry => {
        const time = this.formatTime(entry.timestamp);
        const aiIndicator = entry.aiEnhanced ? ' [AI Enhanced]' : '';
        const roleIndicator = entry.speakerRole ? ` (${entry.speakerRole})` : '';
        return `[${time}] ${entry.speaker}${roleIndicator}${aiIndicator}: ${entry.text}`;
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

  async generateAISummary(transcript: string): Promise<string> {
    return await OpenAIService.generateSummary(transcript);
  }

  async extractActionItems(transcript: string): Promise<string[]> {
    return await OpenAIService.extractActionItems(transcript);
  }
}

export default new EnhancedTranscriptionService();
