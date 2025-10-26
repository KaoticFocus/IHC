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
}