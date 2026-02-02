import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApiRequest } from "@common/hooks/useApiRequest";
import { Asset } from "@models/assets/Asset";

interface UseQueryAssetPageProps {
  userType: 'accessor' | 'asset_owner';
}

export function useQueryAssetData({ userType }: UseQueryAssetPageProps) {
  const [searchParams] = useSearchParams();
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);
  const assetId = searchParams.get('assetId');
  const accessRequestId = searchParams.get('accessRequestId');
  const { handleRequest } = useApiRequest();

  const getAsset = () => {
    const apiEndpoint = userType === 'accessor' 
      ? `/api/accessor/assets/${assetId}` 
      : `/api/asset_owner/assets/${assetId}`;
      
    handleRequest(apiEndpoint, 'GET', {},
      {
        onSuccess: (data: Asset) => {
          setCurrentAsset(data);
        },
        errorDescriptionId: 'text.failed_to_fetch_asset_info'
      }
    );
  };

  useEffect(() => {
    getAsset();
  }, [assetId]);

  return {
    currentAsset,
    accessRequestId: accessRequestId || undefined,
    userType
  };
}

