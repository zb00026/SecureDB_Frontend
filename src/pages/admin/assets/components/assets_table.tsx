import { Button } from "@chakra-ui/react";
import { Asset } from "@models/assets/Asset";
import { FormattedMessage } from "react-intl";
import { BaseAssetsTable } from "./base_assets_table";

interface AssetsTableProps {
  readonly assets: Asset[];
  readonly selectedAsset: Asset | null;
  readonly onSelectAsset: (asset: Asset) => void;
  readonly onDeleteAsset: (asset: Asset) => void;
}

export function AssetsTable({
  assets,
  selectedAsset,
  onSelectAsset,
  onDeleteAsset
}: AssetsTableProps) {
  const renderActions = (asset: Asset) => (
    <Button
      size="sm"
      colorScheme="red"
      onClick={(e) => {
        e.stopPropagation(); // Prevent row selection when clicking delete
        onDeleteAsset(asset);
      }}
    >
      <FormattedMessage id="text.delete" />
    </Button>
  );

  return (
    <BaseAssetsTable
      assets={assets}
      selectedAsset={selectedAsset}
      onSelectAsset={onSelectAsset}
      renderActions={renderActions}
    />
  );
} 