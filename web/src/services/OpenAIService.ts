import StorageService from './StorageService';
import OpenAI from 'openai';

class OpenAIService {
  private openai: OpenAI | null = null;

  async hasApiKey(): Promise<boolean> {
    const apiKey = await StorageService.getSetting('openai_api_key');
    return !!apiKey;
  }

  async setApiKey(key: string): Promise<void> {
    this.openai = new OpenAI({ apiKey: key });
    await StorageService.setSetting('openai_api_key', key);
  }

  async initialize(): Promise<void> {
    const apiKey = await StorageService.getSetting('openai_api_key');
    if (apiKey && !this.openai) {
      this.openai = new OpenAI({ apiKey: apiKey });
    }
  }

  async transcribeAudio(audioBlob: Blob): Promise<{
    text: string;
    segments: Array<{
      id: number;
      start: number;
      end: number;
      text: string;
    }>;
  }> {
    await this.initialize();
    
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Please set API key in settings.');
    }

    // Convert Blob to File-like object for OpenAI
    const file = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

    const transcription = await this.openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
    });

    return {
      text: transcription.text,
      segments: [],
    };
  }

  async generateSpeech(text: string): Promise<Blob> {
    await this.initialize();
    
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Please set API key in settings.');
    }

    const response = await this.openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });

    const arrayBuffer = await response.arrayBuffer();
    return new Blob([arrayBuffer], { type: 'audio/mpeg' });
  }

  async analyzeConversation(transcript: string): Promise<any> {
    await this.initialize();
    
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Please set API key in settings.');
    }

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert conversation analyst specializing in residential remodeling and construction consultations. Provide detailed, actionable insights for contractors and tradespeople."
        },
        {
          role: "user",
          content: `Please analyze this conversation transcript:\n\n${transcript}\n\nProvide a JSON response with: summary (string), keyPoints (array), actionItems (array), sentiment (positive/neutral/negative), topics (array), and speakerInsights (object with speaker names as keys, each containing role, mainTopics, and sentiment).`
        }
      ],
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    
    try {
      const analysis = JSON.parse(content);
      return analysis;
    } catch (parseError) {
      // Fallback structure
      return {
        summary: content.substring(0, 200) + '...',
        keyPoints: ['Analysis parsing failed - see raw content'],
        actionItems: [],
        sentiment: 'neutral' as const,
        topics: ['General Discussion'],
        speakerInsights: {},
      };
    }
  }

  async generateSummary(transcript: string): Promise<string> {
    await this.initialize();
    
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Please set API key in settings.');
    }

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating concise, professional summaries of conversations. Focus on key points and outcomes."
        },
        {
          role: "user",
          content: `Please create a professional summary of this conversation:\n\n${transcript}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || 'Unable to generate summary.';
  }

  async extractActionItems(transcript: string): Promise<string[]> {
    await this.initialize();
    
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Please set API key in settings.');
    }

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert at identifying action items and follow-up tasks from conversations. Extract specific, actionable items."
        },
        {
          role: "user",
          content: `Extract all action items and follow-up tasks from this conversation:\n\n${transcript}`
        }
      ],
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content || '';
    const actionItems = content
      .split('\n')
      .filter((line: string) => line.trim().length > 0)
      .map((line: string) => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
      .filter((item: string) => item.length > 0);

    return actionItems;
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
    await this.initialize();
    
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Please set API key in settings.');
    }

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
              "category": "Category name",
              "description": "Simple explanation",
              "details": ["Specific item 1", "Specific item 2"]
            }
          ],
          "estimatedTimeline": "Simple timeline estimate",
          "nextSteps": ["What happens next step 1", "What happens next step 2"]
        },
        "contractorScope": {
          "projectTitle": "Technical project name",
          "projectOverview": "Detailed project summary",
          "constructionPhases": [
            {
              "phaseName": "Phase name",
              "phaseDescription": "Detailed description",
              "lineItems": [
                {
                  "item": "Specific work item",
                  "description": "Detailed description",
                  "unit": "Unit of measurement",
                  "estimatedQuantity": "Estimated quantity if determinable",
                  "notes": "Additional notes"
                }
              ],
              "estimatedDuration": "Duration for this phase",
              "dependencies": ["Previous phases that must be completed first"]
            }
          ],
          "totalEstimatedTimeline": "Total project timeline",
          "nextSteps": ["Professional next steps"]
        }
      }
    `;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert construction project manager who creates both homeowner-friendly and contractor-detailed scope of work documents."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    
    try {
      const scopeOfWork = JSON.parse(content);
      return scopeOfWork;
    } catch (parseError) {
      // Return fallback structure
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
  }

  async analyzeVoiceCommand(command: string, context: string): Promise<{
    response: string;
    shouldExecute: boolean;
    action?: string;
    parameters?: Record<string, any>;
  }> {
    await this.initialize();
    
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Please set API key in settings.');
    }

    const systemPrompt = `You are a helpful AI assistant for the IHC Conversation Recorder app.
The user is currently on the "${context}" screen.

You can help users with:
1. Creating leads - Extract: name, type (bathroom/kitchen/etc), phone, email, address
2. Navigating the app - Tell them to click on menu items
3. Managing documents - Upload, read, or analyze documents
4. Recording conversations - Start/stop transcripts
5. General questions - Answer helpfully

When the user wants to CREATE A LEAD, respond with JSON in this EXACT format:
{
  "action": "create_lead",
  "response": "I'll create a lead for [name].",
  "data": {
    "name": "Full Name",
    "type": "bathroom/kitchen/etc",
    "phone": "123-456-7890",
    "email": "email@example.com",
    "address": "Full Address"
  }
}

For navigation commands (open documents, view leads, etc), respond with:
{
  "action": "navigate",
  "response": "Opening [screen name].",
  "data": {
    "screen": "documents/leads/transcripts/home"
  }
}

For general questions or help, respond with:
{
  "action": "none",
  "response": "Your helpful answer here."
}

IMPORTANT: Always respond with valid JSON only. No extra text.`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: command }
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const responseText = completion.choices[0]?.message?.content || '{"action":"none","response":"I\'m not sure how to help with that."}';
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      parsedResponse = {
        action: "none",
        response: responseText
      };
    }

    return {
      response: parsedResponse.response || responseText,
      shouldExecute: parsedResponse.action !== "none",
      action: parsedResponse.action,
      parameters: parsedResponse.data,
    };
  }
}

export default new OpenAIService();

