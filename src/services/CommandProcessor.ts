// @ts-ignore - React Native module without types
import AsyncStorage from '@react-native-async-storage/async-storage';
import VoiceAssistantService from './VoiceAssistantService';

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}

class CommandProcessor {
  private navigationCallback?: (screen: string) => void;
  private recordingCallback?: (action: 'start' | 'stop') => void;

  setNavigationCallback(callback: (screen: string) => void) {
    this.navigationCallback = callback;
  }

  setRecordingCallback(callback: (action: 'start' | 'stop') => void) {
    this.recordingCallback = callback;
  }

  async executeCommand(action: string, parameters: any): Promise<CommandResult> {
    try {
      switch (action) {
        case 'navigate':
          return await this.handleNavigation(parameters);
        
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
        message: 'Which screen would you like to navigate to? You can say "go to settings" or "go back".',
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

  private async handleStartRecording(parameters: any): Promise<CommandResult> {
    if (this.recordingCallback) {
      this.recordingCallback('start');
    }

    return {
      success: true,
      message: 'Starting recording. Speak clearly and I\'ll transcribe everything in real-time.',
      data: { action: 'start_recording' },
    };
  }

  private async handleStopRecording(parameters: any): Promise<CommandResult> {
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
      const response = await VoiceAssistantService.performOnlineSearch(query);
      
      return {
        success: true,
        message: response.text,
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
      const response = await VoiceAssistantService.getWeatherInfo(location);
      
      return {
        success: true,
        message: response.text,
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
      const response = await VoiceAssistantService.performCalculation(expression);
      
      return {
        success: true,
        message: response.text,
        data: { expression, result: response.parameters?.result },
      };
    } catch (error) {
      return {
        success: false,
        message: `Sorry, I couldn't calculate "${expression}". Please try a simpler calculation.`,
      };
    }
  }

  private async handleSchedule(parameters: any): Promise<CommandResult> {
    // This would integrate with a calendar system
    return {
      success: true,
      message: 'I can help you schedule appointments. What would you like to schedule?',
      data: { action: 'schedule' },
    };
  }

  private async handleHelp(parameters: any): Promise<CommandResult> {
    try {
      const response = await VoiceAssistantService.getHelpCommands();
      
      return {
        success: true,
        message: response.text,
        data: { action: 'help' },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Here are some commands you can try: "start recording", "search for kitchen ideas", or "what\'s the weather?".',
      };
    }
  }

  private async handleClear(parameters: any): Promise<CommandResult> {
    const target = parameters.target || 'history';
    
    if (target === 'history') {
      VoiceAssistantService.clearHistory();
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

  // Utility method to get available commands for the current context
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
          'start recording',
          'go to settings',
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
