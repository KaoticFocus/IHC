export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  type?: LeadType;
  status?: LeadStatus;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
  projects?: ProjectInfo[];
}

export type LeadType = 'bathroom' | 'kitchen' | 'basement' | 'addition' | 'deck' | 'roofing' | 'other';

export type LeadStatus = 'lead' | 'qualified' | 'estimate' | 'closed' | 'lost';

export interface ProjectInfo {
  id: string;
  name: string;
  type: LeadType;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: LeadStatus;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface LeadSource {
  type: 'referral' | 'website' | 'social' | 'advertising' | 'other';
  details?: string;
}

