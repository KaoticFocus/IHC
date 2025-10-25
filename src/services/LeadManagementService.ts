// @ts-ignore - React Native module without types
import RNFS from 'react-native-fs';
// @ts-ignore - React Native module without types
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lead, ContactInfo, ProjectInfo, LeadSource, DocumentInfo } from '../types/Lead';
import PropertyResearchService from './PropertyResearchService';

class LeadManagementService {
  private leads: Map<string, Lead> = new Map();
  private readonly leadsDirectory = `${RNFS.DocumentDirectoryPath}/leads`;
  private readonly documentsDirectory = `${RNFS.DocumentDirectoryPath}/lead_documents`;

  async initialize(): Promise<void> {
    try {
      // Create directories if they don't exist
      await this.ensureDirectoriesExist();
      // Load existing leads
      await this.loadLeads();
    } catch (error) {
      console.error('Error initializing lead management service:', error);
    }
  }

  private async ensureDirectoriesExist(): Promise<void> {
    const exists = await RNFS.exists(this.leadsDirectory);
    if (!exists) {
      await RNFS.mkdir(this.leadsDirectory);
    }

    const docsExists = await RNFS.exists(this.documentsDirectory);
    if (!docsExists) {
      await RNFS.mkdir(this.documentsDirectory);
    }
  }

