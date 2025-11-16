import StorageService from './StorageService';
import OpenAI from 'openai';

class OpenAIService {
  private openai: OpenAI | null = null;

  async hasApiKey(): Promise<boolean> {
    // Check environment variable first, then localStorage
    const envApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const storedApiKey = await StorageService.getSetting('openai_api_key');
    return !!(envApiKey || storedApiKey);
  }

  async setApiKey(key: string): Promise<void> {
    this.openai = new OpenAI({ apiKey: key });
    await StorageService.setSetting('openai_api_key', key);
  }

  async initialize(): Promise<void> {
    // Check environment variable first, then localStorage
    const envApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const storedApiKey = await StorageService.getSetting('openai_api_key');
    const apiKey = envApiKey || storedApiKey;
    
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

    const systemPrompt = `You are a helpful AI assistant for the IHC Conversation Recorder app - a contractor tool for managing projects, consultations, and photos.
The user is currently on the "${context}" screen.

AVAILABLE ACTIONS:

1. NAVIGATION - Navigate to different screens:
{
  "action": "navigate",
  "response": "Opening [screen name].",
  "data": {
    "screen": "main/projects/consultations/documents/transcripts/settings"
  }
}
Examples: "go to projects", "open consultations", "show me documents", "go back"

2. RECORDING - Control recording:
{
  "action": "start_recording" or "stop_recording",
  "response": "Starting/Stopping recording...",
  "data": {}
}
Examples: "start recording", "stop recording", "begin recording"

3. CREATE PROJECT - Create a new project:
{
  "action": "create_project",
  "response": "Creating project [name]...",
  "data": {
    "projectData": {
      "name": "Project Name",
      "description": "Optional description",
      "clientName": "Client Name",
      "clientEmail": "email@example.com",
      "clientPhone": "123-456-7890",
      "address": "Project Address",
      "status": "planning"
    }
  }
}
Examples: 
- "Create a new project called Kitchen Remodel"
- "Create project Bathroom Renovation for client John Smith"
- "New project: Basement Finishing, client is Jane Doe at 123 Main St"

4. DICTATE NOTE - Add notes to projects or consultations:
{
  "action": "dictate_note",
  "response": "Saving note...",
  "data": {
    "note": "The full note text",
    "targetId": "project_id or consultation_id (optional)",
    "targetType": "project or consultation (optional)"
  }
}
Examples:
- "Add note: Customer wants white cabinets"
- "Note: Need to check plumbing before starting"
- "Dictate note: The homeowner mentioned they want quartz countertops"

5. DESCRIBE PHOTO - Add description to a photo:
{
  "action": "describe_photo",
  "response": "Saving photo description...",
  "data": {
    "description": "What the photo shows",
    "photoIds": ["photo_id"] or ["photo_id1", "photo_id2"]
  }
}
Examples:
- "This photo shows the existing kitchen cabinets"
- "Describe this photo: Damaged drywall in the corner"
- "Photo description: Before shot of the bathroom"

6. DESCRIBE WORK - Describe work needed for photos (single or multiple):
{
  "action": "describe_work",
  "response": "Saving work description...",
  "data": {
    "description": "What work needs to be done",
    "photoIds": ["photo_id"] or ["photo_id1", "photo_id2", "photo_id3"]
  }
}
Examples:
- "Work needed: Replace all cabinets and install new countertops"
- "For these photos: Remove old tile, install new flooring, paint walls"
- "Describe work: Need to fix the plumbing leak and replace damaged drywall"

7. SEARCH ONLINE:
{
  "action": "search_online",
  "response": "Searching for [query]...",
  "data": {
    "query": "search terms"
  }
}

8. GET WEATHER:
{
  "action": "get_weather",
  "response": "Getting weather...",
  "data": {
    "location": "city name (optional)"
  }
}

9. CALCULATE:
{
  "action": "calculate",
  "response": "Calculating...",
  "data": {
    "expression": "math expression"
  }
}

10. GENERATE SCOPE:
{
  "action": "generate_scope",
  "response": "Generating scope of work...",
  "data": {}
}

11. HELP:
{
  "action": "help",
  "response": "Here are the commands...",
  "data": {}
}

12. GENERAL QUESTIONS (no action needed):
{
  "action": "none",
  "response": "Your helpful answer here."
}

IMPORTANT RULES:
- Always respond with valid JSON only. No extra text.
- Extract all relevant information from the user's command
- For project creation, try to extract name, client info, address if mentioned
- For notes, capture everything the user says after "note", "dictate", "add note", etc.
- For photo descriptions, capture what the photo shows
- For work descriptions, capture what work needs to be done
- Be natural and conversational in responses
- If information is missing, ask for clarification in the response but still set shouldExecute to true if the action is clear`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: command }
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" },
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

    // Handle both old format (data) and new format (direct parameters)
    const parameters = parsedResponse.data || parsedResponse.parameters || parsedResponse;
    
    return {
      response: parsedResponse.response || responseText,
      shouldExecute: parsedResponse.action !== "none" && parsedResponse.action !== undefined,
      action: parsedResponse.action,
      parameters: parameters,
    };
  }

  async generateImage(prompt: string, size: '256x256' | '512x512' | '1024x1024' = '512x512'): Promise<string> {
    await this.initialize();
    
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Please set API key in settings.');
    }

    try {
      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: size === '256x256' ? '1024x1024' : size === '512x512' ? '1024x1024' : '1024x1024', // DALL-E 3 only supports 1024x1024
        quality: 'standard',
        style: 'natural',
      });

      const imageUrl = response.data?.[0]?.url;
      if (!imageUrl) {
        throw new Error('No image URL returned from OpenAI');
      }

      return imageUrl;
    } catch (error: any) {
      console.error('Error generating image:', error);
      if (error.message?.includes('dall-e-3')) {
        // Fallback to DALL-E 2 if DALL-E 3 is not available
        try {
          const response = await this.openai.images.generate({
            model: 'dall-e-2',
            prompt: prompt,
            n: 1,
            size: size,
          });
          const imageUrl = response.data?.[0]?.url;
          if (!imageUrl) {
            throw new Error('No image URL returned from OpenAI');
          }
          return imageUrl;
        } catch (fallbackError: any) {
          throw new Error(`Failed to generate image: ${fallbackError.message || 'Unknown error'}`);
        }
      }
      throw new Error(`Failed to generate image: ${error.message || 'Unknown error'}`);
    }
  }

  async chatCompletion(
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    context: string = 'main'
  ): Promise<string> {
    await this.initialize();
    
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Please set API key in settings.');
    }

    const systemMessage = `You are Flow, a helpful AI assistant for the IHC Conversation Recorder app - a contractor tool for managing projects, consultations, and photos. 
The user is currently on the "${context}" screen.

You can help with:
- Answering questions about the app
- Providing general information and advice
- Having natural conversations
- Explaining features and functionality

Be friendly, conversational, and helpful. Keep responses concise but informative.`;

    try {
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemMessage },
        ...conversationHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      ];

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return response;
    } catch (error: any) {
      console.error('Error in chat completion:', error);
      throw new Error(`Failed to get chat response: ${error.message || 'Unknown error'}`);
    }
  }
}

export default new OpenAIService();


