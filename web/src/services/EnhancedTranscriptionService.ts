import OpenAIService from './OpenAIService';
import StorageService from './StorageService';
import RealTimeTranscriptionService from './RealTimeTranscriptionService';

export interface EnhancedTranscript {
  id: string;
  timestamp: number;
  speaker: string;
  text: string;
  confidence: number;
  aiEnhanced: boolean;
  speakerRole?: string;
}

export interface TranscriptionSession {
  id: string;
  startTime: number;
  entries: EnhancedTranscript[];
  isActive: boolean;
  useOpenAI: boolean;
  aiAnalysis?: any;
  useRealTime?: boolean;
}

class EnhancedTranscriptionService {
  private currentSession: TranscriptionSession | null = null;
  private isListening = false;
  private onTranscriptUpdate?: (entries: EnhancedTranscript[]) => void;
  private onAIAnalysis?: (analysis: any) => void;

  async startTranscription(
    useOpenAI: boolean = false,
    onUpdate: (entries: EnhancedTranscript[]) => void,
    _onError: (error: string) => void,
    onAIAnalysis?: (analysis: any) => void,
    useRealTime: boolean = true
  ): Promise<string> {
    try {
      this.onTranscriptUpdate = onUpdate;
      this.onAIAnalysis = onAIAnalysis;

      const sessionId = `transcript_${Date.now()}`;
      this.currentSession = {
        id: sessionId,
        startTime: Date.now(),
        entries: [],
        isActive: true,
        useOpenAI: useOpenAI,
        useRealTime: useRealTime,
      };

      if (useOpenAI) {
        const hasApiKey = await OpenAIService.hasApiKey();
        if (!hasApiKey) {
          throw new Error('OpenAI API key not configured. Please set your API key in settings.');
        }
      }

      // Start real-time transcription if supported
      if (useRealTime && RealTimeTranscriptionService.isSupported()) {
        await RealTimeTranscriptionService.startTranscription(
          (entries) => {
            if (this.currentSession) {
              this.currentSession.entries = entries;
            }
            this.onTranscriptUpdate?.(entries);
          },
          (error) => {
            _onError(error);
          }
        );
      }

      this.isListening = true;
      return sessionId;
    } catch (error) {
      console.error('Failed to start transcription:', error);
      throw error;
    }
  }

  async stopTranscription(): Promise<EnhancedTranscript[]> {
    try {
      this.isListening = false;
      
      // Stop real-time transcription if active
      if (RealTimeTranscriptionService.getIsListening()) {
        const realTimeEntries = RealTimeTranscriptionService.stopTranscription();
        if (this.currentSession) {
          this.currentSession.entries = realTimeEntries;
        }
      }
      
      const entries = this.currentSession?.entries || [];
      this.currentSession = null;
      return entries;
    } catch (error) {
      console.error('Failed to stop transcription:', error);
      throw error;
    }
  }

  async enhanceWithOpenAI(audioBlob: Blob): Promise<{
    enhancedTranscript: EnhancedTranscript[];
    aiAnalysis: any;
  }> {
    if (!this.currentSession?.useOpenAI) {
      throw new Error('OpenAI enhancement not enabled for this session');
    }

    try {
      // Transcribe audio using OpenAI Whisper
      const whisperResult = await OpenAIService.transcribeAudio(audioBlob);
      
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
    
    if (lowerText.includes('contractor') || lowerText.includes('i will') || lowerText.includes('we can')) {
      return 'Contractor';
    }
    if (lowerText.includes('client') || lowerText.includes('i want') || lowerText.includes('my')) {
      return 'Client';
    }
    
    return 'Speaker';
  }

  private getSpeakerRole(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('project') || lowerText.includes('estimate') || lowerText.includes('construction')) {
      return 'Project Manager';
    }
    if (lowerText.includes('prefer') || lowerText.includes('like') || lowerText.includes('budget')) {
      return 'Homeowner';
    }
    
    return 'Participant';
  }

  async saveEnhancedTranscript(
    sessionId: string, 
    entries: EnhancedTranscript[], 
    aiAnalysis?: any
  ): Promise<void> {
    try {
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

      await StorageService.setSetting(`transcript_${sessionId}`, transcriptData);
    } catch (error) {
      console.error('Failed to save enhanced transcript:', error);
      throw error;
    }
  }

  async loadEnhancedTranscript(sessionId: string): Promise<any> {
    try {
      const transcriptData = await StorageService.getSetting(`transcript_${sessionId}`);
      if (!transcriptData) {
        throw new Error('Transcript not found');
      }
      return transcriptData;
    } catch (error) {
      console.error('Failed to load enhanced transcript:', error);
      throw error;
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
