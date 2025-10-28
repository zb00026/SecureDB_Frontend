import { useState, useEffect } from 'react';
import { Asset } from '@models/assets/Asset';
import { AssetCredential } from '@models/assets/AssetCredential';
import { User } from '@models/User';
import { USER_ROLE } from '@/constants/enums';
import { userHasRole, request } from '@common/index';

export interface AssetWithPasswordStatus extends Asset {
  hasPassword?: boolean;
  credentialId?: number;
}

export interface UseAssetsForAuditProps {
  readonly user: User | null;
}

export interface UseAssetsForAuditReturn {
  readonly assets: AssetWithPasswordStatus[];
  readonly loading: boolean;
  readonly error: string | null;
}

export const useAssetsForAudit = ({ user }: UseAssetsForAuditProps): UseAssetsForAuditReturn => {
  const [assets, setAssets] = useState<AssetWithPasswordStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine the appropriate API endpoint based on user role
  const getAssetsEndpoint = () => {
    if (!user) {
      return null; // No access
    }

    if (userHasRole(user, USER_ROLE.ADMIN) || userHasRole(user, USER_ROLE.AUDITOR)) {
      return '/api/audit-trails/assets'; // Full access to all assets
    }

    if (userHasRole(user, USER_ROLE.ASSET_OWNER)) {
      return '/api/asset_owner/assets/credentials'; // Use credentials endpoint for asset owners
    }

    if (userHasRole(user, USER_ROLE.APPROVER)) {
      return '/api/approver/assets'; // Assets they can approve
    }

    return null; // No access for other roles
  };

  useEffect(() => {
    const endpoint = getAssetsEndpoint();
    
    if (endpoint) {
      setLoading(true);
      setError(null);
      
      request(endpoint, {})
        .then((response) => {
          let assetData: AssetWithPasswordStatus[] = [];
          if (user && (userHasRole(user, USER_ROLE.ADMIN) || userHasRole(user, USER_ROLE.AUDITOR))) {
            assetData = Array.isArray(response) ? response : response?.content ?? [];
          } else if (user && userHasRole(user, USER_ROLE.ASSET_OWNER)) {
            // For asset owners, response is AssetCredential[] with asset property
            const credentials = Array.isArray(response) ? response : [];
            assetData = credentials.map((credential: AssetCredential) => ({
              ...credential.asset!,
              hasPassword: !!credential.password || !!credential.sshKeyFile,
              credentialId: credential.id
            }));
          } else {
            // For other roles, response is Asset[]
            assetData = Array.isArray(response) ? response : response?.content ?? [];
          }
          
          setAssets(assetData);
        })
        .catch((err) => {
          setError('Failed to fetch assets');
          console.error('Error fetching assets:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setAssets([]);
      setLoading(false);
    }
  }, [user?.id]); // Only depend on user ID

  return {
    assets,
    loading,
    error
  };
};
