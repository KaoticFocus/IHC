import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from './SupabaseService';
import StorageService from './StorageService';
import { Lead } from '../types/Lead';
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

    try {
      // Sync leads
      const localLeads = await StorageService.getLeads();
      if (localLeads.length > 0) {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (user) {
          for (const lead of localLeads) {
            await this.supabase.from('leads').upsert({
              id: lead.id,
              user_id: user.id,
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              address: lead.address,
              type: lead.type,
              status: lead.status,
              notes: lead.notes,
              projects: lead.projects || [],
            });
          }
        }
      }
    } catch (error) {
      console.error('Error syncing to cloud:', error);
    }
  }

  /**
   * Sync from Supabase to local storage
   */
  async syncFromCloud(): Promise<void> {
    if (!this.useSupabase || !this.supabase) {
      return;
    }

    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return;

      // Sync leads
      const { data: cloudLeads, error } = await this.supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (cloudLeads) {
        // Merge with local storage
        const localLeads = await StorageService.getLeads();
        const mergedLeads = this.mergeLeads(localLeads, cloudLeads);
        
        // Save merged leads locally
        for (const lead of mergedLeads) {
          await StorageService.saveLead(lead);
        }
      }
    } catch (error) {
      console.error('Error syncing from cloud:', error);
    }
  }

  private mergeLeads(local: Lead[], cloud: any[]): Lead[] {
    const merged = new Map<string, Lead>();

    // Add local leads
    local.forEach(lead => merged.set(lead.id, lead));

    // Merge cloud leads (cloud takes precedence for conflicts)
    cloud.forEach(cloudLead => {
      const existing = merged.get(cloudLead.id);
      if (!existing || new Date(cloudLead.updated_at) > new Date(existing.createdAt || 0)) {
        merged.set(cloudLead.id, {
          id: cloudLead.id,
          name: cloudLead.name,
          email: cloudLead.email,
          phone: cloudLead.phone,
          address: cloudLead.address,
          type: cloudLead.type,
          status: cloudLead.status,
          notes: cloudLead.notes,
          projects: cloudLead.projects,
          createdAt: cloudLead.created_at,
          updatedAt: cloudLead.updated_at,
        });
      }
    });

    return Array.from(merged.values());
  }

  /**
   * Save lead (syncs to Supabase if available)
   */
  async saveLead(lead: Lead): Promise<Lead[]> {
    // Always save locally first
    const localLeads = await StorageService.saveLead(lead);

    // Sync to Supabase if available
    if (this.useSupabase && this.supabase) {
      try {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (user) {
          const { error } = await this.supabase.from('leads').upsert({
            id: lead.id,
            user_id: user.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            address: lead.address,
            type: lead.type,
            status: lead.status,
            notes: lead.notes,
            projects: lead.projects || [],
            updated_at: new Date().toISOString(),
          });

          if (error) {
            console.error('Error saving lead to Supabase:', error);
          }
        }
      } catch (error) {
        console.error('Error syncing lead to cloud:', error);
      }
    }

    return localLeads;
  }

  /**
   * Delete lead (syncs to Supabase if available)
   */
  async deleteLead(id: string): Promise<Lead[]> {
    // Delete locally first
    const localLeads = await StorageService.deleteLead(id);

    // Delete from Supabase if available
    if (this.useSupabase && this.supabase) {
      try {
        const { error } = await this.supabase
          .from('leads')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting lead from Supabase:', error);
        }
      } catch (error) {
        console.error('Error deleting lead from cloud:', error);
      }
    }

    return localLeads;
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

