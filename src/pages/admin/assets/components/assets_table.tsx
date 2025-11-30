import { Asset } from "@models/assets/Asset";
import { BaseAssetsTable } from "./base_assets_table";
import { useMyState, userHasRole } from "@common/index";
import { USER_ROLE } from "@/constants/enums";

interface AssetsTableProps {
  readonly assets: Asset[];
  readonly selectedAsset: Asset | null;
  readonly onSelectAsset: (asset: Asset) => void;
  readonly onDeleteAsset: (asset: Asset) => void;
  readonly onEditAsset?: (asset: Asset) => void;
  readonly onLockAsset?: (asset: Asset) => void;
  readonly onUnlockAsset?: (asset: Asset) => void;
  readonly onManageUsers?: (asset: Asset, userType: 'owners' | 'approvers') => void;
  readonly onTerminalAsset?: (asset: Asset) => void;
  readonly userType?: 'admin' | 'developer';
}

export function AssetsTable({
  assets,
  selectedAsset,
  onSelectAsset,
  onDeleteAsset,
  onEditAsset,
  onLockAsset,
  onUnlockAsset,
  onManageUsers,
  onTerminalAsset,
  userType = 'admin'
}: AssetsTableProps) {
  const { snap } = useMyState();
  const user = snap.session.user;

  const canManageUsers = userHasRole(user, USER_ROLE.ADMIN);
  const canLockAsset = userHasRole(user, USER_ROLE.ADMIN);

  return (
    <BaseAssetsTable
      assets={assets}
      selectedAsset={selectedAsset}
      onSelectAsset={onSelectAsset}
      onTerminalAsset={onTerminalAsset}
      onEditAsset={onEditAsset}
      onDeleteAsset={onDeleteAsset}
      onLockAsset={onLockAsset}
      onUnlockAsset={onUnlockAsset}
      onManageUsers={onManageUsers}
      canManageUsers={canManageUsers}
      canLockAsset={canLockAsset}
      userType={userType}
    />
  );
} 