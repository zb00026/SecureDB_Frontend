import { useState } from 'react';
import { Asset } from '@models/assets/Asset';
import { AssetAccessDTO } from '@models/assets/AssetAccess';
import { AssetCredential } from '@models/assets/AssetCredential';
import { request } from '@common/index';

export interface UseViewAccessProps {
  apiEndpoint: string; // e.g., '/api/admin/assets', '/api/accessor/assets', '/api/asset_owner/assets'
}

export interface UseViewAccessReturn {
  // State
  isViewAccessModalOpen: boolean;
  viewAccessAsset: Asset | AssetCredential | null;
  assetAccessData: AssetAccessDTO | null;
  isLoadingAccess: boolean;
  accessError: string | null;
  
  // Actions
  viewAssetAccess: (asset: Asset | AssetCredential) => void;
  closeViewAccessModal: () => void;
  
  // Helper functions
  getPermissionColor: (permission: string) => string;
  getObjectTypeColor: (objectType: string) => string;
}

export const useViewAccess = ({ apiEndpoint }: UseViewAccessProps): UseViewAccessReturn => {
  const [isViewAccessModalOpen, setIsViewAccessModalOpen] = useState(false);
  const [viewAccessAsset, setViewAccessAsset] = useState<Asset | AssetCredential | null>(null);
  const [assetAccessData, setAssetAccessData] = useState<AssetAccessDTO | null>(null);
  const [isLoadingAccess, setIsLoadingAccess] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  const fetchAssetAccess = async (assetId: number) => {
    setIsLoadingAccess(true);
    setAccessError(null);
    
    try {
      const response = await request(`${apiEndpoint}/${assetId}/access`, {
        method: 'GET'
      });
      setAssetAccessData(response);
    } catch (error: any) {
      console.error('Error fetching asset access:', error);
      
      // Handle 403 Forbidden response
      if (error.status === 403) {
        const errorMessage = error.data?.error ?? 'User has no access to asset';
        setAccessError(errorMessage);
      } else {
        setAccessError('Failed to fetch asset access information');
      }
    } finally {
      setIsLoadingAccess(false);
    }
  };

  const viewAssetAccess = (asset: Asset | AssetCredential) => {
    setViewAccessAsset(asset);
    setIsViewAccessModalOpen(true);
    
    // Handle both Asset and AssetCredential types
    let assetId: number | undefined;
    
    // Check if it's an AssetCredential (has asset property)
    if ('asset' in asset && asset.asset) {
      assetId = asset.asset.id;
    } else {
      // It's an Asset
      assetId = (asset as Asset).id;
    }
    
    if (assetId) {
      fetchAssetAccess(assetId);
    }
  };

  const closeViewAccessModal = () => {
    setIsViewAccessModalOpen(false);
    setViewAccessAsset(null);
    setAssetAccessData(null);
    setAccessError(null);
    setIsLoadingAccess(false);
  };

  // Helper function to get permission color
  const getPermissionColor = (permission: string): string => {
    switch (permission.toUpperCase()) {
      case 'SELECT':
        return 'green';
      case 'INSERT':
        return 'blue';
      case 'UPDATE':
        return 'orange';
      case 'DELETE':
        return 'red';
      case 'ALL PRIVILEGES':
      case 'FULL':
        return 'purple';
      default:
        return 'gray';
    }
  };

  // Helper function to get object type color
  const getObjectTypeColor = (objectType: string): string => {
    switch (objectType.toUpperCase()) {
      case 'DATABASE':
        return 'purple';
      case 'TABLE':
        return 'blue';
      case 'VIEW':
        return 'cyan';
      case 'PROCEDURE':
        return 'orange';
      default:
        return 'gray';
    }
  };

  return {
    // State
    isViewAccessModalOpen,
    viewAccessAsset,
    assetAccessData,
    isLoadingAccess,
    accessError,
    
    // Actions
    viewAssetAccess,
    closeViewAccessModal,
    
    // Helper functions
    getPermissionColor,
    getObjectTypeColor,
  };
}; 