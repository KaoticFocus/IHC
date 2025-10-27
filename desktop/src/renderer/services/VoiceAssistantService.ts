const { ipcRenderer } = window.require('electron');

export interface AssistantResponse {
  text: string;
  transcription?: string;
  shouldExecute: boolean;
  action?: string;
  parameters?: Record<string, any>;
  audioPath?: string;
}

class VoiceAssistantService {
  private currentContext: string = 'main';
  private commandHistory: string[] = [];

  setContext(context: string) {
    this.currentContext = context;
  }

  async processVoiceCommand(audioFilePath: string): Promise<AssistantResponse> {
    try {
      const transcriptionResult = await ipcRenderer.invoke('transcribe-audio', audioFilePath);
      
      if (!transcriptionResult.success) {
        throw new Error(transcriptionResult.error);
      }

      const commandText = transcriptionResult.text || '';

      this.commandHistory.push(commandText);
      if (this.commandHistory.length > 10) {
        this.commandHistory.shift();
      }

      const response = await this.analyzeCommand(commandText);
      response.transcription = commandText;

      if (response.text) {
        const speechResult = await ipcRenderer.invoke('generate-speech', response.text);
        if (speechResult.success) {
          response.audioPath = speechResult.audioPath;
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

  private async analyzeCommand(commandText: string): Promise<AssistantResponse> {
    try {
      // Use OpenAI to generate an intelligent response
      const analysisResult = await ipcRenderer.invoke('analyze-voice-command', {
        command: commandText,
        context: this.currentContext
      });

      if (analysisResult.success) {
        return {
          text: analysisResult.response,
          shouldExecute: analysisResult.shouldExecute || false,
          action: analysisResult.action,
          parameters: analysisResult.parameters,
        };
      } else {
        throw new Error(analysisResult.error);
      }
    } catch (error) {
      console.error('Error analyzing command:', error);
      // Fallback to simple echo if OpenAI fails
      return {
        text: `I heard you say: "${commandText}". How can I help you with that?`,
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