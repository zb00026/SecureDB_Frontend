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
  onViewAccess
}: AssetsTableProps) {
  const renderAccessRequestAction = (asset: Asset) => {
    if (asset.accessRequest?.isTempPassword && asset.accessRequest?.assetApproverStatus === ApprovalStatus.APPROVED) {
      return (
        <Button
          mb={0}
          cursor='pointer'
          colorScheme="orange"
          className="btnUpdatePassword"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onUpdatePassword(asset.accessRequest ?? null);
          }}
        >
          <FormattedMessage id="text.update_password" />
        </Button>
      );
    }
    
    return (
      <Button
        colorScheme="red"
        size="sm"
        mb={0}
        cursor='pointer'
        className="btnRelinquishAccess"
        onClick={(e) => {
          e.stopPropagation();
          onRelinquishAccess(asset.accessRequest ?? null);
        }}
      >
        <FormattedMessage id={asset.accessRequest?.assetApproverStatus === ApprovalStatus.APPROVED ? "text.relinquish_access" : "text.cancel_access_request"} />
      </Button>
    );
  };

  const renderActions = (asset: Asset) => (
    asset.accessRequest && asset.accessRequest.assetApproverStatus !== ApprovalStatus.REJECTED ? (
      renderAccessRequestAction(asset)
    ) : (
      <Button
        size="sm"
        colorScheme="green"
        onClick={(e) => {
          e.stopPropagation();
          onRequestAccess(asset);
        }}
      >
        <FormattedMessage id="text.request_access" />
      </Button>
    )
  );

  const handleRelinquishAccess = (asset: Asset) => {
    if (asset.accessRequest) {
      onRelinquishAccess(asset.accessRequest);
    }
  };

  return (
    <BaseAssetsTable
      assets={assets}
      selectedAsset={selectedAsset}
      onSelectAsset={onSelectAsset}
      showFetchTemplate={false}
      showQueryButton={showQueryButton}
      renderActions={renderActions}
      onQueryAsset={onQueryAsset}
      onTerminalAsset={onTerminalAsset}
      showAccessRequestStatus={true}
      onViewAccess={onViewAccess}
      showLockAsset={false}
      lockActions={() => null}
      onDeleteAsset={(asset) => {
        // For developers, this would be relinquish access or cancel request
        if (asset.accessRequest?.assetApproverStatus === ApprovalStatus.APPROVED) {
          handleRelinquishAccess(asset);
        } else if (asset.accessRequest) {
          handleRelinquishAccess(asset);
        } else {
          // No access request, can't delete
        }
      }}
    />
  );
} 