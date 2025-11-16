import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from './SupabaseService';
import { Consultation, ConsultationPhoto, CreateConsultationInput, UpdateConsultationInput } from '../types/Consultation';

/**
 * Consultation Management Service using Supabase
 * Handles consultations with optional recordings, photos, and notes
 */
class ConsultationService {
  private supabase: SupabaseClient | null = null;
  private initialized: boolean = false;

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (isSupabaseConfigured()) {
      this.supabase = getSupabaseClient();
      if (this.supabase) {
        const { data: { session } } = await this.supabase.auth.getSession();
        if (!session) {
          console.warn('No Supabase session found. Consultation management requires authentication.');
        }
      }
    } else {
      console.warn('Supabase not configured. Consultation management will not work.');
    }

    this.initialized = true;
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return !!this.supabase;
  }

  /**
   * Get current user ID
   */
  private async getUserId(): Promise<string | null> {
    if (!this.supabase) return null;
    const { data: { user } } = await this.supabase.auth.getUser();
    return user?.id || null;
  }

  /**
   * Create a new consultation
   */
  async createConsultation(input: CreateConsultationInput): Promise<Consultation> {
    await this.initialize();
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const userId = await this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const consultationId = `consultation_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const consultationDate = input.consultationDate || new Date();

    const consultation: Omit<Consultation, 'photos'> = {
      id: consultationId,
      userId,
      projectId: input.projectId,
      title: input.title,
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      clientPhone: input.clientPhone,
      address: input.address,
      consultationDate,
      hasRecording: !!input.recordingId,
      recordingId: input.recordingId,
      sessionId: input.sessionId,
      notes: input.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { error } = await this.supabase
      .from('consultations')
      .insert({
        id: consultationId,
        user_id: userId,
        project_id: consultation.projectId,
        title: consultation.title,
        client_name: consultation.clientName,
        client_email: consultation.clientEmail,
        client_phone: consultation.clientPhone,
        address: consultation.address,
        consultation_date: consultationDate.toISOString(),
        has_recording: consultation.hasRecording,
        recording_id: consultation.recordingId,
        session_id: consultation.sessionId,
        notes: consultation.notes,
        created_at: consultation.createdAt.toISOString(),
        updated_at: consultation.updatedAt.toISOString(),
      });

    if (error) throw error;

    return {
      ...consultation,
      photos: [],
    };
  }

  /**
   * Get all consultations for the current user
   */
  async getAllConsultations(): Promise<Consultation[]> {
    await this.initialize();
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const userId = await this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await this.supabase
      .from('consultations')
      .select('*')
      .eq('user_id', userId)
      .order('consultation_date', { ascending: false });

    if (error) throw error;

    // Fetch photos for each consultation
    const consultationsWithPhotos = await Promise.all(
      (data || []).map(async (consultation) => {
        const photos = await this.getConsultationPhotos(consultation.id);
        return this.mapConsultationFromDb(consultation, photos);
      })
    );

    return consultationsWithPhotos;
  }

  /**
   * Get a single consultation by ID
   */
  async getConsultation(consultationId: string): Promise<Consultation | null> {
    await this.initialize();
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const userId = await this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await this.supabase
      .from('consultations')
      .select('*')
      .eq('id', consultationId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    if (!data) return null;

    const photos = await this.getConsultationPhotos(consultationId);
    return this.mapConsultationFromDb(data, photos);
  }

  /**
   * Update a consultation
   */
  async updateConsultation(input: UpdateConsultationInput): Promise<Consultation> {
    await this.initialize();
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const userId = await this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) updateData.title = input.title;
    if (input.projectId !== undefined) updateData.project_id = input.projectId;
    if (input.clientName !== undefined) updateData.client_name = input.clientName;
    if (input.clientEmail !== undefined) updateData.client_email = input.clientEmail;
    if (input.clientPhone !== undefined) updateData.client_phone = input.clientPhone;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.consultationDate !== undefined) updateData.consultation_date = input.consultationDate.toISOString();
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.recordingId !== undefined) {
      updateData.recording_id = input.recordingId;
      updateData.has_recording = !!input.recordingId;
    }
    if (input.sessionId !== undefined) updateData.session_id = input.sessionId;

    const { data, error } = await this.supabase
      .from('consultations')
      .update(updateData)
      .eq('id', input.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    const photos = await this.getConsultationPhotos(input.id);
    return this.mapConsultationFromDb(data, photos);
  }

  /**
   * Delete a consultation
   */
  async deleteConsultation(consultationId: string): Promise<void> {
    await this.initialize();
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const userId = await this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Delete all photos first
    const photos = await this.getConsultationPhotos(consultationId);
    for (const photo of photos) {
      await this.deletePhoto(consultationId, photo.id);
    }

    // Delete the consultation
    const { error } = await this.supabase
      .from('consultations')
      .delete()
      .eq('id', consultationId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Upload a photo to a consultation
   */
  async uploadPhoto(
    consultationId: string,
    file: File,
    description?: string
  ): Promise<ConsultationPhoto> {
    await this.initialize();
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const userId = await this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Upload to Supabase Storage
    const fileName = `${userId}/${consultationId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await this.supabase.storage
      .from('consultation-photos')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from('consultation-photos')
      .getPublicUrl(fileName);

    // Save photo metadata
    const photoId = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const photo: Omit<ConsultationPhoto, 'url'> = {
      id: photoId,
      consultationId,
      name: file.name,
      filePath: fileName,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date(),
      description,
    };

    const { error: photoError } = await this.supabase
      .from('consultation_photos')
      .insert({
        id: photoId,
        consultation_id: consultationId,
        name: file.name,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type,
        description,
        uploaded_at: photo.uploadedAt.toISOString(),
      })
      .select()
      .single();

    if (photoError) {
      // Clean up uploaded file if metadata save fails
      await this.supabase.storage.from('consultation-photos').remove([fileName]);
      throw photoError;
    }

    return {
      ...photo,
      url: urlData.publicUrl,
    };
  }

  /**
   * Get all photos for a consultation
   */
  async getConsultationPhotos(consultationId: string): Promise<ConsultationPhoto[]> {
    await this.initialize();
    if (!this.supabase) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('consultation_photos')
      .select('*')
      .eq('consultation_id', consultationId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching photos:', error);
      return [];
    }

    return (data || []).map((photo) => {
      const { data: urlData } = this.supabase!.storage
        .from('consultation-photos')
        .getPublicUrl(photo.file_path);

      return {
        id: photo.id,
        consultationId: photo.consultation_id,
        name: photo.name,
        filePath: photo.file_path,
        fileSize: photo.file_size,
        mimeType: photo.mime_type,
        uploadedAt: new Date(photo.uploaded_at),
        description: photo.description,
        url: urlData.publicUrl,
      };
    });
  }

  /**
   * Update photo description
   */
  async updatePhotoDescription(consultationId: string, photoId: string, description: string): Promise<void> {
    await this.initialize();
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const userId = await this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { error } = await this.supabase
      .from('consultation_photos')
      .update({ description })
      .eq('id', photoId)
      .eq('consultation_id', consultationId);

    if (error) throw error;
  }

  /**
   * Update work description for photos (stores in description field with work prefix)
   */
  async updatePhotoWorkDescription(consultationId: string, photoIds: string[], workDescription: string): Promise<void> {
    await this.initialize();
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const userId = await this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Update each photo with work description
    for (const photoId of photoIds) {
      // Get current description
      const { data: photo } = await this.supabase
        .from('consultation_photos')
        .select('description')
        .eq('id', photoId)
        .eq('consultation_id', consultationId)
        .single();

      const currentDescription = photo?.description || '';
      const workPrefix = 'WORK: ';
      const newDescription = currentDescription 
        ? `${currentDescription}\n\n${workPrefix}${workDescription}`
        : `${workPrefix}${workDescription}`;

      const { error } = await this.supabase
        .from('consultation_photos')
        .update({ description: newDescription })
        .eq('id', photoId)
        .eq('consultation_id', consultationId);

      if (error) {
        console.error(`Error updating photo ${photoId}:`, error);
      }
    }
  }

  /**
   * Delete a photo
   */
  async deletePhoto(consultationId: string, photoId: string): Promise<void> {
    await this.initialize();
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const userId = await this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Get photo to find file path
    const { data: photo, error: fetchError } = await this.supabase
      .from('consultation_photos')
      .select('file_path')
      .eq('id', photoId)
      .eq('consultation_id', consultationId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage
    if (photo?.file_path) {
      const { error: storageError } = await this.supabase.storage
        .from('consultation-photos')
        .remove([photo.file_path]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue with metadata deletion even if storage deletion fails
      }
    }

    // Delete metadata
    const { error: deleteError } = await this.supabase
      .from('consultation_photos')
      .delete()
      .eq('id', photoId)
      .eq('consultation_id', consultationId);

    if (deleteError) throw deleteError;
  }

  /**
   * Map database consultation to Consultation type
   */
  private mapConsultationFromDb(dbConsultation: any, photos: ConsultationPhoto[]): Consultation {
    return {
      id: dbConsultation.id,
      userId: dbConsultation.user_id,
      projectId: dbConsultation.project_id,
      title: dbConsultation.title,
      clientName: dbConsultation.client_name,
      clientEmail: dbConsultation.client_email,
      clientPhone: dbConsultation.client_phone,
      address: dbConsultation.address,
      consultationDate: new Date(dbConsultation.consultation_date),
      hasRecording: dbConsultation.has_recording || false,
      recordingId: dbConsultation.recording_id,
      sessionId: dbConsultation.session_id,
      notes: dbConsultation.notes,
      photos,
      createdAt: new Date(dbConsultation.created_at),
      updatedAt: new Date(dbConsultation.updated_at),
    };
  }
}

export default new ConsultationService();