  private async loadLeads(): Promise<void> {
    try {
      const files = await RNFS.readDir(this.leadsDirectory);
      const leadFiles = files.filter(file => file.name.endsWith('.json'));
      
      for (const file of leadFiles) {
        try {
          const content = await RNFS.readFile(file.path, 'utf8');
          const lead: Lead = JSON.parse(content);
          // Convert date strings back to Date objects
          lead.createdAt = new Date(lead.createdAt);
          lead.updatedAt = new Date(lead.updatedAt);
          lead.propertyInfo.lastUpdated = new Date(lead.propertyInfo.lastUpdated);
          lead.projects.forEach(project => {
            project.createdAt = new Date(project.createdAt);
            project.updatedAt = new Date(project.updatedAt);
          });
          lead.documents.forEach(doc => {
            doc.uploadedAt = new Date(doc.uploadedAt);
          });
          if (lead.lastContactDate) {
            lead.lastContactDate = new Date(lead.lastContactDate);
          }
          if (lead.nextFollowUpDate) {
            lead.nextFollowUpDate = new Date(lead.nextFollowUpDate);
          }
          
          this.leads.set(lead.id, lead);
        } catch (error) {
          console.error(`Error loading lead file ${file.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Error loading leads:', error);
    }
  }

  async createLead(contactInfo: ContactInfo, leadSource: LeadSource, projects: ProjectInfo[]): Promise<Lead> {
    try {
      const leadId = this.generateLeadId();
      
      // Research property information
      const fullAddress = `${contactInfo.address}, ${contactInfo.city}, ${contactInfo.state} ${contactInfo.zipCode}`;
      const propertyInfo = await PropertyResearchService.researchProperty(fullAddress);
      
      const lead: Lead = {
        id: leadId,
        contactInfo,
        propertyInfo,
        projects,
        leadSource,
        documents: [],
        notes: '',
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save lead
      await this.saveLead(lead);
      this.leads.set(leadId, lead);
      
      return lead;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  async updateLead(leadId: string, updates: Partial<Lead>): Promise<Lead> {
    const lead = this.leads.get(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    const updatedLead: Lead = {
      ...lead,
      ...updates,
      updatedAt: new Date(),
    };

    await this.saveLead(updatedLead);
    this.leads.set(leadId, updatedLead);
    
    return updatedLead;
  }

  async addProject(leadId: string, project: ProjectInfo): Promise<Lead> {
    const lead = this.leads.get(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    const updatedLead: Lead = {
      ...lead,
      projects: [...lead.projects, project],
      updatedAt: new Date(),
    };

    await this.saveLead(updatedLead);
    this.leads.set(leadId, updatedLead);
    
    return updatedLead;
  }

  async updateProject(leadId: string, projectId: string, updates: Partial<ProjectInfo>): Promise<Lead> {
    const lead = this.leads.get(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    const updatedProjects = lead.projects.map(project => 
      project.id === projectId 
        ? { ...project, ...updates, updatedAt: new Date() }
        : project
    );

    const updatedLead: Lead = {
      ...lead,
      projects: updatedProjects,
      updatedAt: new Date(),
    };

    await this.saveLead(updatedLead);
    this.leads.set(leadId, updatedLead);
    
    return updatedLead;
  }

  async addDocument(leadId: string, document: DocumentInfo): Promise<Lead> {
    const lead = this.leads.get(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    const updatedLead: Lead = {
      ...lead,
      documents: [...lead.documents, document],
      updatedAt: new Date(),
    };

    await this.saveLead(updatedLead);
    this.leads.set(leadId, updatedLead);
    
    return updatedLead;
  }

  async deleteDocument(leadId: string, documentId: string): Promise<Lead> {
    const lead = this.leads.get(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    const document = lead.documents.find(doc => doc.id === documentId);
    if (document) {
      // Delete the actual file
      try {
        await RNFS.unlink(document.filePath);
      } catch (error) {
        console.error('Error deleting document file:', error);
      }
    }

    const updatedLead: Lead = {
      ...lead,
      documents: lead.documents.filter(doc => doc.id !== documentId),
      updatedAt: new Date(),
    };

    await this.saveLead(updatedLead);
    this.leads.set(leadId, updatedLead);
    
    return updatedLead;
  }

  async getAllLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values()).sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  async getLead(leadId: string): Promise<Lead | null> {
    return this.leads.get(leadId) || null;
  }

  async searchLeads(query: string): Promise<Lead[]> {
    const allLeads = await this.getAllLeads();
    const lowercaseQuery = query.toLowerCase();
    
    return allLeads.filter(lead => 
      lead.contactInfo.firstName.toLowerCase().includes(lowercaseQuery) ||
      lead.contactInfo.lastName.toLowerCase().includes(lowercaseQuery) ||
      lead.contactInfo.address.toLowerCase().includes(lowercaseQuery) ||
      lead.contactInfo.city.toLowerCase().includes(lowercaseQuery) ||
      lead.projects.some(project => 
        project.name.toLowerCase().includes(lowercaseQuery) ||
        project.type.toLowerCase().includes(lowercaseQuery)
      )
    );
  }

  async deleteLead(leadId: string): Promise<void> {
    const lead = this.leads.get(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    // Delete all documents
    for (const document of lead.documents) {
      try {
        await RNFS.unlink(document.filePath);
      } catch (error) {
        console.error('Error deleting document file:', error);
      }
    }

    // Delete lead file
    const leadFilePath = `${this.leadsDirectory}/${leadId}.json`;
    try {
      await RNFS.unlink(leadFilePath);
    } catch (error) {
      console.error('Error deleting lead file:', error);
    }

    // Remove from memory
    this.leads.delete(leadId);
  }

  private async saveLead(lead: Lead): Promise<void> {
    const leadFilePath = `${this.leadsDirectory}/${lead.id}.json`;
    await RNFS.writeFile(leadFilePath, JSON.stringify(lead, null, 2), 'utf8');
  }

  private generateLeadId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `lead_${timestamp}_${random}`;
  }

  // Utility methods for document management
  async copyFileToLeadDocuments(sourcePath: string, leadId: string, fileName: string): Promise<string> {
    const leadDocDir = `${this.documentsDirectory}/${leadId}`;
    const exists = await RNFS.exists(leadDocDir);
    if (!exists) {
      await RNFS.mkdir(leadDocDir);
    }

    const destinationPath = `${leadDocDir}/${fileName}`;
    await RNFS.copyFile(sourcePath, destinationPath);
    
    return destinationPath;
  }

  async getLeadDocuments(leadId: string): Promise<DocumentInfo[]> {
    const lead = this.leads.get(leadId);
    return lead ? lead.documents : [];
  }

  // Method to get leads by status
  async getLeadsByStatus(status: Lead['status']): Promise<Lead[]> {
    const allLeads = await this.getAllLeads();
    return allLeads.filter(lead => lead.status === status);
  }

  // Method to get leads needing follow-up
  async getLeadsNeedingFollowUp(): Promise<Lead[]> {
    const allLeads = await this.getAllLeads();
    const now = new Date();
    
    return allLeads.filter(lead => 
      lead.nextFollowUpDate && lead.nextFollowUpDate <= now
    );
  }
}

export default new LeadManagementService();
