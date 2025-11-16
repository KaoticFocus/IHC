import OpenAIService from './OpenAIService';

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}

class CommandProcessor {
  private navigationCallback?: (screen: string) => void;
  private recordingCallback?: (action: 'start' | 'stop') => void;
  private projectCreationCallback?: (projectData: any) => Promise<void>;
  private projectSelectionCallback?: (projectId: string, projectName: string) => Promise<{ userName: string }>;
  private noteDictationCallback?: (note: string, targetId?: string, targetType?: 'project' | 'consultation') => Promise<void>;
  private photoDescriptionCallback?: (description: string, photoIds: string[]) => Promise<void>;
  private workDescriptionCallback?: (description: string, photoIds: string[]) => Promise<void>;

  setNavigationCallback(callback: (screen: string) => void) {
    this.navigationCallback = callback;
  }

  setRecordingCallback(callback: (action: 'start' | 'stop') => void) {
    this.recordingCallback = callback;
  }

  setProjectCreationCallback(callback: (projectData: any) => Promise<void>) {
    this.projectCreationCallback = callback;
  }

  setProjectSelectionCallback(callback: (projectId: string, projectName: string) => Promise<{ userName: string }>) {
    this.projectSelectionCallback = callback;
  }

  setNoteDictationCallback(callback: (note: string, targetId?: string, targetType?: 'project' | 'consultation') => Promise<void>) {
    this.noteDictationCallback = callback;
  }

  setPhotoDescriptionCallback(callback: (description: string, photoIds: string[]) => Promise<void>) {
    this.photoDescriptionCallback = callback;
  }

