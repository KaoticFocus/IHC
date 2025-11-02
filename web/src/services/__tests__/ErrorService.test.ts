import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorService } from '../ErrorService';
import { NotificationService } from '../NotificationService';

// Mock NotificationService
vi.mock('../NotificationService', () => ({
  NotificationService: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe('ErrorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles network errors correctly', () => {
    const error = new Error('Failed to fetch');
    ErrorService.handleError(error, 'test');
    
    expect(NotificationService.error).toHaveBeenCalledWith(
      'Network error. Please check your internet connection.'
    );
  });

  it('handles permission errors correctly', () => {
    const error = new Error('Microphone permission denied');
    ErrorService.handleError(error, 'test');
    
    expect(NotificationService.error).toHaveBeenCalledWith(
      expect.stringContaining('Microphone permission')
    );
  });

  it('handles API key errors correctly', () => {
    const error = new Error('Invalid API key');
    ErrorService.handleError(error, 'test');
    
    expect(NotificationService.error).toHaveBeenCalledWith(
      expect.stringContaining('API key')
    );
  });

  it('handles async errors correctly', async () => {
    const failingPromise = Promise.reject(new Error('Test error'));
    const [result, error] = await ErrorService.handleAsyncError(failingPromise, 'test');
    
    expect(result).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(NotificationService.error).toHaveBeenCalled();
  });

  it('handles successful async operations', async () => {
    const successPromise = Promise.resolve('success');
    const [result, error] = await ErrorService.handleAsyncError(successPromise, 'test');
    
    expect(result).toBe('success');
    expect(error).toBeNull();
  });
});

