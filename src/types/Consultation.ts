export interface ConsultationPhoto {
  id: string;
  consultationId: string;
  name: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  url?: string; // Public URL for viewing/downloading
  uploadedAt: Date;
  description?: string;
  localPath?: string; // Local file path for mobile
}

export interface Consultation {
  id: string;
  userId: string;
  title: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  address?: string;
  consultationDate: Date;
  hasRecording: boolean;
  recordingId?: string; // Reference to recording/transcript if recording was approved
  sessionId?: string; // Reference to transcription session
  notes?: string; // Text notes for recapping consultation
  photos: ConsultationPhoto[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConsultationInput {
  title: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  address?: string;
  consultationDate?: Date;
  recordingId?: string;
  sessionId?: string;
  notes?: string;
}

export interface UpdateConsultationInput extends Partial<CreateConsultationInput> {
  id: string;
}

