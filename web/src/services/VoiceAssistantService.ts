import OpenAIService from './OpenAIService';
import StorageService from './StorageService';

export interface AssistantResponse {
  text: string;
  transcription?: string;
  shouldExecute: boolean;
  action?: string;
  parameters?: Record<string, any>;
  audioBlob?: Blob;
  isConversation?: boolean;
}

class VoiceAssistantService {
  private currentContext: string = 'main';
  private commandHistory: string[] = [];
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  private isConversationMode: boolean = false;

  setContext(context: string) {
    this.currentContext = context;
  }

  async processVoiceCommand(recordingId: string, isConversation: boolean = false): Promise<AssistantResponse> {
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

      let response: AssistantResponse;

      if (isConversation || this.isConversationMode) {
        // Conversational mode - use chat API
        response = await this.processConversation(commandText);
      } else {
        // Command mode - analyze for actions
        const analysisResult = await OpenAIService.analyzeVoiceCommand(commandText, this.currentContext);
        
        response = {
          text: analysisResult.response,
          transcription: commandText,
          shouldExecute: analysisResult.shouldExecute || false,
          action: analysisResult.action,
          parameters: analysisResult.parameters,
          isConversation: false,
        };
      }

      // Generate speech for the response
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
        isConversation: isConversation || this.isConversationMode,
      };
    }
  }

  private async processConversation(userMessage: string): Promise<AssistantResponse> {
    try {
      // Add user message to conversation history
      this.conversationHistory.push({ role: 'user', content: userMessage });

      // Check if user wants to exit conversation mode
      const exitPhrases = ['exit conversation', 'stop talking', 'end conversation', 'back to commands'];
      if (exitPhrases.some(phrase => userMessage.toLowerCase().includes(phrase))) {
        this.isConversationMode = false;
        this.conversationHistory = [];
        return {
          text: 'Exiting conversation mode. Say "Hey Flow" followed by a command, or click the mic to start a conversation.',
          transcription: userMessage,
          shouldExecute: false,
          isConversation: false,
        };
      }

      // Use OpenAI Chat API for conversation
      const chatResponse = await OpenAIService.chatCompletion(
        this.conversationHistory,
        this.currentContext
      );

      // Add assistant response to history
      this.conversationHistory.push({ role: 'assistant', content: chatResponse });

      // Keep conversation history manageable (last 10 exchanges)
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return {
        text: chatResponse,
        transcription: userMessage,
        shouldExecute: false,
        isConversation: true,
      };
    } catch (error) {
      console.error('Error processing conversation:', error);
      return {
        text: 'I had trouble processing that. Could you rephrase?',
        transcription: userMessage,
        shouldExecute: false,
        isConversation: true,
      };
    }
  }

  startConversationMode() {
    this.isConversationMode = true;
    this.conversationHistory = [];
  }

  stopConversationMode() {
    this.isConversationMode = false;
    this.conversationHistory = [];
  }

  isInConversationMode(): boolean {
    return this.isConversationMode;
  }

  getCommandHistory(): string[] {
    return [...this.commandHistory];
  }

  clearCommandHistory() {
    this.commandHistory = [];
  }
}

export default new VoiceAssistantService();

