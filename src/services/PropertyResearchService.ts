// @ts-ignore - React Native module without types
import RNFS from 'react-native-fs';
// @ts-ignore - React Native module without types
import AsyncStorage from '@react-native-async-storage/async-storage';
import OpenAIService from './OpenAIService';
import { PropertyInfo } from '../types/Lead';

class PropertyResearchService {
  private cache: Map<string, PropertyInfo> = new Map();

  async researchProperty(address: string): Promise<PropertyInfo> {
    try {
      // Check cache first
      const cacheKey = this.normalizeAddress(address);
      const cached = this.cache.get(cacheKey);
      if (cached && this.isCacheValid(cached)) {
        return cached;
      }

      // Try to get from local storage
      const stored = await this.getStoredPropertyInfo(cacheKey);
      if (stored && this.isCacheValid(stored)) {
        this.cache.set(cacheKey, stored);
        return stored;
      }

      // Use AI to research property information
      const propertyInfo = await this.researchWithAI(address);
      
      // Cache the result
      this.cache.set(cacheKey, propertyInfo);
      await this.storePropertyInfo(cacheKey, propertyInfo);
      
      return propertyInfo;
    } catch (error) {
      console.error('Error researching property:', error);
      // Return basic info if research fails
      return {
        lastUpdated: new Date(),
      };
    }
  }

  private async researchWithAI(address: string): Promise<PropertyInfo> {
    try {
      const prompt = `
        Research property information for this address: ${address}
        
        Please provide information about this property that would be useful for a residential remodeling contractor. 
        Focus on information that would help understand the scope of potential work.
        
        Return a JSON response with this structure:
        {
          "yearConstructed": number or null,
          "estimatedValue": number or null,
          "squareFootage": number or null,
          "bedrooms": number or null,
          "bathrooms": number or null,
          "lotSize": "string description" or null,
          "propertyType": "string" or null,
          "zillowUrl": "string" or null,
          "researchNotes": "string with any additional relevant information"
        }
        
        If you cannot find specific information, use null for those fields.
        Be helpful but don't make up information.
      `;

      const response = await OpenAIService.analyzeConversation(prompt);
      
      // Parse the response (this is a simplified approach)
      // In a real implementation, you'd want more robust JSON parsing
      const propertyInfo: PropertyInfo = {
        yearConstructed: this.extractNumber(response.summary, 'yearConstructed'),
        estimatedValue: this.extractNumber(response.summary, 'estimatedValue'),
        squareFootage: this.extractNumber(response.summary, 'squareFootage'),
        bedrooms: this.extractNumber(response.summary, 'bedrooms'),
        bathrooms: this.extractNumber(response.summary, 'bathrooms'),
        lotSize: this.extractString(response.summary, 'lotSize'),
        propertyType: this.extractString(response.summary, 'propertyType'),
        zillowUrl: this.extractString(response.summary, 'zillowUrl'),
        lastUpdated: new Date(),
      };

      return propertyInfo;
    } catch (error) {
      console.error('Error in AI property research:', error);
      return {
        lastUpdated: new Date(),
      };
    }
  }

  private extractNumber(text: string, field: string): number | undefined {
    // Simple extraction - in production you'd want more robust parsing
    const regex = new RegExp(`"${field}":\\s*(\\d+)`, 'i');
    const match = text.match(regex);
    return match ? parseInt(match[1]) : undefined;
  }

  private extractString(text: string, field: string): string | undefined {
    // Simple extraction - in production you'd want more robust parsing
    const regex = new RegExp(`"${field}":\\s*"([^"]*)"`, 'i');
    const match = text.match(regex);
    return match ? match[1] : undefined;
  }

  private normalizeAddress(address: string): string {
    return address.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private isCacheValid(propertyInfo: PropertyInfo): boolean {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return propertyInfo.lastUpdated > oneWeekAgo;
  }

  private async getStoredPropertyInfo(address: string): Promise<PropertyInfo | null> {
    try {
      const stored = await AsyncStorage.getItem(`property_${address}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting stored property info:', error);
      return null;
    }
  }

  private async storePropertyInfo(address: string, propertyInfo: PropertyInfo): Promise<void> {
    try {
      await AsyncStorage.setItem(`property_${address}`, JSON.stringify(propertyInfo));
    } catch (error) {
      console.error('Error storing property info:', error);
    }
  }

  // Method to manually update property information
  async updatePropertyInfo(address: string, updates: Partial<PropertyInfo>): Promise<PropertyInfo> {
    const existing = await this.researchProperty(address);
    const updated = {
      ...existing,
      ...updates,
      lastUpdated: new Date(),
    };
    
    const cacheKey = this.normalizeAddress(address);
    this.cache.set(cacheKey, updated);
    await this.storePropertyInfo(cacheKey, updated);
    
    return updated;
  }

  // Method to clear cache
  async clearCache(): Promise<void> {
    this.cache.clear();
    try {
      const keys = await AsyncStorage.getAllKeys();
      const propertyKeys = keys.filter(key => key.startsWith('property_'));
      await AsyncStorage.multiRemove(propertyKeys);
    } catch (error) {
      console.error('Error clearing property cache:', error);
    }
  }
}

export default new PropertyResearchService();
