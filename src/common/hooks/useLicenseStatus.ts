import { useState, useEffect, useRef, useCallback } from 'react';
import { LicenseStatus } from '@/models/LicenseStatus';
import { request } from '@common/libs/request';

interface UseLicenseStatusOptions {
  enablePolling?: boolean;
  pollingInterval?: number;
  fastRefreshDuration?: number;
  maxRetries?: number;
}

export const useLicenseStatus = (options: UseLicenseStatusOptions = {}) => {
  const {
    enablePolling = true,
    pollingInterval = 15 * 60 * 1000, // 15 minutes
    fastRefreshDuration = 2 * 60 * 1000, // 2 minutes
    maxRetries = 3
  } = options;

  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fastRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLicenseStatus = useCallback(async (isRetry = false) => {
    try {
      if (!isRetry) {
        setIsLoading(true);
        setError(null);
      }
      
      const response = await request('/api/license/status', {
        method: 'GET'
      });
      
      // Convert expiryDate string to Date object if present
      if (response.expiryDate) {
        response.expiryDate = new Date(response.expiryDate);
      }
      
      setLicenseStatus(response);
      setRetryCount(0); // Reset retry count on success
      
    } catch (err: any) {
      console.error('Failed to fetch license status:', err);
      
      // Handle different error scenarios
      let errorStatus: LicenseStatus;
      let errorMessage: string;
      
      if (err.status === 403) {
        // License validation failed - license is invalid
        errorStatus = {
          isValid: false,
          isExpiringSoon: false,
          warningMessage: 'Your license is invalid or has expired. Please contact your administrator.'
        };
        errorMessage = 'License validation failed';
      } else if (err.status >= 500) {
        // Server error
        errorStatus = {
          isValid: false,
          isExpiringSoon: false,
          warningMessage: 'Server error while checking license status. Please contact support.'
        };
        errorMessage = 'Server error occurred';
      } else if (err.name === 'AbortError' || err.message?.includes('timeout')) {
        // Network timeout
        errorStatus = {
          isValid: false,
          isExpiringSoon: false,
          warningMessage: 'Network timeout while checking license status. Please check your connection.'
        };
        errorMessage = 'Network timeout';
      } else {
        // Other errors (network, etc.)
        errorStatus = {
          isValid: false,
          isExpiringSoon: false,
          warningMessage: 'Unable to verify license status. Please update the license as an administrator.'
        };
        errorMessage = 'Network or connection error';
      }
      
      setError(errorMessage);
      
      // Implement retry logic for transient errors
      if (retryCount < maxRetries && (err.status >= 500 || err.name === 'AbortError')) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Exponential backoff, max 30s
        console.log(`Retrying license status fetch in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        setRetryCount(prev => prev + 1);
        retryTimeoutRef.current = setTimeout(() => {
          fetchLicenseStatus(true);
        }, retryDelay);
      } else {
        // Set error status after max retries or for non-retryable errors
        setLicenseStatus(errorStatus);
      }
    } finally {
      if (!isRetry) {
        setIsLoading(false);
      }
    }
  }, [retryCount, maxRetries]);

  const setupInterval = useCallback((intervalMs: number) => {
    if (!enablePolling) return;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => fetchLicenseStatus(), intervalMs);
  }, [fetchLicenseStatus, enablePolling]);

  const refetchWithFastRefresh = useCallback(async () => {
    // Clear any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    setRetryCount(0); // Reset retry count for manual refresh
    await fetchLicenseStatus();
    
    if (!enablePolling) return;
    
    // Set up fast refresh for specified duration after manual refetch
    setupInterval(5000); // Check every 5 seconds
    
    // Clear fast refresh timeout if it exists
    if (fastRefreshTimeoutRef.current) {
      clearTimeout(fastRefreshTimeoutRef.current);
    }
    
    // After specified duration, go back to normal interval
    fastRefreshTimeoutRef.current = setTimeout(() => {
      setupInterval(pollingInterval);
    }, fastRefreshDuration);
  }, [fetchLicenseStatus, setupInterval, enablePolling, pollingInterval, fastRefreshDuration]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (fastRefreshTimeoutRef.current) {
      clearTimeout(fastRefreshTimeoutRef.current);
      fastRefreshTimeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    fetchLicenseStatus();
    
    if (enablePolling) {
      // Set up normal periodic refresh
      setupInterval(pollingInterval);
    }
    
    return cleanup;
  }, [fetchLicenseStatus, setupInterval, enablePolling, pollingInterval, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    licenseStatus,
    isLoading,
    error,
    retryCount,
    refetch: refetchWithFastRefresh,
    cleanup
  };
}; 