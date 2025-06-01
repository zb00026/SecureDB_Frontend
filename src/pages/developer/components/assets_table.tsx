import { Button, Text } from "@chakra-ui/react";
import { Asset } from "@models/assets/Asset";
import { FormattedMessage } from "react-intl";
import { BaseAssetsTable } from "../../admin/assets/components/base_assets_table";
import { AccessRequest } from "@models/assets/AccessRequest";

interface AssetsTableProps {
  readonly assets: Asset[];
  readonly selectedAsset: Asset | null;
  readonly onSelectAsset: (asset: Asset) => void;
  readonly onRequestAccess: (asset: Asset) => void;
  readonly onRelinquishAccess: (asset: AccessRequest | null) => void;
  readonly onUpdatePassword: (asset: AccessRequest | null) => void;
  readonly onQueryAsset: (asset: Asset) => void;
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
  onQueryAsset
}: AssetsTableProps) {
  const renderAccessRequestAction = (asset: Asset) => {
    if (asset.accessRequest?.assetCredential?.isTemporaryPassword) {
      return (
        <Text
          textDecor={'underline'}
          mb={0}
          cursor='pointer'
          className="btnUpdatePassword"
          onClick={(e) => {
            e.stopPropagation();
            onUpdatePassword(asset.accessRequest ?? null);
          }}
        >
          <FormattedMessage id="text.update_password" />
        </Text>
      );
    }
    
    return (
      <Text
        textDecor={'underline'}
        mb={0}
        cursor='pointer'
        className="btnRelinquishAccess"
        onClick={(e) => {
          e.stopPropagation();
          onRelinquishAccess(asset.accessRequest ?? null);
        }}
      >
        <FormattedMessage id="text.relinquish_access" />
      </Text>
    );
  };

  const renderActions = (asset: Asset) => (
    asset.accessRequest ? (
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

  return (
    <BaseAssetsTable
      assets={assets}
      selectedAsset={selectedAsset}
      onSelectAsset={onSelectAsset}
      showFetchTemplate={true}
      showQueryButton={true}
      renderActions={renderActions}
      onQueryAsset={onQueryAsset}
    />
  );
} 