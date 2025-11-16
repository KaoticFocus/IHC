import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from './SupabaseService';
import { Project, ProjectDocument, CreateProjectInput, UpdateProjectInput } from '../types/Project';

/**
 * Project Management Service using Supabase
 * Handles projects, documents, and images storage
 */
class ProjectManagementService {
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
          console.warn('No Supabase session found. Project management requires authentication.');
        }
      }
    } else {
      console.warn('Supabase not configured. Project management will not work.');
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
   * Create a new project
   */
  async createProject(input: CreateProjectInput): Promise<Project> {
    await this.initialize();
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const userId = await this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const project: Omit<Project, 'documents'> = {
      id: `project_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId,
      name: input.name,
      description: input.description,
      status: input.status || 'planning',
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      clientPhone: input.clientPhone,
      address: input.address,
      startDate: input.startDate,
      endDate: input.endDate,
      budget: input.budget,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { error } = await this.supabase
      .from('projects')
      .insert({
        id: project.id,
        user_id: userId,
        name: project.name,
        description: project.description,
        status: project.status,
        client_name: project.clientName,
        client_email: project.clientEmail,
        client_phone: project.clientPhone,
        address: project.address,
        start_date: project.startDate?.toISOString(),
        end_date: project.endDate?.toISOString(),
        budget: project.budget,
        created_at: project.createdAt.toISOString(),
        updated_at: project.updatedAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...project,
      documents: [],
    };
  }

  /**
   * Get all projects for the current user
   */
  async getAllProjects(): Promise<Project[]> {
    await this.initialize();
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const userId = await this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Fetch documents for each project
    const projectsWithDocuments = await Promise.all(
      (data || []).map(async (project) => {
        const documents = await this.getProjectDocuments(project.id);
        return this.mapProjectFromDb(project, documents);
      })
    );

    return projectsWithDocuments;
  }

  /**
   * Get a single project by ID
   */
  async getProject(projectId: string): Promise<Project | null> {
    await this.initialize();
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const userId = await this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    if (!data) return null;

    const documents = await this.getProjectDocuments(projectId);
    return this.mapProjectFromDb(data, documents);
  }

  /**
   * Update a project
   */
  async updateProject(input: UpdateProjectInput): Promise<Project> {
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

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.clientName !== undefined) updateData.client_name = input.clientName;
    if (input.clientEmail !== undefined) updateData.client_email = input.clientEmail;
    if (input.clientPhone !== undefined) updateData.client_phone = input.clientPhone;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.startDate !== undefined) updateData.start_date = input.startDate?.toISOString();
    if (input.endDate !== undefined) updateData.end_date = input.endDate?.toISOString();
    if (input.budget !== undefined) updateData.budget = input.budget;

    const { data, error } = await this.supabase
      .from('projects')
      .update(updateData)
      .eq('id', input.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    const documents = await this.getProjectDocuments(input.id);
    return this.mapProjectFromDb(data, documents);
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<void> {
    await this.initialize();
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const userId = await this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Delete all documents first
    const documents = await this.getProjectDocuments(projectId);
    for (const doc of documents) {
      await this.deleteDocument(projectId, doc.id);
    }

    // Delete the project
    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Upload a document or image to a project
   */
  async uploadDocument(
    projectId: string,
    file: File,
    description?: string
  ): Promise<ProjectDocument> {
    await this.initialize();
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const userId = await this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Determine file type
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    const type: ProjectDocument['type'] = isImage ? 'image' : isPdf ? 'pdf' : 'document';

    // Upload to Supabase Storage
    const fileName = `${userId}/${projectId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await this.supabase.storage
      .from('project-files')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from('project-files')
      .getPublicUrl(fileName);

    // Save document metadata
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const document: Omit<ProjectDocument, 'url'> = {
      id: documentId,
      projectId,
      name: file.name,
      type,
      mimeType: file.type,
      filePath: fileName,
      fileSize: file.size,
      uploadedAt: new Date(),
      updatedAt: new Date(),
      description,
    };

    const { error: docError } = await this.supabase
      .from('project_documents')
      .insert({
        id: documentId,
        project_id: projectId,
        name: file.name,
        type,
        mime_type: file.type,
        file_path: fileName,
        file_size: file.size,
        description,
        uploaded_at: document.uploadedAt.toISOString(),
        updated_at: document.updatedAt.toISOString(),
      })
      .select()
      .single();

    if (docError) {
      // Clean up uploaded file if metadata save fails
      await this.supabase.storage.from('project-files').remove([fileName]);
      throw docError;
    }

    return {
      ...document,
      url: urlData.publicUrl,
    };
  }

  /**
   * Get all documents for a project
   */
  async getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
    await this.initialize();
    if (!this.supabase) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('project_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }

    return (data || []).map((doc) => {
      const { data: urlData } = this.supabase!.storage
        .from('project-files')
        .getPublicUrl(doc.file_path);

      return {
        id: doc.id,
        projectId: doc.project_id,
        name: doc.name,
        type: doc.type,
        mimeType: doc.mime_type,
        filePath: doc.file_path,
        fileSize: doc.file_size,
        uploadedAt: new Date(doc.uploaded_at),
        updatedAt: new Date(doc.updated_at),
        description: doc.description,
        url: urlData.publicUrl,
      };
    });
  }

  /**
   * Delete a document
   */
  async deleteDocument(projectId: string, documentId: string): Promise<void> {
    await this.initialize();
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const userId = await this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Get document to find file path
    const { data: doc, error: fetchError } = await this.supabase
      .from('project_documents')
      .select('file_path')
      .eq('id', documentId)
      .eq('project_id', projectId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage
    if (doc?.file_path) {
      const { error: storageError } = await this.supabase.storage
        .from('project-files')
        .remove([doc.file_path]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue with metadata deletion even if storage deletion fails
      }
    }

    // Delete metadata
    const { error: deleteError } = await this.supabase
      .from('project_documents')
      .delete()
      .eq('id', documentId)
      .eq('project_id', projectId);

    if (deleteError) throw deleteError;
  }

  /**
   * Map database project to Project type
   */
  private mapProjectFromDb(dbProject: any, documents: ProjectDocument[]): Project {
    return {
      id: dbProject.id,
      userId: dbProject.user_id,
      name: dbProject.name,
      description: dbProject.description,
      status: dbProject.status,
      clientName: dbProject.client_name,
      clientEmail: dbProject.client_email,
      clientPhone: dbProject.client_phone,
      address: dbProject.address,
      startDate: dbProject.start_date ? new Date(dbProject.start_date) : undefined,
      endDate: dbProject.end_date ? new Date(dbProject.end_date) : undefined,
      budget: dbProject.budget,
      documents,
      createdAt: new Date(dbProject.created_at),
      updatedAt: new Date(dbProject.updated_at),
    };
  }
}

export default new ProjectManagementService();

