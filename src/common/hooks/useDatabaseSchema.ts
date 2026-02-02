import { useState, useEffect } from 'react';
import { request } from '@common/libs/request';
import { DatabaseSchemaDTO } from '@models/DatabaseSchema';
import { useDamToast } from '@common/hooks/useDamToast';

interface UseDatabaseSchemaProps {
  readonly requestId?: string;
  readonly assetId?: string;
  readonly userType?: 'accessor' | 'asset_owner'; // Optional, kept for backward compatibility
}

interface UseDatabaseSchemaReturn {
  readonly schema: DatabaseSchemaDTO | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly fetchSchema: () => Promise<void>;
}

export const useDatabaseSchema = ({ 
  requestId, 
  assetId, 
  userType 
}: UseDatabaseSchemaProps): UseDatabaseSchemaReturn => {
  const [schema, setSchema] = useState<DatabaseSchemaDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useDamToast();

  const fetchSchema = async () => {
    if (!requestId && !assetId) {
      setError('Either requestId or assetId must be provided');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use unified schema endpoint
      // Backend automatically detects user role and permissions
      let endpoint: string;
      
      if (requestId) {
        // Use query parameter format: /api/schema?requestId={id}
        endpoint = `/api/schema?requestId=${requestId}`;
      } else if (assetId) {
        // Use query parameter format: /api/schema?assetId={id}&isAssetOwner={true|false}
        // If userType provided, pass explicit access type to backend
        const isAssetOwnerParam =
          userType === undefined
            ? ''
            : `&isAssetOwner=${userType === 'asset_owner'}`;
        endpoint = `/api/schema?assetId=${assetId}${isAssetOwnerParam}`;
      } else {
        throw new Error('Either requestId or assetId must be provided');
      }

      const response = await request(endpoint, { method: 'GET' });
      setSchema(response as DatabaseSchemaDTO);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch database schema';
      setError(errorMessage);
      showError({ 
        title: 'Error',
        description: errorMessage 
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (requestId || assetId) {
      fetchSchema();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, assetId]); // userType is no longer needed as backend handles role detection

  return {
    schema,
    isLoading,
    error,
    fetchSchema
  };
};
