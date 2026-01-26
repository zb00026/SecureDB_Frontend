import { useState, useEffect, useCallback } from 'react';
import { request, useDamToast, useMyState, userHasRole } from '@common/index';
import { USER_ROLE } from '@/constants/enums';

/**
 * Hook to manage AWS Secrets Manager enabled status
 */
export function useAwsSecretsManager() {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showError } = useDamToast();
  const { snap } = useMyState();
  const user = snap.session.user;

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Determine endpoint based on user role
      let endpoint: string;
      if (userHasRole(user, USER_ROLE.ADMIN)) {
        endpoint = '/api/admin/settings/aws-secrets-manager-enabled';
      } else if (userHasRole(user, USER_ROLE.ASSET_OWNER)) {
        endpoint = '/api/asset_owner/assets/settings/aws-secrets-manager-enabled';
      } else {
        // For other roles, default to false
        setIsEnabled(false);
        setIsLoading(false);
        return;
      }

      const response = await request(endpoint, {
        method: 'GET',
        data: {}
      }) as { enabled: boolean };
      setIsEnabled(response.enabled ?? false);
    } catch (error: any) {
      console.error('Failed to fetch AWS Secrets Manager status:', error);
      setIsEnabled(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateStatus = useCallback(async (enabled: boolean) => {
    try {
      setIsLoading(true);
      await request('/api/admin/settings/aws-secrets-manager-enabled', {
        method: 'POST',
        data: { enabled }
      });
      setIsEnabled(enabled);
      return true;
    } catch (error: any) {
      console.error('Failed to update AWS Secrets Manager status:', error);
      showError({
        description: error?.response?.data?.error ?? 'Failed to update AWS Secrets Manager setting'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    isEnabled,
    isLoading,
    updateStatus,
    refetch: fetchStatus
  };
}

