import { useState, useCallback } from 'react';
import { ErrorService } from '../services/ErrorService';

export function useAsyncOperation<T extends (...args: any[]) => Promise<any>>(
  operation: T
): [T, boolean, Error | null] {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: Parameters<T>) => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await operation(...args);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        ErrorService.handleError(error, operation.name);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [operation]
  ) as T;

  return [execute, loading, error];
}

