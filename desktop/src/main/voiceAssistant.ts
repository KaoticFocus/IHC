import { ipcMain } from 'electron';
import { OpenAI } from 'openai';
import * as fs from 'fs';
import Store from 'electron-store';

const store = new Store();
let openai: OpenAI | null = null;

export function setupVoiceAssistant() {
  // Initialize OpenAI with API key from settings
  const apiKey = store.get('openai_api_key') as string;
  if (apiKey) {
    openai = new OpenAI({ apiKey });
  }

  ipcMain.handle('check-openai-key', async () => {
    try {
      const hasKey = !!store.get('openai_api_key');
      return { success: hasKey };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Failed to check OpenAI key:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('set-openai-key', async (event, key: string) => {
    try {
      openai = new OpenAI({ apiKey: key });
      store.set('openai_api_key', key);
      return { success: true };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Failed to set OpenAI key:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('transcribe-audio', async (event, audioPath: string) => {
    try {
      if (!openai) {
        throw new Error('OpenAI not initialized. Please set API key in settings.');
      }

      const audioFile = fs.createReadStream(audioPath);
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
      });

      return { success: true, text: transcription.text };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Failed to transcribe audio:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('generate-speech', async (event, text: string) => {
    try {
      if (!openai) {
        throw new Error('OpenAI not initialized. Please set API key in settings.');
      }

      const response = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: text,
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      const audioPath = `${Date.now()}_response.mp3`;
      fs.writeFileSync(audioPath, buffer);

      return { success: true, audioPath };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Failed to generate speech:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('analyze-voice-command', async (event, { command, context }) => {
    try {
      if (!openai) {
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

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: command }
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const responseText = completion.choices[0]?.message?.content || '{"action":"none","response":"I\'m not sure how to help with that."}';
      
      // Parse the JSON response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (parseError) {
        // If JSON parsing fails, treat as a simple response
        parsedResponse = {
          action: "none",
          response: responseText
        };
      }

      return { 
        success: true, 
        response: parsedResponse.response || responseText,
        shouldExecute: parsedResponse.action !== "none",
        action: parsedResponse.action,
        parameters: parsedResponse.data,
      };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Failed to analyze voice command:', err);
      return { success: false, error: err.message };
    }
  });
}