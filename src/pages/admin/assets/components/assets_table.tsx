import { Button, Flex } from "@chakra-ui/react";
import { Asset } from "@models/assets/Asset";
import { FormattedMessage } from "react-intl";
import { BaseAssetsTable } from "./base_assets_table";
import { useMyState, userHasRole } from "@common/index";
import { USER_ROLE } from "@/constants/enums";

interface AssetsTableProps {
  readonly assets: Asset[];
  readonly selectedAsset: Asset | null;
  readonly onSelectAsset: (asset: Asset) => void;
  readonly onDeleteAsset: (asset: Asset) => void;
  readonly onViewAccess?: (asset: Asset) => void;
}

export function AssetsTable({
  assets,
  selectedAsset,
  onSelectAsset,
  onDeleteAsset,
  onViewAccess
}: AssetsTableProps) {
  const { snap } = useMyState();
  const user = snap.session.user;
  
  // Check if user has admin or asset owner role
  const canViewAccess = userHasRole(user, USER_ROLE.ADMIN) || userHasRole(user, USER_ROLE.ASSET_OWNER);

  const renderActions = (asset: Asset) => (
    <Flex gap={2}>
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
      {canViewAccess && onViewAccess && (
        <Button
          size="sm"
          colorScheme="blue"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation(); // Prevent row selection when clicking view access
            onViewAccess(asset);
          }}
        >
          <FormattedMessage id="text.view_access" />
        </Button>
      )}
    </Flex>
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