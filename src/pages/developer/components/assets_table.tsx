import { Button, Text } from "@chakra-ui/react";
import { Asset } from "@models/assets/Asset";
import { FormattedMessage } from "react-intl";
import { BaseAssetsTable } from "../../admin/assets/components/base_assets_table";

interface AssetsTableProps {
  readonly assets: Asset[];
  readonly selectedAsset: Asset | null;
  readonly onSelectAsset: (asset: Asset) => void;
  readonly onRequestAccess: (asset: Asset) => void;
}

export function AssetsTable({
  assets,
  selectedAsset,
  onSelectAsset,
  onRequestAccess
}: AssetsTableProps) {
  const renderActions = (asset: Asset) => (
    asset.accessRequest ? (
      <Text
        textDecor={'underline'}
        mb={0}
        cursor='pointer'
        onClick={(e) => {
          e.stopPropagation();
          onRequestAccess(asset);
        }}
      >
        <FormattedMessage id="text.update_request" />
      </Text>
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
      renderActions={renderActions}
    />
  );
} 