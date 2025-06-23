import { Button, Flex, IconButton, Tooltip } from "@chakra-ui/react";
import { Asset } from "@models/assets/Asset";
import { FormattedMessage } from "react-intl";
import { BaseAssetsTable } from "./base_assets_table";
import { useMyState, userHasRole } from "@common/index";
import { USER_ROLE } from "@/constants/enums";
import { FiLock, FiUnlock } from "react-icons/fi";

interface AssetsTableProps {
  readonly assets: Asset[];
  readonly selectedAsset: Asset | null;
  readonly onSelectAsset: (asset: Asset) => void;
  readonly onDeleteAsset: (asset: Asset) => void;
  readonly onViewAccess?: (asset: Asset) => void;
  readonly onLockAsset?: (asset: Asset) => void;
  readonly onUnlockAsset?: (asset: Asset) => void;
}

export function AssetsTable({
  assets,
  selectedAsset,
  onSelectAsset,
  onDeleteAsset,
  onViewAccess,
  onLockAsset,
  onUnlockAsset
}: AssetsTableProps) {
  const { snap } = useMyState();
  const user = snap.session.user;

  // Check if user has admin or asset owner role
  const canViewAccess = userHasRole(user, USER_ROLE.ADMIN) || userHasRole(user, USER_ROLE.ASSET_OWNER);

  const lockActions = (asset: Asset) => (
    <Flex gap={2} flexWrap="wrap" justifyContent={'center'} w='full'>
      {/* Lock/Unlock buttons - only for admins */}
      {userHasRole(user, USER_ROLE.ADMIN) && (
        <>
          {onLockAsset && !asset.locked && (
            <Tooltip label="Lock asset access" placement="top">
              <IconButton
                size="sm"
                colorScheme="orange"
                variant="outline"
                aria-label="Lock asset"
                icon={<FiLock />}
                onClick={(e) => {
                  e.stopPropagation();
                  onLockAsset(asset);
                }}
              />
            </Tooltip>
          )}
          {onUnlockAsset && asset.locked && (
            <Tooltip label="Unlock asset access" placement="top">
              <IconButton
                size="sm"
                colorScheme="green"
                variant="outline"
                aria-label="Unlock asset"
                icon={<FiUnlock />}
                onClick={(e) => {
                  e.stopPropagation();
                  onUnlockAsset(asset);
                }}
              />
            </Tooltip>
          )}
        </>
      )}
    </Flex>
  )

  const renderActions = (asset: Asset) => (
    <Flex gap={2} flexWrap="wrap">

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
    </Flex>
  );

  return (
    <BaseAssetsTable
      assets={assets}
      selectedAsset={selectedAsset}
      onSelectAsset={onSelectAsset}
      renderActions={renderActions}
      showLockAsset={true}
      lockActions={lockActions}
    />
  );
} 