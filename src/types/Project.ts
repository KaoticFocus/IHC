export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  type: 'document' | 'image' | 'pdf' | 'other';
  mimeType: string;
  filePath: string;
  fileSize: number;
  uploadedAt: Date;
  updatedAt: Date;
  description?: string;
  url?: string; // Public URL for viewing/downloading
  localPath?: string; // Local file path for mobile
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  address?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  documents: ProjectDocument[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  status?: Project['status'];
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  address?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  id: string;
}

