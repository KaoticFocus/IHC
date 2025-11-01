import StorageService from './StorageService';
import OpenAI from 'openai';

class OpenAIService {
  private openai: OpenAI | null = null;

  async hasApiKey(): Promise<boolean> {
    const apiKey = await StorageService.getSetting('openai_api_key');
    return !!apiKey;
  }

  async setApiKey(key: string): Promise<void> {
    this.openai = new OpenAI({ apiKey: key });
    await StorageService.setSetting('openai_api_key', key);
  }

  async initialize(): Promise<void> {
    const apiKey = await StorageService.getSetting('openai_api_key');
    if (apiKey && !this.openai) {
      this.openai = new OpenAI({ apiKey: apiKey });
    }
  }

  async transcribeAudio(audioBlob: Blob): Promise<{
    text: string;
    segments: Array<{
      id: number;
      start: number;
      end: number;
      text: string;
    }>;
  }> {
    await this.initialize();
    
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Please set API key in settings.');
    }

    // Convert Blob to File-like object for OpenAI
    const file = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

    const transcription = await this.openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
    });

    return {
      text: transcription.text,
      segments: [],
    };
  }

  async generateSpeech(text: string): Promise<Blob> {
    await this.initialize();
    
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Please set API key in settings.');
    }

    const response = await this.openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });

    const arrayBuffer = await response.arrayBuffer();
    return new Blob([arrayBuffer], { type: 'audio/mpeg' });
  }

  async analyzeConversation(transcript: string): Promise<any> {
    await this.initialize();
    
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Please set API key in settings.');
    }

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that analyzes conversations and extracts key information, summaries, and action items."
        },
        {
          role: "user",
          content: `Please analyze this conversation transcript:\n\n${transcript}\n\nProvide a summary, key points, and action items.`
        }
      ],
      temperature: 0.3,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    return {
      summary: responseText,
      keyPoints: [],
      actionItems: [],
    };
  }

  async analyzeVoiceCommand(command: string, context: string): Promise<{
    response: string;
    shouldExecute: boolean;
    action?: string;
    parameters?: Record<string, any>;
  }> {
    await this.initialize();
    
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Please set API key in settings.');
    }

    const systemPrompt = `You are a helpful AI assistant for the IHC Conversation Recorder app.
The user is currently on the "${context}" screen.

You can help users with:
1. Creating leads - Extract: name, type (bathroom/kitchen/etc), phone, email, address
2. Navigating the app - Tell them to click on menu items
3. Managing documents - Upload, read, or analyze documents
4. Recording conversations - Start/stop transcripts
5. General questions - Answer helpfully

When the user wants to CREATE A LEAD, respond with JSON in this EXACT format:
{
  "action": "create_lead",
  "response": "I'll create a lead for [name].",
  "data": {
    "name": "Full Name",
    "type": "bathroom/kitchen/etc",
    "phone": "123-456-7890",
    "email": "email@example.com",
    "address": "Full Address"
  }
}

For navigation commands (open documents, view leads, etc), respond with:
{
  "action": "navigate",
  "response": "Opening [screen name].",
  "data": {
    "screen": "documents/leads/transcripts/home"
  }
}

For general questions or help, respond with:
{
  "action": "none",
  "response": "Your helpful answer here."
}

IMPORTANT: Always respond with valid JSON only. No extra text.`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: command }
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const responseText = completion.choices[0]?.message?.content || '{"action":"none","response":"I\'m not sure how to help with that."}';
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      parsedResponse = {
        action: "none",
        response: responseText
      };
    }

    return {
      response: parsedResponse.response || responseText,
      shouldExecute: parsedResponse.action !== "none",
      action: parsedResponse.action,
      parameters: parsedResponse.data,
    };
  }
}

export default new OpenAIService();

