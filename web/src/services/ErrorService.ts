import { NotificationService } from './NotificationService';

export class ErrorService {
  static handleError(error: unknown, context: string): string {
    let userMessage = 'An unexpected error occurred. Please try again.';
    
    if (error instanceof Error) {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`[${context}]`, error);
      }

      // User-friendly error messages
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('failed to fetch')) {
        userMessage = 'Network error. Please check your internet connection.';
      } else if (errorMessage.includes('permission') || errorMessage.includes('microphone')) {
        userMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.';
      } else if (errorMessage.includes('api key') || errorMessage.includes('api_key')) {
        userMessage = 'Invalid API key. Please check your OpenAI API key in settings.';
      } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        userMessage = 'API rate limit exceeded. Please try again later.';
      } else if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        userMessage = 'Authentication failed. Please check your API key.';
      } else if (errorMessage.includes('429')) {
        userMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (errorMessage.includes('indexeddb') || errorMessage.includes('database')) {
        userMessage = 'Storage error. Please try refreshing the page.';
      } else if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        userMessage = 'Resource not found.';
      } else {
        // Use the error message if it's user-friendly
        userMessage = error.message.length < 100 ? error.message : userMessage;
      }
    } else if (typeof error === 'string') {
      userMessage = error;
    }

    // Show notification
    NotificationService.error(userMessage);

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // this.sendToErrorTracking(error, context);
    }

    return userMessage;
  }

  static async handleAsyncError<T>(
    promise: Promise<T>,
    context: string
  ): Promise<[T | null, Error | null]> {
    try {
      const result = await promise;
      return [result, null];
    } catch (error) {
      this.handleError(error, context);
      return [null, error as Error];
    }
  }

  static handleSuccess(message: string) {
    NotificationService.success(message);
  }

  static handleWarning(message: string) {
    NotificationService.warning(message);
  }

  static handleInfo(message: string) {
    NotificationService.info(message);
  }
}

