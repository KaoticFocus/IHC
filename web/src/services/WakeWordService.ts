import OpenAIService from './OpenAIService';

class WakeWordService {
  private isListeningForWakeWord = false;
  private wakeWordDetectedCallback?: () => void;
  private continuousListener: MediaRecorder | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private wakeWordPhrases = ['hey flow', 'hey flo', 'flow'];

  async startListeningForWakeWord(onWakeWordDetected: () => void): Promise<void> {
    if (this.isListeningForWakeWord) {
      return;
    }

    this.wakeWordDetectedCallback = onWakeWordDetected;
    this.isListeningForWakeWord = true;

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start continuous recording in chunks
      this.continuousListener = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      let audioChunks: Blob[] = [];
      const chunkDuration = 4000; // Check every 4 seconds

      this.continuousListener.ondataavailable = async (event) => {
        if (event.data.size > 0 && this.isListeningForWakeWord) {
          audioChunks.push(event.data);

          // Check for wake word when we have enough audio
          if (audioChunks.length >= 1) {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const hasWakeWord = await this.checkForWakeWord(audioBlob);

            if (hasWakeWord) {
              // Wake word detected!
              this.stopListeningForWakeWord();
              this.wakeWordDetectedCallback?.();
              return;
            }

            // Keep only recent chunks to avoid memory issues
            if (audioChunks.length > 2) {
              audioChunks = audioChunks.slice(-2);
            }
          }
        }
      };

      // Start recording in chunks
      this.continuousListener.start(chunkDuration);

      console.log('[WakeWordService] Started listening for "Hey Flow"');
    } catch (error) {
      console.error('[WakeWordService] Error starting wake word detection:', error);
      this.isListeningForWakeWord = false;
      // Don't throw - allow fallback to manual mic button
    }
  }

  async stopListeningForWakeWord(): Promise<void> {
    if (!this.isListeningForWakeWord) {
      return;
    }

    this.isListeningForWakeWord = false;
    this.wakeWordDetectedCallback = undefined;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.continuousListener) {
      try {
        this.continuousListener.stop();
        this.continuousListener.stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.warn('[WakeWordService] Error stopping recorder:', error);
      }
      this.continuousListener = null;
    }

    console.log('[WakeWordService] Stopped listening for wake word');
  }

  private async checkForWakeWord(audioBlob: Blob): Promise<boolean> {
    try {
      // Only check if we have enough audio data
      if (audioBlob.size < 1000) {
        return false;
      }

      // Transcribe the audio chunk
      const transcriptionResult = await OpenAIService.transcribeAudio(audioBlob);
      const text = transcriptionResult.text.toLowerCase().trim();

      // Check if any wake word phrase is in the transcription
      for (const phrase of this.wakeWordPhrases) {
        if (text.includes(phrase)) {
          console.log(`[WakeWordService] Wake word detected: "${phrase}" in "${text}"`);
          return true;
        }
      }

      return false;
    } catch (error) {
      // If transcription fails, don't trigger wake word
      console.warn('[WakeWordService] Error checking for wake word:', error);
      return false;
    }
  }

  isListening(): boolean {
    return this.isListeningForWakeWord;
  }
}

export default new WakeWordService();

