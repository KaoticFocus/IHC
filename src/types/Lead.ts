export interface ContactInfo {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumbers: {
    primary: string;
    secondary?: string;
  };
  emailAddresses: {
    primary: string;
    secondary?: string;
  };
}

export interface PropertyInfo {
  yearConstructed?: number;
  estimatedValue?: number;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  lotSize?: string;
  propertyType?: string;
  zillowUrl?: string;
  lastUpdated: Date;
}

export interface ProjectInfo {
  id: string;
  name: string;
  type: 'kitchen' | 'bathroom' | 'basement' | 'addition' | 'exterior' | 'whole_house' | 'other';
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedBudget?: number;
  status: 'lead' | 'quoted' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadSource {
  type: 'referral' | 'website' | 'social_media' | 'advertisement' | 'walk_in' | 'repeat_client' | 'other';
  details: string;
  referrerName?: string;
  campaignName?: string;
}

export interface DocumentInfo {
  id: string;
  name: string;
  type: 'photo' | 'drawing' | 'estimate' | 'scope_of_work' | 'contract' | 'permit' | 'other';
  category: 'before' | 'during' | 'after' | 'planning' | 'legal' | 'financial';
  filePath: string;
  fileSize: number;
  uploadedAt: Date;
  description?: string;
}

export interface Lead {
  id: string;
  contactInfo: ContactInfo;
  propertyInfo: PropertyInfo;
  projects: ProjectInfo[];
  leadSource: LeadSource;
  documents: DocumentInfo[];
  notes: string;
  status: 'new' | 'contacted' | 'consultation_scheduled' | 'consultation_completed' | 'quoted' | 'closed_won' | 'closed_lost';
  createdAt: Date;
  updatedAt: Date;
  lastContactDate?: Date;
  nextFollowUpDate?: Date;
}
