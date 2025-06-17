import { useState } from 'react';
import { AuditTrail } from '@models/AuditTrail';
import { User } from '@models/User';
import { USER_ROLE } from '@/constants/enums';
import { userHasRole } from '@common/index';
import { useListPage } from './useListPage';

export interface AuditTrailFilters {
  startDate: string;
  endDate: string;
  action: string;
  user: string;
  previousValue: string;
  newValue: string;
  ipAddress: string;
  assetId?: number;
  assetName?: string;
  resourceType?: string;
  // Role-specific filters (applied automatically)
  restrictToOwnedAssets?: boolean;
  restrictToApprovalAssets?: boolean;
  restrictToOwnActions?: boolean;
}

export interface UseRoleBasedAuditTrailProps {
  user: User | null;
}

export interface UseRoleBasedAuditTrailReturn {
  filters: AuditTrailFilters;
  setFilters: (filters: AuditTrailFilters) => void;
  getData: AuditTrail[] | { content: AuditTrail[] };
  getList: (params?: any) => Promise<void>;
  pagination: any;
  loading: boolean;
  availableFilters: {
    canFilterByAsset: boolean;
    canViewAllUsers: boolean;
    canViewAllActions: boolean;
    availableActions: string[];
    availableResourceTypes: string[];
  };
  roleBasedMessage: string;
}

export const useRoleBasedAuditTrail = ({ user }: UseRoleBasedAuditTrailProps): UseRoleBasedAuditTrailReturn => {
  const [filters, setFilters] = useState<AuditTrailFilters>({
    startDate: '',
    endDate: '',
    action: '',
    user: '',
    previousValue: '',
    newValue: '',
    ipAddress: '',
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
          restrictToOwnedAssets: true,
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
    return {
      ...filters,
      ...restrictions,
      // For non-admin/auditor users, limit to relevant resource types
      ...(user && (!userHasRole(user, USER_ROLE.ADMIN) && !userHasRole(user, USER_ROLE.AUDITOR)) && {
        resourceType: filters.resourceType ?? 'ASSET,ACCESS_REQUEST,USER_ACCESS'
      })
    };
  };

  const { getData, getList, pagination } = useListPage<AuditTrail>({
    baseUri: endpoint,
    defaultParams: getEffectiveFilters()
  });

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
    // Re-fetch data with new filters
    getList({
      page: 1,
      perPage: 20,
      ...getEffectiveFilters()
    });
  };

  return {
    filters,
    setFilters: handleSetFilters,
    getData,
    getList: (params = {}) => getList({ ...getEffectiveFilters(), ...params }),
    pagination,
    loading: false, // useListPage doesn't provide loading state, handle it separately if needed
    availableFilters,
    roleBasedMessage: message
  };
}; 