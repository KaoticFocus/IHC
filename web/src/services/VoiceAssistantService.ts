import OpenAIService from './OpenAIService';
import StorageService from './StorageService';

export interface AssistantResponse {
  text: string;
  transcription?: string;
  shouldExecute: boolean;
  action?: string;
  parameters?: Record<string, any>;
  audioBlob?: Blob;
}

class VoiceAssistantService {
  private currentContext: string = 'main';
  private commandHistory: string[] = [];

  setContext(context: string) {
    this.currentContext = context;
  }

  async processVoiceCommand(recordingId: string): Promise<AssistantResponse> {
    try {
      const audioBlob = await StorageService.getRecording(recordingId);
      if (!audioBlob) {
        throw new Error('Recording not found');
      }

      const transcriptionResult = await OpenAIService.transcribeAudio(audioBlob);
      const commandText = transcriptionResult.text || '';

      this.commandHistory.push(commandText);
      if (this.commandHistory.length > 10) {
        this.commandHistory.shift();
      }

      const analysisResult = await OpenAIService.analyzeVoiceCommand(commandText, this.currentContext);
      
      const response: AssistantResponse = {
        text: analysisResult.response,
        transcription: commandText,
        shouldExecute: analysisResult.shouldExecute || false,
        action: analysisResult.action,
        parameters: analysisResult.parameters,
      };

      if (response.text) {
        try {
          const speechBlob = await OpenAIService.generateSpeech(response.text);
          response.audioBlob = speechBlob;
        } catch (error) {
          console.warn('Failed to generate speech:', error);
        }
      }

      return response;
    } catch (error) {
      console.error('Error processing voice command:', error);
      return {
        text: 'Sorry, I had trouble understanding that. Could you please try again?',
        transcription: '',
        shouldExecute: false,
      };
    }
  }

  getCommandHistory(): string[] {
    return [...this.commandHistory];
  }

  clearCommandHistory() {
    this.commandHistory = [];
  }
}

export default new VoiceAssistantService();

