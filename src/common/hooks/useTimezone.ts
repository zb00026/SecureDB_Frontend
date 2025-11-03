import { useState, useEffect, useCallback, useRef } from 'react';
import { request } from '@common/libs/request';
import { TimezoneInfoDTO, TimezoneRequest, TimezoneResponse } from '@models/Timezone';
import { useDamToast } from '@common/hooks/useDamToast';

interface UseTimezoneReturn {
  readonly timezones: readonly TimezoneInfoDTO[];
  readonly currentTimezone: string;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly fetchTimezones: () => Promise<void>;
  readonly updateTimezone: (timezone: string) => Promise<boolean>;
  readonly refreshCurrentTimezone: () => Promise<void>;
}

export const useTimezone = (): UseTimezoneReturn => {
  const [timezones, setTimezones] = useState<readonly TimezoneInfoDTO[]>([]);
  const [currentTimezone, setCurrentTimezone] = useState<string>('UTC');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useDamToast();
  
  // Use refs to avoid re-renders from toast functions
  const showSuccessRef = useRef(showSuccess);
  const showErrorRef = useRef(showError);
  
  // Update refs when toast functions change
  useEffect(() => {
    showSuccessRef.current = showSuccess;
    showErrorRef.current = showError;
  }, [showSuccess, showError]);

  const fetchTimezones = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await request('/api/settings/timezone/available', { method: 'GET' });
      setTimezones(response as readonly TimezoneInfoDTO[]);
    } catch (err) {
      console.error('Failed to fetch timezones from API:', err);
      setError('Failed to load timezone list');
    } finally {
      setIsLoading(false);
    }
  }, []); // Remove dependencies

  const refreshCurrentTimezone = useCallback(async () => {
    try {
      const response = await request('/api/settings/timezone', { method: 'GET' });
      const timezoneData = response as TimezoneResponse;
      setCurrentTimezone(timezoneData.timezone);
    } catch (err) {
      console.error('Failed to fetch current timezone:', err);
      setError('Failed to fetch current timezone');
    }
  }, []); // Remove dependencies

  const updateTimezone = useCallback(async (timezone: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const requestData: TimezoneRequest = { timezone };
      const response = await request('/api/settings/timezone', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const timezoneData = response as TimezoneResponse;
      setCurrentTimezone(timezoneData.timezone);
      showSuccessRef.current({
        title: 'Success',
        description: 'Timezone updated successfully'
      });
      return true;
    } catch (err) {
      console.error('Failed to update timezone:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update timezone';
      setError(errorMessage);
      showErrorRef.current({
        title: 'Error',
        description: errorMessage
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies - using refs instead

  // Initialize timezone on mount
  useEffect(() => {
    refreshCurrentTimezone();
  }, []); // Only run once on mount

  return {
    timezones,
    currentTimezone,
    isLoading,
    error,
    fetchTimezones,
    updateTimezone,
    refreshCurrentTimezone,
  };
};
