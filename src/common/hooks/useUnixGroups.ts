import { useState, useCallback } from 'react';
import { useApiRequest } from './useApiRequest';
import { useListPage } from './useListPage';
import { 
  UnixGroup, 
  CreateUnixGroup, 
  UpdateUnixGroup, 
  UnixGroupSyncResult, 
  UnixFolderSuggestion 
} from '../../models/unix/UnixGroup';

export interface UnixGroupsFilters {
  page: number;
  size: number;
  assetId?: number;
  search?: string;
}

export function useUnixGroups() {
  
  const { handleRequest } = useApiRequest();

  const [filters, setFilters] = useState<UnixGroupsFilters>({
    page: 0,
    size: 20
  });
  const [error, setError] = useState<string | null>(null);
  const [customGroupsData, setCustomGroupsData] = useState<any>(null);

  // Use useListPage for groups - but we'll override the baseUri for asset-specific calls
  const {
    pagination: groupsPagination
  } = useListPage<UnixGroup>({
    baseUri: '/api/asset_owner/unix-groups',
    usePagination: true
  });

  // Fetch groups for a specific asset
  const fetchGroupsByAsset = useCallback(async (assetId: number, newFilters?: Partial<UnixGroupsFilters>) => {
    const currentFilters = newFilters ? { ...filters, ...newFilters } : filters;
    setFilters(currentFilters);
    setError(null);
    
    const params: any = {
      page: currentFilters.page || 0,
      size: currentFilters.size || 20
    };
    
    // Add filter parameters
    if (currentFilters.search) params.search = currentFilters.search;
    
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/asset_owner/unix-groups/asset/${assetId}/paginated?${queryString}`;
    
    handleRequest(endpoint, 'GET', null, {
      onSuccess: (response) => {
        setCustomGroupsData(response);
      },
      onError: (error) => {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch groups';
        setError(errorMessage);
      },
      errorDescriptionId: 'unix_groups.fetch_error'
    });
  }, [filters, handleRequest]);

  // Fetch all groups (non-paginated)
  const fetchAllGroupsByAsset = useCallback(async (assetId: number) => {
    setError(null);
    
    const endpoint = `/api/asset_owner/unix-groups/asset/${assetId}`;
    
    return new Promise((resolve) => {
      handleRequest(endpoint, 'GET', null, {
        onSuccess: (response) => {
          resolve(response || []);
        },
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch groups';
          setError(errorMessage);
          resolve([]);
        },
        errorDescriptionId: 'unix_groups.fetch_error'
      });
    });
  }, [handleRequest]);

  // Helper function to handle refresh after successful operation
  const handleRefreshAndResolve = useCallback(async (response: any, assetId: number, resolve: (value: any) => void) => {
    try {
      await fetchGroupsByAsset(assetId);
      resolve(response);
    } catch (error) {
      console.error('Failed to refresh groups list:', error);
      resolve(response); // Still resolve with the original response
    }
  }, [fetchGroupsByAsset]);

  // Create a new group
  const createGroup = useCallback(async (groupData: CreateUnixGroup, sessionId?: string) => {
    setError(null);
    
    const endpoint = sessionId 
      ? `/api/asset_owner/unix-groups/session/${sessionId}`
      : '/api/asset_owner/unix-groups';
    
    return new Promise((resolve, reject) => {
      const onSuccess = (response: any) => {
        handleRefreshAndResolve(response, groupData.assetId, resolve);
      };
      
      const onError = (error: any) => {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create group';
        setError(errorMessage);
        reject(error instanceof Error ? error : new Error(errorMessage));
      };

      handleRequest(endpoint, 'POST', groupData, {
        onSuccess,
        onError,
        successDescriptionId: 'unix_groups.create_success',
        errorDescriptionId: 'unix_groups.create_error',
        timeout: 300000 // 5 minutes
      });
    });
  }, [handleRequest, handleRefreshAndResolve]);

  // Update an existing group
  const updateGroup = useCallback(async (groupId: number, groupData: UpdateUnixGroup, sessionId?: string) => {
    setError(null);
    
    const endpoint = sessionId 
      ? `/api/asset_owner/unix-groups/${groupId}/session/${sessionId}`
      : `/api/asset_owner/unix-groups/${groupId}`;
    
    return new Promise((resolve, reject) => {
      const onSuccess = (response: any) => {
        if (filters.assetId) {
          handleRefreshAndResolve(response, filters.assetId, resolve);
        } else {
          resolve(response);
        }
      };
      
      const onError = (error: any) => {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update group';
        setError(errorMessage);
        reject(error instanceof Error ? error : new Error(errorMessage));
      };

      handleRequest(endpoint, 'PUT', groupData, {
        onSuccess,
        onError,
        successDescriptionId: 'unix_groups.update_success',
        errorDescriptionId: 'unix_groups.update_error',
        timeout: 300000 // 5 minutes
      });
    });
  }, [handleRequest, filters.assetId, handleRefreshAndResolve]);

  // Delete a group
  const deleteGroup = useCallback(async (groupId: number) => {
    setError(null);
    
    const endpoint = `/api/asset_owner/unix-groups/${groupId}`;
    
    return new Promise((resolve, reject) => {
      const onSuccess = () => {
        if (filters.assetId) {
          handleRefreshAndResolve(undefined, filters.assetId, resolve);
        } else {
          resolve(undefined);
        }
      };
      
      const onError = (error: any) => {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete group';
        setError(errorMessage);
        reject(error instanceof Error ? error : new Error(errorMessage));
      };

      handleRequest(endpoint, 'DELETE', null, {
        onSuccess,
        onError,
        successDescriptionId: 'unix_groups.delete_success',
        errorDescriptionId: 'unix_groups.delete_error'
      });
    });
  }, [handleRequest, filters.assetId, handleRefreshAndResolve]);

  // Get a specific group by ID
  const getGroupById = useCallback(async (groupId: number): Promise<UnixGroup> => {
    const endpoint = `/api/asset_owner/unix-groups/${groupId}`;
    
    return new Promise((resolve, reject) => {
      handleRequest(endpoint, 'GET', null, {
        onSuccess: (response) => {
          resolve(response);
        },
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch group';
          reject(new Error(errorMessage));
        },
        errorDescriptionId: 'unix_groups.fetch_error'
      });
    });
  }, [handleRequest]);

  // Sync groups with server
  const syncGroupsWithServer = useCallback(async (assetId: number): Promise<UnixGroupSyncResult> => {
    setError(null);
    
    const endpoint = `/api/asset_owner/unix-groups/sync/${assetId}`;
    
    return new Promise((resolve, reject) => {
      const onSuccess = (response: any) => {
        handleRefreshAndResolve(response, assetId, resolve);
      };
      
      const onError = (error: any) => {
        const errorMessage = error instanceof Error ? error.message : 'Failed to sync groups';
        setError(errorMessage);
        reject(error instanceof Error ? error : new Error(errorMessage));
      };

      handleRequest(endpoint, 'POST', null, {
        onSuccess,
        onError,
        successDescriptionId: 'unix_groups.sync_success',
        errorDescriptionId: 'unix_groups.sync_error'
      });
    });
  }, [handleRequest, handleRefreshAndResolve]);

  // Get folder suggestions from server
  const getFolderSuggestions = useCallback(async (assetId: number, path = '/'): Promise<UnixFolderSuggestion[]> => {
    const endpoint = `/api/asset_owner/unix-groups/folder-suggestions/${assetId}`;
    const requestData = { path };
    
    return new Promise((resolve, reject) => {
      handleRequest(endpoint, 'POST', requestData, {
        onSuccess: (response) => {
          resolve(response || []);
        },
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch folder suggestions';
          reject(new Error(errorMessage));
        },
        errorDescriptionId: 'unix_groups.folder_suggestions_error'
      });
    });
  }, [handleRequest]);

  // Apply ACL permissions
  const applyAclPermissions = useCallback(async (groupId: number) => {
    setError(null);
    
    const endpoint = `/api/asset_owner/unix-groups/${groupId}/apply-acl`;
    
    return new Promise((resolve, reject) => {
      handleRequest(endpoint, 'POST', null, {
        onSuccess: () => {
          resolve(undefined);
        },
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : 'Failed to apply ACL permissions';
          setError(errorMessage);
          reject(error instanceof Error ? error : new Error(errorMessage));
        },
        successDescriptionId: 'unix_groups.acl_apply_success',
        errorDescriptionId: 'unix_groups.acl_apply_error'
      });
    });
  }, [handleRequest]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<UnixGroupsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Handle search
  const handleSearch = useCallback(() => {
    if (filters.assetId) {
      fetchGroupsByAsset(filters.assetId);
    }
  }, [filters.assetId, fetchGroupsByAsset]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof UnixGroupsFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  }, [filters]);

  return {
    // Data
    groups: Array.isArray(customGroupsData) ? customGroupsData : customGroupsData?.content || [],
    error,
    
    // Pagination
    groupsPagination: customGroupsData ? {
      meta: {
        total: customGroupsData.totalElements || 0,
        current_page: (customGroupsData.number || 0) + 1,
        per_page: customGroupsData.size || 20
      },
      onChange: (page: number, pageSize: number) => {
        if (filters.assetId) {
          updateFilters({ page: page - 1, size: pageSize });
          fetchGroupsByAsset(filters.assetId, { page: page - 1, size: pageSize });
        }
      }
    } : groupsPagination,
    
    // State
    filters,
    
    // Actions
    fetchGroupsByAsset,
    fetchAllGroupsByAsset,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupById,
    syncGroupsWithServer,
    getFolderSuggestions,
    applyAclPermissions,
    updateFilters,
    handleSearch,
    handleFilterChange
  };
}
