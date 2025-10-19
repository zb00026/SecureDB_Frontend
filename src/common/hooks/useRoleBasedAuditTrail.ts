import { useState, useEffect } from 'react';
import { AuditTrail } from '@models/AuditTrail';
import { User } from '@models/User';
import { USER_ROLE } from '@/constants/enums';
import { userHasRole } from '@common/index';
import { useListPage } from './useListPage';
import { request } from '@common/libs/request';

export interface AuditTrailFilters {
  readonly startDate: string;
  readonly endDate: string;
  readonly action: string;
  readonly user: string;
  readonly previousValue: string;
  readonly newValue: string;
  readonly ipAddress: string;
  readonly assetId?: number;
  readonly assetName?: string;
  readonly resourceType?: string;
  // Role-specific filters (applied automatically)
  readonly restrictToOwnedAssets?: boolean;
  readonly restrictToApprovalAssets?: boolean;
  readonly restrictToOwnActions?: boolean;
}

export interface UseRoleBasedAuditTrailProps {
  readonly user: User | null;
  readonly assetId?: number;
}

export interface UseRoleBasedAuditTrailReturn {
  readonly filters: AuditTrailFilters;
  readonly setFilters: (filters: AuditTrailFilters) => void;
  readonly getData: AuditTrail[] | { content: AuditTrail[] };
  readonly getList: (params?: any) => Promise<void>;
  readonly pagination: any;
  readonly loading: boolean;
  readonly availableFilters: {
    readonly canFilterByAsset: boolean;
    readonly canViewAllUsers: boolean;
    readonly canViewAllActions: boolean;
    readonly availableActions: string[];
    readonly availableResourceTypes: string[];
  };
  readonly roleBasedMessage: string;
  readonly downloadAuditLogs: (filters?: AuditTrailFilters) => Promise<void>;
}