  setWorkDescriptionCallback(callback: (description: string, photoIds: string[]) => Promise<void>) {
    this.workDescriptionCallback = callback;
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
        
        case 'create_project':
          return await this.handleCreateProject(parameters);
        
        case 'dictate_note':
          return await this.handleDictateNote(parameters);
        
        case 'describe_photo':
          return await this.handleDescribePhoto(parameters);
        
        case 'describe_work':
          return await this.handleDescribeWork(parameters);
        
        case 'select_project':
          return await this.handleSelectProject(parameters);
        
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
    // Check if project is required but not selected
    const requiresProject = parameters.requiresProject !== false;
    
    if (requiresProject && !parameters.projectId && !parameters.projectName) {
      return {
        success: false,
        message: 'Please select a project first. Say something like "Hey Flow, the following information will go under the [project name] job" before starting a recording.',
        data: { action: 'start_recording', requiresProject: true },
      };
    }

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

  private async handleGenerateScope(_parameters: any): Promise<CommandResult> {
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
      - "Go to settings"
      - "Go to projects"
      - "Go to consultations"
      - "Go back" or "Return to main"
      
      Recording:
      - "Start recording"
      - "Stop recording"
      - "Generate scope of work"
      
      Projects:
      - "Create a new project called [name]"
      - "Create project [name] for client [name]"
      - "Add note to project: [your note]"
      - "Dictate note: [your note]"
      
      Photos:
      - "Describe this photo: [description]"
      - "This photo shows: [description]"
      - "Work needed for these photos: [description]"
      - "Describe work: [what needs to be done]"
      
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

  private async handleSelectProject(parameters: any): Promise<CommandResult> {
    const projectName = parameters.projectName || parameters.name || parameters.project;
    
    if (!projectName) {
      return {
        success: false,
        message: 'Which project would you like to select? Please say the project name.',
      };
    }

    if (this.projectSelectionCallback) {
      try {
        const result = await this.projectSelectionCallback('', projectName);
        return {
          success: true,
          message: `I understand, ${result.userName}, the following information will go under the ${projectName} job.`,
          data: { action: 'select_project', projectName },
        };
      } catch (error) {
        return {
          success: false,
          message: `I couldn't find a project named "${projectName}". Please check the project name or create a new project first.`,
        };
      }
    }

    return {
      success: false,
      message: 'Project selection is not available.',
    };
  }

  private async handleCreateProject(parameters: any): Promise<CommandResult> {
    const projectData = parameters.projectData || parameters;
    
    if (!projectData.name && !projectData.title) {
      return {
        success: false,
        message: 'I need a project name to create a project. Please say something like "Create a project called Kitchen Remodel".',
      };
    }

    if (this.projectCreationCallback) {
      try {
        await this.projectCreationCallback(projectData);
        return {
          success: true,
          message: `Project "${projectData.name || projectData.title}" created successfully.`,
          data: { action: 'create_project', projectData },
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to create project: ${(error as Error).message}`,
        };
      }
    }

    return {
      success: false,
      message: 'Project creation is not available. Please use the projects screen to create a project.',
    };
  }

  private async handleDictateNote(parameters: any): Promise<CommandResult> {
    const note = parameters.note || parameters.text || parameters.description;
    const targetId = parameters.targetId || parameters.projectId || parameters.consultationId;
    const targetType = parameters.targetType || (parameters.projectId ? 'project' : parameters.consultationId ? 'consultation' : undefined);

    if (!note) {
      return {
        success: false,
        message: 'I didn\'t catch what you wanted to note. Please try again.',
      };
    }

    if (this.noteDictationCallback) {
      try {
        await this.noteDictationCallback(note, targetId, targetType);
        return {
          success: true,
          message: 'Note saved successfully.',
          data: { action: 'dictate_note', note, targetId, targetType },
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to save note: ${(error as Error).message}`,
        };
      }
    }

    return {
      success: false,
      message: 'Note dictation is not available.',
    };
  }

  private async handleDescribePhoto(parameters: any): Promise<CommandResult> {
    const description = parameters.description || parameters.text || parameters.note;
    const photoIds = parameters.photoIds || (parameters.photoId ? [parameters.photoId] : []);

    if (!description) {
      return {
        success: false,
        message: 'I didn\'t catch the description. Please describe the photo again.',
      };
    }

    if (photoIds.length === 0) {
      return {
        success: false,
        message: 'No photo selected. Please select a photo first.',
      };
    }

    if (this.photoDescriptionCallback) {
      try {
        await this.photoDescriptionCallback(description, photoIds);
        return {
          success: true,
          message: `Photo description saved successfully.`,
          data: { action: 'describe_photo', description, photoIds },
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to save photo description: ${(error as Error).message}`,
        };
      }
    }

    return {
      success: false,
      message: 'Photo description is not available.',
    };
  }

  private async handleDescribeWork(parameters: any): Promise<CommandResult> {
    const description = parameters.description || parameters.text || parameters.work || parameters.note;
    const photoIds = parameters.photoIds || (parameters.photoId ? [parameters.photoId] : []);

    if (!description) {
      return {
        success: false,
        message: 'I didn\'t catch the work description. Please describe what work needs to be done.',
      };
    }

    if (photoIds.length === 0) {
      return {
        success: false,
        message: 'No photos selected. Please select one or more photos first.',
      };
    }

    if (this.workDescriptionCallback) {
      try {
        await this.workDescriptionCallback(description, photoIds);
        return {
          success: true,
          message: `Work description saved successfully for ${photoIds.length} photo${photoIds.length > 1 ? 's' : ''}.`,
          data: { action: 'describe_work', description, photoIds },
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to save work description: ${(error as Error).message}`,
        };
      }
    }

    return {
      success: false,
      message: 'Work description is not available.',
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
          'select project',
          'start recording',
          'go to settings',
          'go to projects',
          'go to consultations',
          'create project',
        ];
      
      case 'recording':
        return [
          ...baseCommands,
          'stop recording',
          'generate scope of work',
          'dictate note',
          'go back',
        ];
      
      case 'projects':
        return [
          ...baseCommands,
          'create project',
          'dictate note',
          'go back',
        ];
      
      case 'consultations':
        return [
          ...baseCommands,
          'dictate note',
          'describe photo',
          'describe work',
          'go back',
        ];
      
      default:
        return baseCommands;
    }
  }
}

export default new CommandProcessor();

