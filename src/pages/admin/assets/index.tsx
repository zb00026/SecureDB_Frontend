import {
  Box, Button, Flex, Input, Text, Select,
  useDisclosure
} from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { DamCard, DamCardBody, DamCardDivider, request, useListPage, useDamToast, BulkUploadModal, BulkUploadConfig } from "@common/index";
import { Asset } from "@models/assets/Asset";
import { AssetDTO } from "@models/assets/AssetDTO";
import { User } from "@models/User";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { AssetType, DatabaseType, USER_ROLE } from "@/constants/enums";
import { DamAlertDialog } from "@common/components/DamDialog/DamAlertDialog";
import { useApiRequest } from "@common/hooks/useApiRequest";
import { AssetsTable } from "./components/assets_table";
import { DamViewAccessModal } from "@common/components/DamDialog/DamViewAccessModal";
import { useViewAccess } from "@common/hooks/useViewAccess";
import { AssetLockDialog, LockType, LockAction } from "./components/asset_lock_dialog";
import { ManageUsersModal } from "./components/manage_users_modal";
import { EditAssetModal } from "./components/edit_asset_modal";

export const isSearchable = true;
export const displayName = 'Assets Management Page';
export function Component() {
  const intl = useIntl();
  const { showSuccess, showError } = useDamToast();
  const [assets, setAssets] = useState<Array<Asset>>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isFormShow, setIsFormShow] = useState(false);
  const [isDelDlgOpen, setIsDelDlgOpen] = useState(false);
  const [deleteAssetId, setDeleteAssetId] = useState<number | null>(null);
  
  // Lock/Unlock states
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);
  const [lockDialogAsset, setLockDialogAsset] = useState<Asset | null>(null);
  const [lockDialogAction, setLockDialogAction] = useState<LockAction>(LockAction.LOCK);
  const [isLockLoading, setIsLockLoading] = useState(false);

  // Manage users modal states
  const [isManageUsersModalOpen, setIsManageUsersModalOpen] = useState(false);
  const [manageUsersAsset, setManageUsersAsset] = useState<Asset | null>(null);
  const [manageUsersType, setManageUsersType] = useState<'owners' | 'approvers'>('owners');
  const [isManageUsersLoading, setIsManageUsersLoading] = useState(false);

  // Edit asset modal states
  const [isEditAssetModalOpen, setIsEditAssetModalOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [isEditAssetLoading, setIsEditAssetLoading] = useState(false);

  // Bulk upload state
  const { isOpen: isBulkUploadOpen, onOpen: onBulkUploadOpen, onClose: onBulkUploadClose } = useDisclosure();

  // Form states for create asset
  const [formState, setFormState] = useState<Partial<AssetDTO>>({
    name: '',
    type: '' as AssetType | '',
    databaseType: '' as DatabaseType | '',
    description: '',
    hostAddress: '',
    portNumber: '',
    databaseName: ''
  });

  // Use the shared view access hook
  const {
    isViewAccessModalOpen,
    viewAccessAsset,
    assetAccessData,
    isLoadingAccess,
    accessError,
    viewAssetAccess,
    closeViewAccessModal
  } = useViewAccess({ apiEndpoint: '/api/admin/assets' });

  // Remove the UsersTabs as we're moving to a modal approach

  const { getData, getList: getAssetsList } = useListPage<Asset>({
    baseUri: "/api/admin/assets",
    defaultParams: {},
    usePagination: false
  });

  // User lists for manage users modal
  const { getData: getAssetOwners } = useListPage<User>({
    baseUri: '/api/admin/users',
    defaultParams: {
      roles: [USER_ROLE.ASSET_OWNER, USER_ROLE.ADMIN]
    },
    usePagination: false
  });

  const { getData: getApprovers } = useListPage<User>({
    baseUri: '/api/admin/users',
    defaultParams: {
      roles: [USER_ROLE.APPROVER]
    },
    usePagination: false
  });

  const { handleRequest } = useApiRequest();

  // Bulk upload configuration for assets
  const assetBulkUploadConfig: BulkUploadConfig = {
    type: 'assets',
    titleId: 'text.bulk_asset_upload',
    instructionsId: 'text.asset_upload_instructions',
    sampleCsvEndpoint: '/api/admin/assets/download-sample-csv',
    uploadEndpoint: '/api/admin/assets/bulk-upload',
    sampleFileName: 'asset_bulk_upload_sample.csv',
    successMessageId: 'text.asset_bulk_upload_success',
    errorMessageId: 'text.asset_bulk_upload_failed',
    createdItemsKey: 'assets',
    createdItemNameKey: 'name',
    createdItemDisplayKey: 'name'
  };

  useEffect(() => {
    setAssets(Array.isArray(getData) ? getData : getData.content ?? []);
  }, [getData]);


  const clearForm = () => {
    setFormState({
      name: '',
      type: AssetType.DATABASE,
      databaseType: '',
      description: '',
      hostAddress: '',
      portNumber: '',
      databaseName: ''
    });
    setSelectedAsset(null);
    setIsEdit(false);
    setIsFormShow(false);
  };

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  const deleteAsset = (asset: Asset) => {
    setDeleteAssetId(asset.id ?? null);
    setIsDelDlgOpen(true);
  };

  // Lock/Unlock handlers
  const handleLockAsset = (asset: Asset) => {
    setLockDialogAsset(asset);
    setLockDialogAction(LockAction.LOCK);
    setIsLockDialogOpen(true);
  };

  const handleUnlockAsset = (asset: Asset) => {
    setLockDialogAsset(asset);
    setLockDialogAction(LockAction.UNLOCK);
    setIsLockDialogOpen(true);
  };

  const closeLockDialog = () => {
    if (!isLockLoading) {
      setIsLockDialogOpen(false);
      setLockDialogAsset(null);
      setLockDialogAction(LockAction.LOCK);
    }
  };

  const handleLockConfirm = async (asset: Asset, lockAction: LockAction, lockType: LockType) => {
    setIsLockLoading(true);
    
    try {
      // Defensive implementation - this is a critical operation
      if (!asset?.id) {
        throw new Error('Invalid asset selected');
      }

      const endpoint = lockDialogAction === LockAction.LOCK 
        ? `/api/admin/assets/${asset.id}/lockout`
        : `/api/admin/assets/${asset.id}/unlock`;

      const requestData = {
        lockAllUsers: lockAction == LockAction.LOCK && lockType == LockType.LOCK_ALL_DB_USERS
      };
      if (lockAction == LockAction.UNLOCK && asset.lockType == LockType.LOCK_ALL_DB_USERS) {
        requestData.lockAllUsers = true;
      }
      handleRequest(endpoint, 'POST', requestData, {
        onSuccess: () => {
          getAssetsList({});
          closeLockDialog();
        },
        successTitleId: lockDialogAction === LockAction.LOCK ? 'text.asset_locked' : 'text.asset_unlocked',
        successDescriptionId: lockDialogAction === LockAction.LOCK ? 'text.asset_lock_success' : 'text.asset_unlock_success',
        errorDescriptionId: lockDialogAction === LockAction.LOCK ? 'text.asset_lock_failed' : 'text.asset_unlock_failed'
      });
      
      
    } catch (error: any) {
      console.error(`${lockDialogAction} operation failed:`, error);
      showError({
        description: error.message ?? `Failed to ${lockDialogAction.toLowerCase()} asset access. Please try again.`
      });
    } finally {
      setIsLockLoading(false);
    }
  };

  // Remove old user management functions as we're using the modal approach
  // Manage users handlers
  const handleManageUsers = (asset: Asset, userType: 'owners' | 'approvers') => {
    setManageUsersAsset(asset);
    setManageUsersType(userType);
    setIsManageUsersModalOpen(true);
  };

  const closeManageUsersModal = () => {
    setIsManageUsersModalOpen(false);
    setManageUsersAsset(null);
    setManageUsersType('owners');
  };

  const handleUpdateUser = (user: User, method: 'Add' | 'Remove') => {
    if (!manageUsersAsset) return;
  
    setIsManageUsersLoading(true);
    request(`/api/admin/assets/${manageUsersAsset.id}/${manageUsersType}`, {
      method: 'POST',
      data: {
        userIds: [user.id],
        method,
      },
    })
      .then(() => {
        getAssetsList({});
        showSuccess({
          title: intl.formatMessage({ id: manageUsersType === 'owners' ? 'text.asset_owner_updated' : 'text.approver_updated' }),
          description: intl.formatMessage({ id: manageUsersType === 'owners' ? 'text.asset_owner_update_success' : 'text.approver_update_success' }),
        });
      })
      .catch((e) => {
        showError({
          description:
            e?.response?.data?.error ??
            intl.formatMessage({
              id:
                manageUsersType === 'owners'
                  ? 'text.asset_owner_update_failed'
                  : 'text.approver_update_failed',
            }),
        });
      })
      .finally(() => {
        setIsManageUsersLoading(false);
      });
  };
  
  const handleAddUser = (user: User) => handleUpdateUser(user, 'Add');
  const handleRemoveUser = (user: User) => handleUpdateUser(user, 'Remove');

  // Edit asset handlers
  const handleEditAsset = (asset: Asset) => {
    setEditAsset(asset);
    setIsEditAssetModalOpen(true);
  };

  const closeEditAssetModal = () => {
    setIsEditAssetModalOpen(false);
    setEditAsset(null);
  };

  const handleSaveAsset = (assetData: Partial<AssetDTO>) => {
    if (!editAsset) return;
    
    setIsEditAssetLoading(true);
    handleRequest(`/api/admin/assets/${editAsset.id}`, 'PUT', assetData, {
      onSuccess: () => {
        getAssetsList({});
        closeEditAssetModal();
        setIsEditAssetLoading(false);
      },
      onError: () => {
        setIsEditAssetLoading(false);
      },
      successTitleId: 'text.asset_updated',
      successDescriptionId: 'text.asset_update_success',
      errorDescriptionId: 'text.asset_update_failed'
    });
  };

  const closeAskDialog = () => {
    setDeleteAssetId(null);
    setIsDelDlgOpen(false);
  };

  const handleDelete = () => {
    if (!deleteAssetId) return;

    handleRequest(`/api/admin/assets/${deleteAssetId}`, 'DELETE', null, {
      onSuccess: () => {
        getAssetsList({});
        setSelectedAsset(null);
        closeAskDialog();
      },
      successTitleId: 'text.asset_deleted',
      successDescriptionId: 'text.asset_delete_success',
      errorDescriptionId: 'text.asset_delete_failed'
    });
  };

  const handleCreate = async () => {
    if (selectedAsset) return;


    handleRequest('/api/admin/assets', 'POST', formState, {
      onSuccess: () => {
        getAssetsList({});
        clearForm();
        setIsFormShow(false);
      },
      successTitleId: 'text.asset_created',
      successDescriptionId: 'text.asset_create_success',
      errorDescriptionId: 'text.asset_create_failed'
    });
  };


  // Remove getTabContent function as we're using the modal approach

  const getButtonMessageId = (isFormShow: boolean, isEdit: boolean): string => {
    if (isFormShow) {
      return isEdit ? "text.cancel_update" : "text.cancel_creation";
    }
    return isEdit ? "text.update" : "text.create";
  };

  return (
    <DamBasePage
      title={intl.formatMessage({ id: 'text.asset_management' })}
    >
      <Flex flexDir="column" w="full" px={0} pt={3}>
        <DamCard>
          <DamCardBody>
            <Flex alignItems={'center'} w='full' justifyContent={'end'} my={3}>
              <Button 
                id="btnBulkUploadAssets" 
                mr={2} 
                colorScheme="blue"
                onClick={onBulkUploadOpen}
              >
                <FormattedMessage id="text.bulk_upload" />
              </Button>
              <Button id="btnCreateAsset" mr={2} colorScheme={isFormShow ? "red" : "green"}
                onClick={() => {
                  if (!isFormShow) {
                    clearForm();
                    setSelectedAsset(null);
                  }
                  setIsFormShow(!isFormShow);
                  setFormState(prev => ({ ...prev, type: AssetType.DATABASE }));
                }}>
                <FormattedMessage
                  id={getButtonMessageId(isFormShow, isEdit)} />
              </Button>
            </Flex>
            {(isFormShow && !isEdit) && <DamCardDivider />}

            {isFormShow &&
              <Flex gap={4} my={4} ml={4} alignItems="center" id="flexAssetTypeForm">
                <Text mb={0}>
                  <FormattedMessage id="text.asset_type" />
                </Text>
                <Select
                  value={formState.type}
                  onChange={(e) => setFormState(prev => ({ ...prev, type: e.target.value as AssetType }))}
                  width="200px"
                  placeholder={intl.formatMessage({ id: 'text.select_asset_type' })}
                >
                  <option value={AssetType.DATABASE}>{AssetType.DATABASE}</option>
                </Select>

                {formState.type === AssetType.DATABASE && (
                  <Box>
                    <Select
                      value={formState.databaseType}
                      id="selectDBType"
                      onChange={(e) => setFormState(prev => ({ ...prev, databaseType: e.target.value as DatabaseType }))}
                      placeholder={intl.formatMessage({ id: 'text.select_db_type' })}
                    >
                      {Object.values(DatabaseType).map((type: DatabaseType) => (
                        <option className="dropdown-db-option" key={type} value={type}>{type}</option>
                      ))}
                    </Select>
                  </Box>
                )}
              </Flex>
            }
            {isFormShow && formState.type != '' && formState.databaseType != '' && (
              <Flex
                my={4}
                px={4}
                gap={4}
                w='full'
                flexDirection={'column'}
                id="flexAssetDetailForm">
                <Flex flexDirection={'row'} gap={4} w='full'>
                  <Input
                    value={formState.name}
                    onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                    id="inputAssetName"
                    placeholder={intl.formatMessage({ id: 'text.asset_name' })}
                  />
                  <Input
                    value={formState.hostAddress}
                    onChange={(e) => setFormState(prev => ({ ...prev, hostAddress: e.target.value }))}
                    id="inputHostAddress"
                    placeholder={intl.formatMessage({ id: 'text.host_address' })}
                  />
                  <Input
                    value={formState.portNumber}
                    onChange={(e) => setFormState(prev => ({ ...prev, portNumber: e.target.value }))}
                    id="inputPortNumber"
                    placeholder={intl.formatMessage({ id: 'text.port_number' })}
                  />
                  <Input
                    value={formState.databaseName}
                    onChange={(e) => setFormState(prev => ({ ...prev, databaseName: e.target.value }))}
                    id="inputDatabaseName"
                    placeholder={intl.formatMessage({ id: 'text.database_name' })}
                  />
                </Flex>
                <Flex flexDirection={'row'} gap={4} w='full'>
                  <Input
                    value={formState.description}
                    onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                    id="inputDescription"
                    placeholder={intl.formatMessage({ id: 'text.description' })}
                  />
                  <Flex justify="flex-end" gap={4}>
                    <Button
                      id="btnSaveAsset"
                      colorScheme="blue"
                      onClick={handleCreate}
                      disabled={!formState.name}
                    >
                      {intl.formatMessage({ id: 'text.save' })}
                    </Button>
                  </Flex>
                </Flex>
              </Flex>
            )}
          </DamCardBody>
        </DamCard>
            <AssetsTable
              assets={assets}
              selectedAsset={selectedAsset}
              onSelectAsset={handleSelectAsset}
              onDeleteAsset={deleteAsset}
          onEditAsset={handleEditAsset}
              onViewAccess={viewAssetAccess}
              onLockAsset={handleLockAsset}
              onUnlockAsset={handleUnlockAsset}
          onManageUsers={handleManageUsers}
        />
      </Flex>


      <DamAlertDialog
        isOpen={isDelDlgOpen}
        onClose={closeAskDialog}
        onConfirm={handleDelete}
        title="text.delete_asset"
        message="text.are_you_sure_del_asset"
        confirmButtonId="btnConfirmDeleteAsset"
      />
      <DamViewAccessModal
        isOpen={isViewAccessModalOpen}
        onClose={closeViewAccessModal}
        asset={viewAccessAsset}
        assetAccessData={assetAccessData}
        isLoading={isLoadingAccess}
        error={accessError}
      />
      <AssetLockDialog
        isOpen={isLockDialogOpen}
        onClose={closeLockDialog}
        asset={lockDialogAsset}
        action={lockDialogAction}
        onConfirm={handleLockConfirm}
        isLoading={isLockLoading}
      />
      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={onBulkUploadClose}
        onUploadSuccess={() => getAssetsList({})}
        config={assetBulkUploadConfig}
      />
      {(() => {
        // Extract users list based on management type
        const ownersData = Array.isArray(getAssetOwners) ? getAssetOwners : getAssetOwners.content ?? [];
        const approversData = Array.isArray(getApprovers) ? getApprovers : getApprovers.content ?? [];
        const availableUsers = manageUsersType === 'owners' ? ownersData : approversData;
        
        // Extract assigned users based on asset and management type
        const assetOwners = manageUsersAsset?.owners ?? [];
        const assetApprovers = manageUsersAsset?.approvers ?? [];
        const selectedAssignedUsers = manageUsersType === 'owners' ? assetOwners : assetApprovers;
        const currentAssignedUsers = manageUsersAsset ? selectedAssignedUsers : [];

        return (
          <ManageUsersModal
            isOpen={isManageUsersModalOpen}
            onClose={closeManageUsersModal}
            asset={manageUsersAsset}
            users={availableUsers}
            assignedUsers={currentAssignedUsers}
            userType={manageUsersType}
            onAddUser={handleAddUser}
            onRemoveUser={handleRemoveUser}
            isLoading={isManageUsersLoading}
          />
        );
      })()}
      <EditAssetModal
        isOpen={isEditAssetModalOpen}
        onClose={closeEditAssetModal}
        asset={editAsset}
        onSave={handleSaveAsset}
        isLoading={isEditAssetLoading}
      />
    </DamBasePage>
  );
} 