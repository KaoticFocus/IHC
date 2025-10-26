import { ipcMain, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { OpenAI } from 'openai';
import Store from 'electron-store';

const store = new Store();
let openai: OpenAI | null = null;
let currentSpeech: any = null;

// Initialize OpenAI
const apiKey = store.get('openai_api_key') as string;
if (apiKey) {
  openai = new OpenAI({ apiKey });
}

export function setupDocumentHandlers() {
  // Select file
  ipcMain.handle('select-file', async (event, options) => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: options.filters || []
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false };
      }

      const filePath = result.filePaths[0];
      const fileName = path.basename(filePath);
      const fileType = path.extname(filePath).substring(1);

      return {
        success: true,
        filePath,
        fileName,
        fileType
      };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Failed to select file:', err);
      return { success: false, error: err.message };
    }
  });

  // Read file content
  ipcMain.handle('read-file-content', async (event, filePath: string) => {
    try {
      const ext = path.extname(filePath).toLowerCase();
      let content = '';

      if (ext === '.txt') {
        content = fs.readFileSync(filePath, 'utf8');
      } else if (ext === '.pdf') {
        // For PDF, we'd need a PDF parser library like pdf-parse
        // For now, return a placeholder
        content = 'PDF parsing not yet implemented. Please use .txt files for now.';
      } else if (ext === '.docx' || ext === '.doc') {
        // For DOCX, we'd need a library like mammoth
        // For now, return a placeholder
        content = 'DOCX parsing not yet implemented. Please use .txt files for now.';
      } else {
        content = fs.readFileSync(filePath, 'utf8');
      }

      return { success: true, content };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Failed to read file:', err);
      return { success: false, error: err.message };
    }
  });

  // Read text aloud using OpenAI TTS
  ipcMain.handle('read-text-aloud', async (event, text: string) => {
    try {
      if (!openai) {
        // Re-initialize if needed
        const apiKey = store.get('openai_api_key') as string;
        if (!apiKey) {
          throw new Error('OpenAI API key not set');
        }
        openai = new OpenAI({ apiKey });
      }

      // Split text into chunks if too long (OpenAI TTS has limits)
      const maxLength = 4000;
      const chunks = [];
      
      for (let i = 0; i < text.length; i += maxLength) {
        chunks.push(text.substring(i, i + maxLength));
      }

      // Generate and play speech for each chunk
      for (const chunk of chunks) {
        const response = await openai.audio.speech.create({
          model: "tts-1",
          voice: "alloy",
          input: chunk,
        });

        const buffer = Buffer.from(await response.arrayBuffer());
        const audioPath = path.join(require('electron').app.getPath('userData'), `tts_${Date.now()}.mp3`);
        fs.writeFileSync(audioPath, buffer);

        // Play the audio
        await new Promise((resolve) => {
          const { Howl } = require('howler');
          currentSpeech = new Howl({
            src: [audioPath],
            html5: true,
            format: ['mp3'],
            onend: () => {
              currentSpeech = null;
              resolve(true);
            }
          });
          currentSpeech.play();
        });
      }

      return { success: true };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Failed to read text aloud:', err);
      return { success: false, error: err.message };
    }
  });

  // Stop reading
  ipcMain.handle('stop-reading', async () => {
    try {
      if (currentSpeech) {
        currentSpeech.stop();
        currentSpeech = null;
      }
      return { success: true };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Failed to stop reading:', err);
      return { success: false, error: err.message };
    }
  });

  // Analyze document with AI
  ipcMain.handle('analyze-document', async (event, content: string) => {
    try {
      if (!openai) {
        const apiKey = store.get('openai_api_key') as string;
        if (!apiKey) {
          throw new Error('OpenAI API key not set');
        }
        openai = new OpenAI({ apiKey });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that analyzes documents and provides summaries and key points."
          },
          {
            role: "user",
            content: `Please analyze the following document and provide:\n1. A brief summary\n2. Key points (as a bullet list)\n3. Any action items\n\nDocument:\n${content}`
          }
        ],
        max_tokens: 1000
      });

      const analysis = response.choices[0].message.content || '';
      
      // Parse the response to extract summary and key points
      const lines = analysis.split('\n');
      const summary = lines.slice(0, 3).join(' ');
      const keyPoints = lines.filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'));

      return {
        success: true,
        summary,
        keyPoints,
        fullAnalysis: analysis
      };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Failed to analyze document:', err);
      return { success: false, error: err.message };
    }
  });
}
