import { Button, Text } from "@chakra-ui/react";
import { Asset } from "@models/assets/Asset";
import { FormattedMessage } from "react-intl";
import { BaseAssetsTable } from "../../admin/assets/components/base_assets_table";
import { AccessRequest, ApprovalStatus } from "@models/assets/AccessRequest";

interface AssetsTableProps {
  readonly assets: Asset[];
  readonly selectedAsset: Asset | null;
  readonly onSelectAsset: (asset: Asset) => void;
  readonly onRequestAccess: (asset: Asset) => void;
  readonly onRelinquishAccess: (asset: AccessRequest | null) => void;
  readonly onUpdatePassword: (asset: AccessRequest | null) => void;
  readonly onQueryAsset: (asset: Asset) => void;
  readonly onTerminalAsset?: (asset: Asset) => void;
  readonly onViewAccess: (asset: Asset) => void;
  readonly showQueryButton: boolean;
  readonly userType?: 'admin' | 'accessor';
}


export function AssetsTable({
  assets,
  selectedAsset,
  onSelectAsset,
  onRequestAccess,
  onUpdatePassword,
  onRelinquishAccess,
  showQueryButton,
  onQueryAsset,
  onTerminalAsset,
  userType = 'accessor'
}: AssetsTableProps) {

  return (
    <BaseAssetsTable
      assets={assets}
      selectedAsset={selectedAsset}
      onSelectAsset={onSelectAsset}
      showHighlightRow={true}
      showFetchTemplate={false}
      showQueryButton={showQueryButton}
      onQueryAsset={onQueryAsset}
      onTerminalAsset={onTerminalAsset}
      showAccessRequestStatus={true}
      onRequestAccess={onRequestAccess}
      onRelinquishAccess={onRelinquishAccess}
      onUpdatePassword={onUpdatePassword}
      userType={userType}
    />
  );
} 