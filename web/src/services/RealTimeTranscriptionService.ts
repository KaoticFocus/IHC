import { EnhancedTranscript } from './EnhancedTranscriptionService';

// Web Speech API types (not fully typed in TypeScript)
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognition;
    SpeechRecognition?: new () => SpeechRecognition;
  }
}

class RealTimeTranscriptionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private onTranscriptUpdate?: (entries: EnhancedTranscript[]) => void;
  private entries: EnhancedTranscript[] = [];
  private sessionStartTime: number = 0;

  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      (window.webkitSpeechRecognition !== undefined || window.SpeechRecognition !== undefined)
    );
  }

  async startTranscription(
    onUpdate: (entries: EnhancedTranscript[]) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Web Speech API is not supported in this browser');
    }

    try {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error('Speech recognition not available');
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.onTranscriptUpdate = onUpdate;
      this.entries = [];
      this.sessionStartTime = Date.now();

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const newEntries: EnhancedTranscript[] = [];
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (transcript.trim().length > 0) {
            const entry: EnhancedTranscript = {
              id: `realtime_${Date.now()}_${i}`,
              timestamp: Date.now() - this.sessionStartTime,
              speaker: this.identifySpeaker(transcript),
              text: transcript,
              confidence: result[0].confidence || 0.8,
              aiEnhanced: false,
              speakerRole: this.getSpeakerRole(transcript),
            };

            // Update existing entry if interim, or add new if final
            if (result.isFinal) {
              newEntries.push(entry);
            } else {
              // Update interim result
              const existingIndex = this.entries.findIndex(e => e.id.startsWith('realtime_interim'));
              if (existingIndex >= 0) {
                this.entries[existingIndex] = entry;
              } else {
                entry.id = 'realtime_interim_' + Date.now();
                this.entries.push(entry);
              }
            }
          }
        }

        // Filter out interim entries and add final ones
        this.entries = [
          ...this.entries.filter(e => !e.id.startsWith('realtime_interim')),
          ...newEntries,
        ];

        this.onTranscriptUpdate?.(this.entries);
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const errorMessage = this.getErrorMessage(event.error);
        onError?.(errorMessage);
        console.error('Speech recognition error:', event.error, event.message);
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          // Restart if it ended unexpectedly
          try {
            this.recognition?.start();
          } catch (error) {
            console.error('Failed to restart recognition:', error);
            this.isListening = false;
          }
        }
      };

      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      this.isListening = false;
      throw error;
    }
  }

  stopTranscription(): EnhancedTranscript[] {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    this.isListening = false;
    return [...this.entries];
  }

  private identifySpeaker(text: string): string {
    const lowerText = text.toLowerCase();
    
    // Simple heuristic-based speaker identification
    // In a real app, you'd use more sophisticated speaker diarization
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

  private getErrorMessage(error: string): string {
    switch (error) {
      case 'no-speech':
        return 'No speech detected. Please speak louder.';
      case 'aborted':
        return 'Speech recognition was aborted.';
      case 'audio-capture':
        return 'Microphone not found or not accessible.';
      case 'network':
        return 'Network error occurred.';
      case 'not-allowed':
        return 'Microphone permission denied. Please allow microphone access.';
      case 'service-not-allowed':
        return 'Speech recognition service not allowed.';
      default:
        return `Speech recognition error: ${error}`;
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  getEntries(): EnhancedTranscript[] {
    return [...this.entries];
  }

  clearEntries(): void {
    this.entries = [];
    this.onTranscriptUpdate?.([]);
  }
}

export default new RealTimeTranscriptionService();

