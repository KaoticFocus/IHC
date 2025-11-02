import StorageService from './StorageService';
import OpenAIService from './OpenAIService';

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}

class CommandProcessor {
  private navigationCallback?: (screen: string) => void;
  private recordingCallback?: (action: 'start' | 'stop') => void;
  private leadCallback?: (action: string, data: any) => void;

  setNavigationCallback(callback: (screen: string) => void) {
    this.navigationCallback = callback;
  }

  setRecordingCallback(callback: (action: 'start' | 'stop') => void) {
    this.recordingCallback = callback;
  }

  setLeadCallback(callback: (action: string, data: any) => void) {
    this.leadCallback = callback;
  }

  async executeCommand(action: string, parameters: any): Promise<CommandResult> {
    try {
      switch (action) {
        case 'navigate':
          return await this.handleNavigation(parameters);
        
        case 'create_lead':
          return await this.handleCreateLead(parameters);
        
        case 'search_leads':
          return await this.handleSearchLeads(parameters);
        
        case 'start_recording':
          return await this.handleStartRecording(parameters);
        
        case 'stop_recording':
          return await this.handleStopRecording(parameters);
        
        case 'generate_scope':
          return await this.handleGenerateScope(parameters);
        
        case 'search_online':
          return await this.handleOnlineSearch(parameters);
        
        case 'get_weather':
          return await this.handleGetWeather(parameters);
        
        case 'calculate':
          return await this.handleCalculate(parameters);
        
        case 'schedule':
          return await this.handleSchedule(parameters);
        
        case 'help':
          return await this.handleHelp(parameters);
        
        case 'clear':
          return await this.handleClear(parameters);
        
        default:
          return {
            success: false,
            message: `I don't know how to handle the action "${action}". Please try a different command.`,
          };
      }
    } catch (error) {
      console.error('Error executing command:', error);
      return {
        success: false,
        message: 'Sorry, I encountered an error while processing your request. Please try again.',
      };
    }
  }

  private async handleNavigation(parameters: any): Promise<CommandResult> {
    const screen = parameters.screen;
    
    if (!screen) {
      return {
        success: false,
        message: 'Which screen would you like to navigate to? You can say "go to leads", "go to settings", or "go back".',
      };
    }

    if (this.navigationCallback) {
      this.navigationCallback(screen);
    }

    return {
      success: true,
      message: `Navigating to ${screen}...`,
      data: { screen },
    };
  }

  private async handleCreateLead(parameters: any): Promise<CommandResult> {
    if (this.leadCallback) {
      this.leadCallback('create', parameters);
    }

    return {
      success: true,
      message: 'Opening the lead creation form. Please fill in the contact information.',
      data: { action: 'create_lead' },
    };
  }

  private async handleSearchLeads(parameters: any): Promise<CommandResult> {
    const query = parameters.query;
    
    if (!query) {
      return {
        success: false,
        message: 'What would you like to search for? You can search by name, address, or project type.',
      };
    }

    try {
      const leads = await StorageService.getLeads();
      const lowercaseQuery = query.toLowerCase();
      const filteredLeads = leads.filter((lead: any) => 
        lead.name?.toLowerCase().includes(lowercaseQuery) ||
        lead.address?.toLowerCase().includes(lowercaseQuery) ||
        lead.email?.toLowerCase().includes(lowercaseQuery)
      );
      
      if (this.leadCallback) {
        this.leadCallback('search', { query, results: filteredLeads });
      }

      return {
        success: true,
        message: `Found ${filteredLeads.length} leads matching "${query}".`,
        data: { query, results: filteredLeads },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Sorry, I had trouble searching your leads. Please try again.',
      };
    }
  }

  private async handleStartRecording(_parameters: any): Promise<CommandResult> {
    if (this.recordingCallback) {
      this.recordingCallback('start');
    }

    return {
      success: true,
      message: 'Starting recording. Speak clearly and I\'ll transcribe everything in real-time.',
      data: { action: 'start_recording' },
    };
  }