export const useRoleBasedAuditTrail = ({ user, assetId }: UseRoleBasedAuditTrailProps): UseRoleBasedAuditTrailReturn => {
  const [filters, setFilters] = useState<AuditTrailFilters>({
    startDate: '',
    endDate: '',
    action: '',
    user: '',
    previousValue: '',
    newValue: '',
    ipAddress: '',
    assetId: assetId || undefined,
    assetName: '',
    resourceType: '',
  });

  // Determine API endpoint and restrictions based on user role
  const getApiEndpointAndRestrictions = () => {
    if (!user) {
      return {
        endpoint: '/api/audit-trails',
        restrictions: {},
        message: 'No access to audit logs'
      };
    }

    if (userHasRole(user, USER_ROLE.ADMIN) || userHasRole(user, USER_ROLE.AUDITOR)) {
      return {
        endpoint: '/api/audit-trails',
        restrictions: {},
        message: 'Full access to all audit logs'
      };
    }

    if (userHasRole(user, USER_ROLE.ASSET_OWNER)) {
      return {
        endpoint: '/api/asset_owner/audit-trails',
        restrictions: {
          // Only add assetId restriction if a specific asset is selected
          ...(filters.assetId && { assetId: filters.assetId }),
          ...(assetId && !filters.assetId && { assetId })
        },
        message: 'Access limited to audit logs for assets you own'
      };
    }

    if (userHasRole(user, USER_ROLE.APPROVER)) {
      return {
        endpoint: '/api/approver/audit-trails',
        restrictions: {
          restrictToApprovalAssets: true,
        },
        message: 'Access limited to audit logs for assets and users you approve'
      };
    }

    return {
      endpoint: '/api/audit-trails',
      restrictions: {
        restrictToOwnActions: true,
      },
      message: 'Access limited to your own actions only'
    };
  };

  const { endpoint, restrictions, message } = getApiEndpointAndRestrictions();

  // Merge role-based restrictions with user filters
  const getEffectiveFilters = () => {
    const effectiveFilters: any = {
      ...filters,
      ...restrictions,
      // For non-admin/auditor users, limit to relevant resource types
      ...(user && (!userHasRole(user, USER_ROLE.ADMIN) && !userHasRole(user, USER_ROLE.AUDITOR)) && {
        resourceType: filters.resourceType ?? 'ASSET,ACCESS_REQUEST,USER_ACCESS'
      })
    };

    // Remove undefined values to avoid sending them in API requests
    for (const key of Object.keys(effectiveFilters)) {
      if (effectiveFilters[key] === undefined || effectiveFilters[key] === '') {
        delete effectiveFilters[key];
      }
    }

    return effectiveFilters;
  };

  const { getData, getList, pagination } = useListPage<AuditTrail>({
    baseUri: endpoint,
    defaultParams: {} // Don't set default params here, we'll handle them in getList calls
  });

  // Effect to handle filter changes and re-fetch data
  useEffect(() => {
    getList({
      page: 1,
      perPage: 20,
      ...getEffectiveFilters()
    });
  }, [filters.assetId, filters.startDate, filters.endDate, filters.action, filters.user, filters.previousValue, filters.newValue, filters.ipAddress]);

  // Available filters based on role
  const availableFilters = {
    canFilterByAsset: user ? (userHasRole(user, USER_ROLE.ADMIN) || 
                     userHasRole(user, USER_ROLE.AUDITOR) || 
                     userHasRole(user, USER_ROLE.ASSET_OWNER)) : false,
    canViewAllUsers: user ? (userHasRole(user, USER_ROLE.ADMIN) || 
                    userHasRole(user, USER_ROLE.AUDITOR)) : false,
    canViewAllActions: user ? (userHasRole(user, USER_ROLE.ADMIN) || 
                      userHasRole(user, USER_ROLE.AUDITOR)) : false,
    availableActions: user && (userHasRole(user, USER_ROLE.ADMIN) || userHasRole(user, USER_ROLE.AUDITOR))
      ? ['CREATE', 'UPDATE', 'DELETE', 'ACCESS_GRANTED', 'ACCESS_REVOKED', 'LOGIN', 'LOGOUT']
      : ['CREATE', 'UPDATE', 'DELETE', 'ACCESS_GRANTED', 'ACCESS_REVOKED'],
    availableResourceTypes: user && (userHasRole(user, USER_ROLE.ADMIN) || userHasRole(user, USER_ROLE.AUDITOR))
      ? ['ASSET', 'USER', 'ACCESS_REQUEST', 'CREDENTIAL', 'ROLE', 'SYSTEM']
      : ['ASSET', 'ACCESS_REQUEST', 'USER_ACCESS']
  };

  const handleSetFilters = (newFilters: AuditTrailFilters) => {
    setFilters(newFilters);
    // The useEffect will handle re-fetching data when filters change
  };

  // Download audit logs function
  const downloadAuditLogs = async (downloadFilters?: AuditTrailFilters) => {
    try {
      const effectiveFilters = downloadFilters ? {
        ...downloadFilters,
        ...restrictions,
        // Remove undefined values
        ...Object.fromEntries(
          Object.entries({
            ...downloadFilters,
            ...restrictions
          }).filter(([_, value]) => value !== undefined && value !== '')
        )
      } : getEffectiveFilters();

      // Build query string from filters
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(effectiveFilters)) {
        if (value !== undefined && value !== '' && value !== null) {
          // Ensure proper string conversion for different value types
          const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
          queryParams.append(key, stringValue);
        }
      }

      const queryString = queryParams.toString();
      const downloadUrl = queryString ? `${endpoint}/download?${queryString}` : `${endpoint}/download`;

      // Make the download request
      const response = await request(downloadUrl, { method: 'GET' }, false);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      // Get the filename from the response headers or create a default one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'audit-logs.csv';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch?.[1]) {
          filename = filenameMatch[1].replaceAll(/['"]/g, '');
        }
      }

      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a download link and trigger the download
      const url = globalThis.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading audit logs:', error);
      throw error;
    }
  };

  return {
    filters,
    setFilters: handleSetFilters,
    getData,
    getList: (params = {}) => getList({ ...getEffectiveFilters(), ...params }),
    pagination,
    loading: false, // useListPage doesn't provide loading state, handle it separately if needed
    availableFilters,
    roleBasedMessage: message,
    downloadAuditLogs
  };
}; 