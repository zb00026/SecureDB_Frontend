import { Flex, HStack, IconButton, Tooltip } from "@chakra-ui/react";
import { EditIcon, DeleteIcon, ViewIcon, AtSignIcon } from "@chakra-ui/icons";
import { Asset } from "@models/assets/Asset";
import { useIntl } from "react-intl";
import { BaseAssetsTable } from "./base_assets_table";
import { useMyState, userHasRole } from "@common/index";
import { USER_ROLE } from "@/constants/enums";
import { FiLock, FiUnlock } from "react-icons/fi";

interface AssetsTableProps {
  readonly assets: Asset[];
  readonly selectedAsset: Asset | null;
  readonly onSelectAsset: (asset: Asset) => void;
  readonly onDeleteAsset: (asset: Asset) => void;
  readonly onEditAsset?: (asset: Asset) => void;
  readonly onViewAccess?: (asset: Asset) => void;
  readonly onLockAsset?: (asset: Asset) => void;
  readonly onUnlockAsset?: (asset: Asset) => void;
  readonly onManageUsers?: (asset: Asset, userType: 'owners' | 'approvers') => void;
  readonly onTerminalAsset?: (asset: Asset) => void;
}

export function AssetsTable({
  assets,
  selectedAsset,
  onSelectAsset,
  onDeleteAsset,
  onEditAsset,
  onViewAccess,
  onLockAsset,
  onUnlockAsset,
  onManageUsers,
  onTerminalAsset
}: AssetsTableProps) {
  const { snap } = useMyState();
  const user = snap.session.user;
  const intl = useIntl();

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
    <HStack spacing={2} justify="center">
      {userHasRole(user, USER_ROLE.ADMIN) && onEditAsset && (
        <Tooltip label={intl.formatMessage({ id: "text.edit" })}>
          <IconButton
            aria-label={intl.formatMessage({ id: "text.edit" })}
            icon={<EditIcon />}
            size="sm"
            colorScheme="green"
            variant="ghost"
            onClick={e => {
              e.stopPropagation();
              onEditAsset(asset);
            }}
          />
        </Tooltip>
      )}

      {canViewAccess && onViewAccess && (
        <Tooltip label={intl.formatMessage({ id: "text.view_access" })}>
          <IconButton
            aria-label={intl.formatMessage({ id: "text.view_access" })}
            icon={<ViewIcon />}
            size="sm"
            colorScheme="blue"
            variant="ghost"
            onClick={e => {
              e.stopPropagation();
              onViewAccess(asset);
            }}
          />
        </Tooltip>
      )}

      {userHasRole(user, USER_ROLE.ADMIN) && onManageUsers && (
        <Tooltip label={intl.formatMessage({ id: "text.manage_users" })}>
          <IconButton
            aria-label={intl.formatMessage({ id: "text.manage_users" })}
            icon={<AtSignIcon />}
            size="sm"
            colorScheme="purple"
            variant="ghost"
            onClick={e => {
              e.stopPropagation();
              onManageUsers(asset, "owners");
            }}
          />
        </Tooltip>
      )}

      <Tooltip label={intl.formatMessage({ id: "text.delete" })}>
        <IconButton
          aria-label={intl.formatMessage({ id: "text.delete" })}
          icon={<DeleteIcon />}
          size="sm"
          colorScheme="red"
          variant="ghost"
          onClick={e => {
            e.stopPropagation();
            onDeleteAsset(asset);
          }}
        />
      </Tooltip>
    </HStack>
  );

  const canManageUsers = userHasRole(user, USER_ROLE.ADMIN);
  const canLockAsset = userHasRole(user, USER_ROLE.ADMIN);

  return (
    <BaseAssetsTable
      assets={assets}
      selectedAsset={selectedAsset}
      onSelectAsset={onSelectAsset}
      renderActions={renderActions}
      showLockAsset={true}
      lockActions={lockActions}
      onTerminalAsset={onTerminalAsset}
      onEditAsset={onEditAsset}
      onDeleteAsset={onDeleteAsset}
      onViewAccess={onViewAccess}
      onLockAsset={onLockAsset}
      onUnlockAsset={onUnlockAsset}
      onManageUsers={onManageUsers}
      canManageUsers={canManageUsers}
      canLockAsset={canLockAsset}
    />
  );
} 