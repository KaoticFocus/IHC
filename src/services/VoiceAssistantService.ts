// @ts-ignore - React Native module without types
import RNFS from 'react-native-fs';
// @ts-ignore - React Native module without types
import AsyncStorage from '@react-native-async-storage/async-storage';
import OpenAIService from './OpenAIService';
import LeadManagementService from './LeadManagementService';
import EnhancedTranscriptionService from './EnhancedTranscriptionService';

export interface VoiceCommand {
  action: string;
  parameters: { [key: string]: any };
  confidence: number;
  originalText: string;
}

export interface AssistantResponse {
  text: string;
  action?: string;
  parameters?: { [key: string]: any };
  shouldExecute: boolean;
  audioPath?: string;
}

class VoiceAssistantService {
  private isListening = false;
  private currentContext = 'main'; // main, lead_management, recording, etc.
  private commandHistory: string[] = [];

  async processVoiceCommand(audioFilePath: string): Promise<AssistantResponse> {
    try {
      // Transcribe the voice command
      const transcription = await EnhancedTranscriptionService.transcribeAudio(audioFilePath);
      const commandText = transcription.text;

      // Add to command history
      this.commandHistory.push(commandText);
      if (this.commandHistory.length > 10) {
        this.commandHistory.shift();
      }

      // Process the command with AI
      const response = await this.analyzeCommand(commandText);
      
      // Generate speech response
      if (response.text) {
        const audioPath = await OpenAIService.generateSpeech(response.text);
        response.audioPath = audioPath;
      }

      return response;
    } catch (error) {
      console.error('Error processing voice command:', error);
      return {
        text: 'Sorry, I had trouble understanding that. Could you please try again?',
        shouldExecute: false,
      };
    }
  }

  private async analyzeCommand(commandText: string): Promise<AssistantResponse> {
    try {
      const prompt = `
        You are a voice assistant for a contractor app called "Contractor Voice Notes". 
        The user can speak commands to navigate the app and perform tasks.

        Current context: ${this.currentContext}
        Recent commands: ${this.commandHistory.slice(-3).join(', ')}

        User command: "${commandText}"

        Analyze this command and determine what the user wants to do. Return a JSON response with:

        {
          "text": "Response to speak back to the user",
          "action": "action_to_perform",
          "parameters": { "key": "value" },
          "shouldExecute": true/false
        }

        Available actions:
        - "navigate": Navigate to different screens (main, leads, settings, etc.)
        - "create_lead": Create a new lead
        - "search_leads": Search for leads
        - "start_recording": Start recording a consultation
        - "stop_recording": Stop current recording
        - "generate_scope": Generate scope of work for a recording
        - "search_online": Perform online search
        - "get_weather": Get weather information
        - "calculate": Perform calculations
        - "schedule": Schedule appointments or reminders
        - "help": Show available commands
        - "clear": Clear or reset something

        Examples:
        - "Create a new lead" → action: "create_lead"
        - "Show me my leads" → action: "navigate", parameters: { "screen": "leads" }
        - "Start recording" → action: "start_recording"
        - "Search for kitchen remodel ideas" → action: "search_online", parameters: { "query": "kitchen remodel ideas" }
        - "What's the weather like?" → action: "get_weather"
        - "Calculate 15 percent of 5000" → action: "calculate", parameters: { "expression": "5000 * 0.15" }

        Be helpful and conversational. If the command is unclear, ask for clarification.
      `;

      const response = await OpenAIService.analyzeConversation(prompt);
      
      try {
        // Try to parse the response as JSON
        const parsed = JSON.parse(response.summary);
        return {
          text: parsed.text || 'I understand. Let me help you with that.',
          action: parsed.action,
          parameters: parsed.parameters || {},
          shouldExecute: parsed.shouldExecute !== false,
        };
      } catch (parseError) {
        // If JSON parsing fails, create a basic response
        return {
          text: response.summary || 'I understand. Let me help you with that.',
          shouldExecute: false,
        };
      }
    } catch (error) {
      console.error('Error analyzing command:', error);
      return {
        text: 'Sorry, I had trouble processing that command. Could you please try again?',
        shouldExecute: false,
      };
    }
  }

