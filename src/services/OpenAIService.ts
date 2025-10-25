// @ts-ignore - React Native module without types
import OpenAI from 'openai';
// @ts-ignore - React Native module without types
import RNFS from 'react-native-fs';
// @ts-ignore - React Native module without types
import AsyncStorage from '@react-native-async-storage/async-storage';

// Console declaration for React Native
declare const console: {
  log: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
};

export interface AIAnalysis {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
  speakerInsights: {
    [speaker: string]: {
      role: string;
      mainTopics: string[];
      sentiment: string;
    };
  };
}

export interface EnhancedTranscript {
  id: string;
  timestamp: number;
  speaker: string;
  text: string;
  confidence: number;
  aiEnhanced: boolean;
  speakerRole?: string;
}

class OpenAIService {
  private openai: OpenAI | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.initializeOpenAI();
  }

  private async initializeOpenAI() {
    try {
      // First try to get user's custom API key
      this.apiKey = await AsyncStorage.getItem('openai_api_key');
      
      // If no custom key, use the pre-configured MVP key
      if (!this.apiKey) {
        this.apiKey = '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';
        await AsyncStorage.setItem('openai_api_key', this.apiKey);
      }
      
      if (this.apiKey) {
        this.openai = new OpenAI({
          apiKey: this.apiKey,
        });
      }
    } catch (error) {
      console.error('Error initializing OpenAI:', error);
    }
  }

  async setApiKey(apiKey: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem('openai_api_key', apiKey);
      this.apiKey = apiKey;
      this.openai = new OpenAI({
        apiKey: this.apiKey,
      });
      return true;
    } catch (error) {
      console.error('Error setting API key:', error);
      return false;
    }
  }

  async hasApiKey(): Promise<boolean> {
    if (!this.apiKey) {
      this.apiKey = await AsyncStorage.getItem('openai_api_key');
    }
    return !!this.apiKey;
  }

  async transcribeAudio(audioFilePath: string): Promise<{
    text: string;
    segments: Array<{
      id: number;
      start: number;
      end: number;
      text: string;
    }>;
  }> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Please set your API key.');
    }

    try {
      // Read the audio file as base64
      const audioData = await RNFS.readFile(audioFilePath, 'base64');
      
      // For React Native, we need to create a proper file object
      // Create a temporary file path for the API call
      const tempFilePath = `${RNFS.CachesDirectoryPath}/temp_whisper_${Date.now()}.m4a`;
      await RNFS.writeFile(tempFilePath, audioData, 'base64');

      // Create a file object that works with OpenAI API
      const audioFile = {
        uri: `file://${tempFilePath}`,
        type: 'audio/m4a',
        name: 'audio.m4a',
      } as any;

      // Transcribe using OpenAI Whisper
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
      });

      // Clean up temporary file
      try {
        await RNFS.unlink(tempFilePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError);
      }

      return {
        text: transcription.text,
        segments: (transcription as any).segments || [],
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  async enhanceTranscript(transcript: string): Promise<{
    enhancedText: string;
    speakerIdentification: Array<{
      segment: string;
      speaker: string;
      confidence: number;
    }>;
  }> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Please set your API key.');
    }

    try {
      const prompt = `
        Analyze this conversation transcript and enhance it with the following:
        1. Improve grammar and punctuation
        2. Identify different speakers and label them appropriately
        3. Add timestamps for better organization
        4. Maintain the original meaning and context

        Transcript:
        ${transcript}

        Please return a JSON response with:
        - enhancedText: The improved transcript
        - speakerIdentification: Array of segments with speaker labels and confidence scores
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing and enhancing conversation transcripts. Focus on speaker identification and text improvement.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      });

      const content = response.choices[0].message.content || '{}';
      try {
        const result = JSON.parse(content);
        return result;
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        // Return a fallback structure
        return {
          enhancedText: content,
          speakerIdentification: [],
        };
      }
    } catch (error) {
      console.error('Error enhancing transcript:', error);
      throw error;
    }
  }

  async analyzeConversation(transcript: string): Promise<AIAnalysis> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Please set your API key.');
    }

    try {
      const prompt = `
        Analyze this conversation transcript and provide comprehensive insights:

        ${transcript}

        Please provide a JSON response with:
        - summary: A concise summary of the conversation
        - keyPoints: Array of main discussion points
        - actionItems: Array of any action items or follow-ups mentioned
        - sentiment: Overall sentiment (positive, neutral, negative)
        - topics: Array of main topics discussed
        - speakerInsights: Object with insights for each speaker including their role, main topics, and sentiment
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert conversation analyst specializing in residential remodeling and construction consultations. Provide detailed, actionable insights for contractors and tradespeople.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      });

      const content = response.choices[0].message.content || '{}';
      try {
        const analysis = JSON.parse(content);
        return analysis;
      } catch (parseError) {
        console.error('Error parsing analysis JSON:', parseError);
        // Return a fallback analysis structure
        return {
          summary: content.substring(0, 200) + '...',
          keyPoints: ['Analysis parsing failed - see raw content'],
          actionItems: [],
          sentiment: 'neutral' as const,
          topics: ['General Discussion'],
          speakerInsights: {},
        };
      }
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      throw error;
    }
  }

  async generateSummary(transcript: string): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Please set your API key.');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating concise, professional summaries of conversations. Focus on key points and outcomes.',
          },
          {
            role: 'user',
            content: `Please create a professional summary of this conversation:\n\n${transcript}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      return response.choices[0].message.content || 'Unable to generate summary.';
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  }

  async extractActionItems(transcript: string): Promise<string[]> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Please set your API key.');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at identifying action items and follow-up tasks from conversations. Extract specific, actionable items.',
          },
          {
            role: 'user',
            content: `Extract all action items and follow-up tasks from this conversation:\n\n${transcript}`,
          },
        ],
        temperature: 0.3,
      });

      const content = response.choices[0].message.content || '';
      // Parse the response to extract action items
      const actionItems = content
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
        .filter((item: string) => item.length > 0);

      return actionItems;
    } catch (error) {
      console.error('Error extracting action items:', error);
      throw error;
    }
  }

  async identifySpeakers(transcript: string): Promise<{
    [speaker: string]: {
      role: string;
      characteristics: string[];
      confidence: number;
    };
  }> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Please set your API key.');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at identifying speakers in conversations. Analyze speech patterns, topics, and context to determine speaker roles and characteristics.',
          },
          {
            role: 'user',
            content: `Identify the speakers in this conversation and their roles:\n\n${transcript}`,
          },
        ],
        temperature: 0.3,
      });

      const content = response.choices[0].message.content || '';
      // Parse the response to extract speaker information
      // This is a simplified parser - you might want to make it more robust
      const speakerInfo: { [key: string]: any } = {};
      
      // Basic parsing logic - you can enhance this based on your needs
      const lines = content.split('\n');
      let currentSpeaker = '';
      
      for (const line of lines) {
        if (line.includes('Speaker') || line.includes('speaker')) {
          const match = line.match(/(\w+):\s*(.+)/);
          if (match) {
            currentSpeaker = match[1];
            speakerInfo[currentSpeaker] = {
              role: match[2],
              characteristics: [],
              confidence: 0.8,
            };
          }
        }
      }

      return speakerInfo;
    } catch (error) {
      console.error('Error identifying speakers:', error);
      throw error;
    }
  }

  async isApiKeyValid(): Promise<boolean> {
    if (!this.openai) {
      return false;
    }

    try {
      // Test the API key with a simple request
      await this.openai.models.list();
      return true;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  async generateScopeOfWork(transcript: string): Promise<{
    homeownerScope: {
      projectTitle: string;
      projectOverview: string;
      scopeItems: Array<{
        category: string;
        description: string;
        details: string[];
      }>;
      estimatedTimeline: string;
      nextSteps: string[];
    };
    contractorScope: {
      projectTitle: string;
      projectOverview: string;
      constructionPhases: Array<{
        phaseName: string;
        phaseDescription: string;
        lineItems: Array<{
          item: string;
          description: string;
          unit: string;
          estimatedQuantity?: string;
          notes?: string;
        }>;
        estimatedDuration: string;
        dependencies?: string[];
      }>;
      totalEstimatedTimeline: string;
      nextSteps: string[];
    };
  }> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Please set your API key.');
    }

    try {
      const prompt = `
        Based on this contractor consultation transcript, generate TWO scope of work documents:
        1. A homeowner-friendly version (simple, plain English)
        2. A contractor-detailed version (technical, with construction phases and line items)

        TRANSCRIPT:
        ${transcript}

        HOMEOWNER SCOPE REQUIREMENTS:
        - Use plain English at an 8th grade reading level
        - Avoid technical construction jargon
        - Explain what will be done in simple terms
        - Organize in clear categories
        - Help homeowner understand the full project

        CONTRACTOR SCOPE REQUIREMENTS:
        - Use proper construction terminology
        - Break down by construction phases (Demo, Rough-in, Finish, etc.)
        - Include detailed line items for estimation
        - Specify units of measurement (sq ft, linear ft, each, etc.)
        - Include estimated quantities where possible
        - Note dependencies between phases
        - Include professional notes and considerations

        Return a JSON response with this structure:
        {
          "homeownerScope": {
            "projectTitle": "Clear, simple project name",
            "projectOverview": "2-3 sentence summary of what will be done",
            "scopeItems": [
              {
                "category": "Category name (like 'Kitchen Updates' or 'Bathroom Work')",
                "description": "Simple explanation of what this category includes",
                "details": [
                  "Specific item 1 in plain English",
                  "Specific item 2 in plain English"
                ]
              }
            ],
            "estimatedTimeline": "Simple timeline estimate (like '2-3 weeks' or '1 month')",
            "nextSteps": [
              "What happens next step 1",
              "What happens next step 2"
            ]
          },
          "contractorScope": {
            "projectTitle": "Technical project name",
            "projectOverview": "Detailed project summary with technical considerations",
            "constructionPhases": [
              {
                "phaseName": "Phase name (e.g., 'Demolition', 'Rough-in', 'Finish Work')",
                "phaseDescription": "Detailed description of this phase",
                "lineItems": [
                  {
                    "item": "Specific work item",
                    "description": "Detailed description of the work",
                    "unit": "Unit of measurement (sq ft, linear ft, each, etc.)",
                    "estimatedQuantity": "Estimated quantity if determinable",
                    "notes": "Additional notes or considerations"
                  }
                ],
                "estimatedDuration": "Duration for this phase (e.g., '2-3 days', '1 week')",
                "dependencies": ["Previous phases that must be completed first"]
              }
            ],
            "totalEstimatedTimeline": "Total project timeline",
            "nextSteps": [
              "Professional next steps",
              "Permits needed",
              "Material ordering",
              "Scheduling considerations"
            ]
          }
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert construction project manager who creates both homeowner-friendly and contractor-detailed scope of work documents. For homeowners, use plain English and avoid technical jargon. For contractors, use proper construction terminology with detailed phases and line items for estimation.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      });

      const content = response.choices[0].message.content || '{}';
      try {
        const scopeOfWork = JSON.parse(content);
        return scopeOfWork;
      } catch (parseError) {
        console.error('Error parsing scope of work JSON:', parseError);
        // Return a fallback structure
        return {
          homeownerScope: {
            projectTitle: 'Home Improvement Project',
            projectOverview: 'Based on our consultation, we will be making improvements to your home.',
            scopeItems: [
              {
                category: 'Project Work',
                description: 'Various improvements as discussed',
                details: ['Work will be performed as discussed in our meeting'],
              },
            ],
            estimatedTimeline: 'To be determined',
            nextSteps: ['Review this scope of work', 'Schedule next steps'],
          },
          contractorScope: {
            projectTitle: 'Residential Construction Project',
            projectOverview: 'Detailed construction project based on consultation requirements.',
            constructionPhases: [
              {
                phaseName: 'Project Setup',
                phaseDescription: 'Initial project preparation and setup',
                lineItems: [
                  {
                    item: 'Project setup and preparation',
                    description: 'Site preparation and material staging',
                    unit: 'each',
                    estimatedQuantity: '1',
                    notes: 'Includes permits and initial setup'
                  }
                ],
                estimatedDuration: '1-2 days',
                dependencies: []
              }
            ],
            totalEstimatedTimeline: 'Timeline to be determined',
            nextSteps: [
              'Obtain necessary permits',
              'Order materials',
              'Schedule subcontractors',
              'Begin construction phases'
            ]
          }
        };
      }
    } catch (error) {
      console.error('Error generating scope of work:', error);
      throw error;
    }
  }

  async generateSpeech(text: string): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Please set your API key.');
    }

    try {
      const response = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy', // Professional, clear voice
        input: text,
        response_format: 'mp3',
      });

      // Save the audio file
      const timestamp = Date.now();
      const audioPath = `${RNFS.CachesDirectoryPath}/scope_audio_${timestamp}.mp3`;
      const arrayBuffer = await response.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      await RNFS.writeFile(audioPath, base64Audio, 'base64');
      
      return audioPath;
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  }

  async processScopeChanges(originalScope: any, conversationTranscript: string): Promise<{
    updatedScope: any;
    changes: Array<{
      type: 'added' | 'modified' | 'removed';
      section: string;
      description: string;
    }>;
  }> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Please set your API key.');
    }

    try {
      const prompt = `
        Based on the original scope of work and the conversation transcript, identify any changes requested by the homeowner or contractor.

        ORIGINAL SCOPE OF WORK:
        ${JSON.stringify(originalScope, null, 2)}

        CONVERSATION TRANSCRIPT:
        ${conversationTranscript}

        Please analyze the conversation and identify:
        1. Any additions to the scope
        2. Any modifications to existing items
        3. Any removals from the scope
        4. Any clarifications or specifications

        Return a JSON response with:
        {
          "updatedScope": {
            // Updated scope of work with all changes applied
          },
          "changes": [
            {
              "type": "added|modified|removed",
              "section": "Which part of the scope was changed",
              "description": "What the change was"
            }
          ]
        }

        Make sure the updated scope maintains the same homeowner-friendly language and structure.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing construction conversations and updating project scopes. Maintain homeowner-friendly language while incorporating all requested changes.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      });

      const content = response.choices[0].message.content || '{}';
      try {
        const result = JSON.parse(content);
        return result;
      } catch (parseError) {
        console.error('Error parsing scope changes JSON:', parseError);
        return {
          updatedScope: originalScope,
          changes: [],
        };
      }
    } catch (error) {
      console.error('Error processing scope changes:', error);
      throw error;
    }
  }

  // Fallback method for when OpenAI is not available
  async transcribeAudioFallback(audioFilePath: string): Promise<{
    text: string;
    segments: Array<{
      id: number;
      start: number;
      end: number;
      text: string;
    }>;
  }> {
    // This would be a fallback to local speech recognition
    // For now, return a placeholder
    return {
      text: 'Transcription not available - OpenAI service unavailable',
      segments: [],
    };
  }
}

export default new OpenAIService();
