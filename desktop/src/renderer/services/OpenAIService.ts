const { ipcRenderer } = window.require('electron');

class OpenAIService {
  async hasApiKey(): Promise<boolean> {
    try {
      const result = await ipcRenderer.invoke('check-openai-key');
      return result.success;
    } catch (error) {
      console.error('Error checking OpenAI API key:', error);
      return false;
    }
  }

  async setApiKey(key: string): Promise<void> {
    const result = await ipcRenderer.invoke('set-openai-key', key);
    if (!result.success) {
      throw new Error(result.error);
    }
  }

  async transcribeAudio(audioFilePath: string): Promise<{
    text: string;
    segments: Array<{
      id: number;
      start: number;
      end: number;
      text: string;
    }>;
  }> {
    const result = await ipcRenderer.invoke('transcribe-audio', audioFilePath);
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return {
      text: result.text || '',
      segments: [],
    };
  }

  async generateSpeech(text: string): Promise<string> {
    const result = await ipcRenderer.invoke('generate-speech', text);
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return result.audioPath || '';
  }

  async analyzeConversation(transcript: string): Promise<any> {
    // TODO: Implement conversation analysis
    return {
      summary: 'Conversation analysis not implemented yet',
      keyPoints: [],
      actionItems: [],
    };
  }
}

export default new OpenAIService();