  private async handleStopRecording(_parameters: any): Promise<CommandResult> {
    if (this.recordingCallback) {
      this.recordingCallback('stop');
    }

    return {
      success: true,
      message: 'Stopping recording. I\'ll process the transcript and generate analysis.',
      data: { action: 'stop_recording' },
    };
  }

  private async handleGenerateScope(parameters: any): Promise<CommandResult> {
    if (this.leadCallback) {
      this.leadCallback('generate_scope', parameters);
    }

    return {
      success: true,
      message: 'Generating scope of work from your latest recording. This will create a homeowner-friendly project description.',
      data: { action: 'generate_scope' },
    };
  }

  private async handleOnlineSearch(parameters: any): Promise<CommandResult> {
    const query = parameters.query;
    
    if (!query) {
      return {
        success: false,
        message: 'What would you like me to search for online?',
      };
    }

    try {
      const response = await OpenAIService.analyzeConversation(`Search for: ${query}`);
      
      return {
        success: true,
        message: response.summary,
        data: { query, response },
      };
    } catch (error) {
      return {
        success: false,
        message: `Sorry, I had trouble searching for "${query}". Please try again.`,
      };
    }
  }

  private async handleGetWeather(parameters: any): Promise<CommandResult> {
    const location = parameters.location;
    
    try {
      const response = await OpenAIService.analyzeConversation(`Get weather for ${location || 'current location'}`);
      
      return {
        success: true,
        message: response.summary,
        data: { location, response },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Sorry, I had trouble getting weather information. Please try again.',
      };
    }
  }

  private async handleCalculate(parameters: any): Promise<CommandResult> {
    const expression = parameters.expression;
    
    if (!expression) {
      return {
        success: false,
        message: 'What would you like me to calculate? For example, "calculate 15 percent of 5000".',
      };
    }

    try {
      // Simple calculation parsing
      const cleanExpression = expression
        .replace(/percent/g, '/100')
        .replace(/plus/g, '+')
        .replace(/minus/g, '-')
        .replace(/times/g, '*')
        .replace(/divided by/g, '/');
      
      let result: number;
      try {
        // Use Function constructor for safer evaluation
        result = new Function('return ' + cleanExpression)();
      } catch {
        throw new Error('Invalid expression');
      }
      
      return {
        success: true,
        message: `The result is ${result}`,
        data: { expression, result },
      };
    } catch (error) {
      return {
        success: false,
        message: `Sorry, I couldn't calculate "${expression}". Please try a simpler calculation.`,
      };
    }
  }

  private async handleSchedule(_parameters: any): Promise<CommandResult> {
    return {
      success: true,
      message: 'I can help you schedule appointments. What would you like to schedule?',
      data: { action: 'schedule' },
    };
  }

  private async handleHelp(_parameters: any): Promise<CommandResult> {
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
      success: true,
      message: helpText,
      data: { action: 'help' },
    };
  }

  private async handleClear(parameters: any): Promise<CommandResult> {
    const target = parameters.target || 'history';
    
    if (target === 'history') {
      return {
        success: true,
        message: 'Command history cleared.',
        data: { action: 'clear_history' },
      };
    }
    
    return {
      success: true,
      message: `Cleared ${target}.`,
      data: { action: 'clear', target },
    };
  }

  getAvailableCommands(context: string): string[] {
    const baseCommands = [
      'help',
      'clear',
      'search online',
      'get weather',
      'calculate',
    ];

    switch (context) {
      case 'main':
        return [
          ...baseCommands,
          'create a lead',
          'show my leads',
          'start recording',
          'go to leads',
          'go to settings',
        ];
      
      case 'leads':
        return [
          ...baseCommands,
          'create a new lead',
          'search for [name]',
          'go back',
          'go to main',
        ];
      
      case 'recording':
        return [
          ...baseCommands,
          'stop recording',
          'generate scope of work',
          'go back',
        ];
      
      default:
        return baseCommands;
    }
  }
}

export default new CommandProcessor();

