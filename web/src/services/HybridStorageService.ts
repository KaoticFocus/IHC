import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from './SupabaseService';
import StorageService from './StorageService';
import { EnhancedTranscript } from './EnhancedTranscriptionService';

/**
 * Hybrid Storage Service that uses Supabase when available,
 * falls back to IndexedDB for offline/local storage
 */
class HybridStorageService {
  private useSupabase: boolean = false;
  private supabase: SupabaseClient | null = null;

  constructor() {
    this.checkSupabaseAvailability();
  }

  private async checkSupabaseAvailability(): Promise<void> {
    if (isSupabaseConfigured()) {
      this.supabase = getSupabaseClient();
      if (this.supabase) {
        // Check if user is authenticated
        const { data: { session } } = await this.supabase.auth.getSession();
        this.useSupabase = !!session;
      }
    }
  }

  /**
   * Sync local data to Supabase
   */
  async syncToCloud(): Promise<void> {
    if (!this.useSupabase || !this.supabase) {
      return;
    }
    // No lead syncing needed
  }

  /**
   * Sync from Supabase to local storage
   */
  async syncFromCloud(): Promise<void> {
    if (!this.useSupabase || !this.supabase) {
      return;
    }
    // No lead syncing needed
  }

  /**
   * Upload recording to Supabase Storage
   */
  async uploadRecording(id: string, blob: Blob, transcriptId?: string): Promise<string | null> {
    if (!this.useSupabase || !this.supabase) {
      // Fallback to local storage
      await StorageService.saveRecording(id, blob);
      return null;
    }

    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return null;

      const fileName = `${user.id}/${id}.webm`;
      const { data, error } = await this.supabase.storage
        .from('recordings')
        .upload(fileName, blob, {
          contentType: 'audio/webm',
          upsert: true,
        });

      if (error) throw error;

      // Save metadata
      const { error: metaError } = await this.supabase.from('recordings').upsert({
        id: id,
        user_id: user.id,
        transcript_id: transcriptId,
        file_path: fileName,
        file_size: blob.size,
        mime_type: 'audio/webm',
        created_at: new Date().toISOString(),
      });

      if (metaError) {
        console.error('Error saving recording metadata:', metaError);
      }

      return data.path;
    } catch (error) {
      console.error('Error uploading recording:', error);
      // Fallback to local storage
      await StorageService.saveRecording(id, blob);
      return null;
    }
  }

  /**
   * Download recording from Supabase Storage
   */
  async downloadRecording(id: string): Promise<Blob | null> {
    if (!this.useSupabase || !this.supabase) {
      return await StorageService.getRecording(id);
    }

    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return null;

      // Get recording metadata
      const { data: recording, error: metaError } = await this.supabase
        .from('recordings')
        .select('file_path')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (metaError || !recording) {
        // Fallback to local storage
        return await StorageService.getRecording(id);
      }

      // Download file
      const { data, error } = await this.supabase.storage
        .from('recordings')
        .download(recording.file_path);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error downloading recording:', error);
      // Fallback to local storage
      return await StorageService.getRecording(id);
    }
  }

  /**
   * Save transcript to Supabase
   */
  async saveTranscript(
    sessionId: string,
    entries: EnhancedTranscript[],
    aiAnalysis?: any
  ): Promise<void> {
    // Always save locally first
    await StorageService.setSetting(`transcript_${sessionId}`, {
      sessionId,
      timestamp: new Date().toISOString(),
      entries,
      aiAnalysis,
      totalDuration: entries.length > 0 ? entries[entries.length - 1].timestamp : 0,
      wordCount: entries.reduce((count, entry) => count + entry.text.split(' ').length, 0),
      aiEnhanced: entries.some(entry => entry.aiEnhanced),
      speakerCount: new Set(entries.map(entry => entry.speaker)).size,
    });

    // Sync to Supabase if available
    if (this.useSupabase && this.supabase) {
      try {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (user) {
          const { error } = await this.supabase.from('transcripts').upsert({
            id: sessionId,
            user_id: user.id,
            session_id: sessionId,
            title: `Transcript ${new Date().toLocaleDateString()}`,
            entries: entries,
            ai_analysis: aiAnalysis,
            total_duration: entries.length > 0 ? entries[entries.length - 1].timestamp : 0,
            word_count: entries.reduce((count, entry) => count + entry.text.split(' ').length, 0),
            ai_enhanced: entries.some(entry => entry.aiEnhanced),
            speaker_count: new Set(entries.map(entry => entry.speaker)).size,
            updated_at: new Date().toISOString(),
          });

          if (error) {
            console.error('Error saving transcript to Supabase:', error);
          }
        }
      } catch (error) {
        console.error('Error syncing transcript to cloud:', error);
      }
    }
  }

  /**
   * Check if Supabase is enabled and user is authenticated
   */
  isCloudEnabled(): boolean {
    return this.useSupabase;
  }

  /**
   * Enable cloud sync
   */
  async enableCloudSync(): Promise<void> {
    await this.checkSupabaseAvailability();
  }
}

export default new HybridStorageService();