  async performOnlineSearch(query: string): Promise<AssistantResponse> {
    try {
      const searchPrompt = `
        Perform an online search for: "${query}"
        
        This is for a contractor who needs information about construction, remodeling, materials, techniques, or related topics.
        
        Provide a helpful summary of the search results in a conversational way that would be useful for a contractor.
      `;

      const response = await OpenAIService.analyzeConversation(searchPrompt);
      
      return {
        text: `Here's what I found about ${query}: ${response.summary}`,
        action: 'search_online',
        parameters: { query },
        shouldExecute: false,
      };
    } catch (error) {
      console.error('Error performing online search:', error);
      return {
        text: `I had trouble searching for "${query}". Please try again or rephrase your question.`,
        shouldExecute: false,
      };
    }
  }

  async getWeatherInfo(location?: string): Promise<AssistantResponse> {
    try {
      const locationText = location || 'current location';
      const weatherPrompt = `
        Get weather information for ${locationText}.
        
        This is for a contractor who needs to know weather conditions for planning outdoor work, scheduling jobs, or advising clients.
        
        Provide current weather conditions and any relevant information for construction work.
      `;

      const response = await OpenAIService.analyzeConversation(weatherPrompt);
      
      return {
        text: `Here's the weather for ${locationText}: ${response.summary}`,
        action: 'get_weather',
        parameters: { location },
        shouldExecute: false,
      };
    } catch (error) {
      console.error('Error getting weather:', error);
      return {
        text: `I had trouble getting weather information for ${location || 'your location'}. Please try again.`,
        shouldExecute: false,
      };
    }
  }

  async performCalculation(expression: string): Promise<AssistantResponse> {
    try {
      // Simple calculation parsing (in production, you'd want more robust parsing)
      const result = this.evaluateExpression(expression);
      
      return {
        text: `The result is ${result}`,
        action: 'calculate',
        parameters: { expression, result },
        shouldExecute: false,
      };
    } catch (error) {
      console.error('Error performing calculation:', error);
      return {
        text: `I had trouble calculating "${expression}". Please try a simpler calculation.`,
        shouldExecute: false,
      };
    }
  }

  private evaluateExpression(expression: string): number {
    try {
      // Basic math evaluation (be careful with eval in production)
      // This is a simplified version - you'd want a proper math parser
      const cleanExpression = expression
        .replace(/percent/g, '/100')
        .replace(/plus/g, '+')
        .replace(/minus/g, '-')
        .replace(/times/g, '*')
        .replace(/divided by/g, '/');
      
      // Simple evaluation for basic math
      if (cleanExpression.includes('*') || cleanExpression.includes('/') || 
          cleanExpression.includes('+') || cleanExpression.includes('-')) {
        // Use a safer evaluation method in production
        return eval(cleanExpression);
      }
      
      return parseFloat(cleanExpression) || 0;
    } catch (error) {
      throw new Error('Invalid expression');
    }
  }

  async getHelpCommands(): Promise<AssistantResponse> {
    const helpText = `
      Here are the commands you can use:
      
      Navigation:
      - "Show leads" or "Go to leads"
      - "Go to settings"
      - "Go back" or "Return to main"
      
      Lead Management:
      - "Create a new lead"
      - "Search for [name or address]"
      - "Show my leads"
      
      Recording:
      - "Start recording"
      - "Stop recording"
      - "Generate scope of work"
      
      Information:
      - "Search for [anything]"
      - "What's the weather?"
      - "Calculate [math expression]"
      - "Help" or "What can you do?"
      
      Just speak naturally and I'll understand what you want to do!
    `;

    return {
      text: helpText,
      action: 'help',
      shouldExecute: false,
    };
  }

  setContext(context: string) {
    this.currentContext = context;
  }

  getContext(): string {
    return this.currentContext;
  }

  getCommandHistory(): string[] {
    return [...this.commandHistory];
  }

  clearHistory() {
    this.commandHistory = [];
  }

  // Method to start continuous listening
  async startContinuousListening(): Promise<void> {
    try {
      this.isListening = true;
      await EnhancedTranscriptionService.startListening();
    } catch (error) {
      console.error('Error starting continuous listening:', error);
      this.isListening = false;
    }
  }

  // Method to stop continuous listening
  async stopContinuousListening(): Promise<void> {
    try {
      this.isListening = false;
      await EnhancedTranscriptionService.stopListening();
    } catch (error) {
      console.error('Error stopping continuous listening:', error);
    }
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }
}

export default new VoiceAssistantService();
