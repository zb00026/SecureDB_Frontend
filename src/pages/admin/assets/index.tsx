import {
  Box, Button, Flex, Input, Select,
  useDisclosure, FormControl, FormLabel, HStack, useBreakpointValue
} from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { DamCard, DamCardBody, DamCardDivider, request, useListPage, useDamToast, BulkUploadModal, BulkUploadConfig } from "@common/index";
import { Asset } from "@models/assets/Asset";
import { AssetDTO } from "@models/assets/AssetDTO";
import { User } from "@models/User";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { AssetType, DatabaseType, UnixServerType, USER_ROLE, FEATURE_FLAGS } from "@/constants/enums";
import { DamAlertDialog } from "@common/components/DamDialog/DamAlertDialog";
import { useApiRequest } from "@common/hooks/useApiRequest";
import { AssetsTable } from "./components/assets_table";
import { AssetLockDialog, LockAction } from "@common/components/DamDialog";
import { ManageUsersModal } from "./components/manage_users_modal";
import { EditAssetModal } from "./components/edit_asset_modal";

export const isSearchable = true;
export const displayName = 'Assets Management Page';
export function Component() {
  const intl = useIntl();
  const { showSuccess, showError } = useDamToast();
  const isHorizontal = useBreakpointValue({ base: false, lg: true });
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

  // Asset owner selection modal states (using ManageUsersModal for consistency)
  const [isAssetOwnerModalOpen, setIsAssetOwnerModalOpen] = useState(false);
  const [isCreatingAsset, setIsCreatingAsset] = useState(false);
  const [selectedOwnersForCreate, setSelectedOwnersForCreate] = useState<User[]>([]);

  // Bulk upload state
  const { isOpen: isBulkUploadOpen, onOpen: onBulkUploadOpen, onClose: onBulkUploadClose } = useDisclosure();

  // Form states for create asset
  const [formState, setFormState] = useState<Partial<AssetDTO>>({
    name: '',
    type: '' as AssetType | '',
    databaseType: null,
    unixServerType: null,
    description: '',
    hostAddress: '',
    portNumber: '',
    databaseName: '',
    hostUrl: ''
  });

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
      databaseType: null,
      unixServerType: null,
      description: '',
      hostAddress: '',
      portNumber: '',
      databaseName: '',
      hostUrl: ''
    });
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

  const handleLockConfirm = async (asset: Asset, lockAction: LockAction) => {
    setIsLockLoading(true);

    try {
      // Defensive implementation - this is a critical operation
      if (!asset?.id) {
        throw new Error('Invalid asset selected');
      }

      const endpoint = lockDialogAction === LockAction.LOCK
        ? `/api/admin/assets/${asset.id}/lockout`
        : `/api/admin/assets/${asset.id}/unlock`;

      handleRequest(endpoint, 'POST', {}, {
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
    // Only allow 'approvers' type if feature flag is enabled
    if (!FEATURE_FLAGS.ENABLE_APPROVER_ROLE && userType === 'approvers') return;
    setManageUsersType(userType);
    setIsManageUsersModalOpen(true);
  };

  const closeManageUsersModal = () => {
    setIsManageUsersModalOpen(false);
    setManageUsersAsset(null);
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
          title: intl.formatMessage({ id: 'text.asset_owner_updated' }),
          description: intl.formatMessage({ id: 'text.asset_owner_update_success' }),
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
    // Instead of directly creating the asset, show the manage users modal for owner selection
    setIsCreatingAsset(false); // Ensure loading state is reset when opening modal
    setSelectedOwnersForCreate([]); // Reset selected owners
    setIsAssetOwnerModalOpen(true);
  };

  // Helper function to show asset owner instructions
  const showAssetOwnerInstructions = (owners: User[]) => {
    const ownerNames = owners.map(owner => `${owner.firstName} ${owner.lastName}`).join(', ');
    showSuccess({
      title: intl.formatMessage({ id: 'text.asset_owner_instructions' }),
      description: intl.formatMessage(
        { id: 'text.asset_owner_credentials_required' },
        { owners: ownerNames }
      )
    });
  };

  // Helper function to handle successful asset creation
  const handleAssetCreationSuccess = (owners: User[]) => {
    getAssetsList({});
    clearForm();
    setIsFormShow(false);
    setIsAssetOwnerModalOpen(false);
    setIsCreatingAsset(false);
    setSelectedOwnersForCreate([]); // Reset selected owners

    // Show success message with instructions for asset owners
    showSuccess({
      title: intl.formatMessage({ id: 'text.asset_created' }),
      description: intl.formatMessage(
        { id: 'text.asset_created_success_message' },
        { assetName: formState.name }
      )
    });

    // Show additional message about asset owner instructions
    setTimeout(() => showAssetOwnerInstructions(owners), 2000);
  };

  const handleAssetOwnerSelection = async () => {
    if (selectedOwnersForCreate.length === 0) {
      showError({
        description: intl.formatMessage({ id: 'text.asset_owner_selection_required' })
      });
      return;
    }

    setIsCreatingAsset(true);

    // Create the asset with the selected owners
    // For MongoDB, construct connection string from hostAddress and portNumber
    const assetData: any = {
      ...formState,
      owners: selectedOwnersForCreate
    };

    // For MongoDB, construct connection string from host and port
    if (formState.databaseType === DatabaseType.MONGODB) {
      const host = formState.hostAddress?.trim() || 'localhost';
      const port = formState.portNumber?.trim() || '27017';
      assetData.hostUrl = `mongodb://${host}:${port}`;
      // Keep hostAddress and portNumber for display, but backend will use hostUrl
    } else {
      // For other DB types, ensure hostUrl is not sent
      delete assetData.hostUrl;
    }

    handleRequest('/api/admin/assets', 'POST', assetData, {
      onSuccess: () => handleAssetCreationSuccess(selectedOwnersForCreate),
      onError: () => {
        setIsCreatingAsset(false);
      },
      errorDescriptionId: 'text.asset_create_failed'
    });
  };

  // Handlers for ManageUsersModal when creating asset
  const handleAddOwnerForCreate = (user: User) => {
    setSelectedOwnersForCreate(prev => [...prev, user]);
  };

  const handleRemoveOwnerForCreate = (user: User) => {
    setSelectedOwnersForCreate(prev => prev.filter(u => u.id !== user.id));
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
              <Flex gap={4} my={4} ml={4} alignItems="flex-end" id="flexAssetTypeForm" wrap="wrap">
                {isHorizontal ? (
                  <FormControl width="auto">
                    <HStack spacing={2} align="center">
                      <FormLabel mb={0} minW="120px" flexShrink={0}>
                        <FormattedMessage id="text.asset_type" />
                      </FormLabel>
                      <Box>
                        <Select
                          value={formState.type}
                          onChange={(e) => setFormState(prev => ({ ...prev, type: e.target.value as AssetType }))}
                          width="200px"
                        >
                          <option value="">{intl.formatMessage({ id: 'text.select_asset_type' })}</option>
                          <option value={AssetType.DATABASE}>{AssetType.DATABASE}</option>
                          <option value={AssetType.UNIX_SERVER}>{AssetType.UNIX_SERVER}</option>
                        </Select>
                      </Box>
                    </HStack>
                  </FormControl>
                ) : (
                  <FormControl width="200px">
                    <FormLabel mb={1}>
                      <FormattedMessage id="text.asset_type" />
                    </FormLabel>
                    <Select
                      value={formState.type}
                      onChange={(e) => setFormState(prev => ({ ...prev, type: e.target.value as AssetType }))}
                      width="200px"
                    >
                      <option value="">{intl.formatMessage({ id: 'text.select_asset_type' })}</option>
                      <option value={AssetType.DATABASE}>{AssetType.DATABASE}</option>
                      <option value={AssetType.UNIX_SERVER}>{AssetType.UNIX_SERVER}</option>
                    </Select>
                  </FormControl>
                )}

                {formState.type === AssetType.DATABASE && (
                  isHorizontal ? (
                    <FormControl width="auto">
                      <HStack spacing={2} align="center">
                        <FormLabel mb={0} minW="120px" flexShrink={0}>
                          <FormattedMessage id="text.database_type" />
                        </FormLabel>
                        <Box>
                          <Select
                            value={formState.databaseType || ''}
                            id="selectDBType"
                            onChange={(e) => setFormState(prev => ({ ...prev, databaseType: e.target.value as DatabaseType }))}
                            width="200px"
                          >
                            <option value="">{intl.formatMessage({ id: 'text.select_db_type' })}</option>
                            {Object.values(DatabaseType).map((type: DatabaseType) => (
                              <option className="dropdown-db-option" key={type} value={type}>{type}</option>
                            ))}
                          </Select>
                        </Box>
                      </HStack>
                    </FormControl>
                  ) : (
                    <FormControl>
                      <FormLabel mb={1}>
                        <FormattedMessage id="text.database_type" />
                      </FormLabel>
                      <Select
                        value={formState.databaseType || ''}
                        id="selectDBType"
                        onChange={(e) => setFormState(prev => ({ ...prev, databaseType: e.target.value as DatabaseType }))}
                      >
                        <option value="">{intl.formatMessage({ id: 'text.select_db_type' })}</option>
                        {Object.values(DatabaseType).map((type: DatabaseType) => (
                          <option className="dropdown-db-option" key={type} value={type}>{type}</option>
                        ))}
                      </Select>
                    </FormControl>
                  )
                )}

                {formState.type === AssetType.UNIX_SERVER && (
                  isHorizontal ? (
                    <FormControl width="auto">
                      <HStack spacing={2} align="center">
                        <FormLabel mb={0} minW="120px" flexShrink={0}>
                          <FormattedMessage id="text.unix_server_type" />
                        </FormLabel>
                        <Box>
                          <Select
                            value={formState.unixServerType || ''}
                            id="selectUnixServerType"
                            onChange={(e) => setFormState(prev => ({ ...prev, unixServerType: e.target.value as UnixServerType }))}
                            width="200px"
                          >
                            <option value="">{intl.formatMessage({ id: 'text.select_unix_server_type' })}</option>
                            {Object.values(UnixServerType).map((type: UnixServerType) => (
                              <option className="dropdown-unix-option" key={type} value={type}>{type}</option>
                            ))}
                          </Select>
                        </Box>
                      </HStack>
                    </FormControl>
                  ) : (
                    <FormControl>
                      <FormLabel mb={1}>
                        <FormattedMessage id="text.unix_server_type" />
                      </FormLabel>
                      <Select
                        value={formState.unixServerType || ''}
                        id="selectUnixServerType"
                        onChange={(e) => setFormState(prev => ({ ...prev, unixServerType: e.target.value as UnixServerType }))}
                      >
                        <option value="">{intl.formatMessage({ id: 'text.select_unix_server_type' })}</option>
                        {Object.values(UnixServerType).map((type: UnixServerType) => (
                          <option className="dropdown-unix-option" key={type} value={type}>{type}</option>
                        ))}
                      </Select>
                    </FormControl>
                  )
                )}
              </Flex>
            }
            {isFormShow && formState.type != '' && (formState.databaseType != null || formState.unixServerType != null) && (
              <Flex
                my={4}
                px={4}
                gap={4}
                w='full'
                flexDirection={'column'}
                id="flexAssetDetailForm">
                <Flex flexDirection={'row'} gap={4} w='full'>
                  <FormControl w='full'>
                    <FormLabel mb={1}>
                      <FormattedMessage id="text.asset_name" />
                    </FormLabel>
                    <Input
                      value={formState.name}
                      onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                      id="inputAssetName"
                    />
                  </FormControl>
                  <FormControl w='full'>
                    <FormLabel mb={1}>
                      <FormattedMessage id="text.host_address" />
                    </FormLabel>
                    <Input
                      value={formState.hostAddress}
                      onChange={(e) => setFormState(prev => ({ ...prev, hostAddress: e.target.value }))}
                      id="inputHostAddress"
                      placeholder={formState.databaseType === DatabaseType.MONGODB ? "localhost" : ""}
                    />
                  </FormControl>
                  <FormControl w='full'>
                    <FormLabel mb={1}>
                      <FormattedMessage id="text.port_number" />
                    </FormLabel>
                    <Input
                      value={formState.portNumber}
                      onChange={(e) => setFormState(prev => ({ ...prev, portNumber: e.target.value }))}
                      id="inputPortNumber"
                      placeholder={formState.databaseType === DatabaseType.MONGODB ? "27017" : ""}
                    />
                  </FormControl>
                  {formState.type === AssetType.DATABASE && (
                    <FormControl w='full'>
                      <FormLabel mb={1}>
                        <FormattedMessage id="text.database_name" />
                      </FormLabel>
                      <Input
                        value={formState.databaseName}
                        onChange={(e) => setFormState(prev => ({ ...prev, databaseName: e.target.value }))}
                        id="inputDatabaseName"
                        placeholder={formState.databaseType === DatabaseType.MONGODB ? "Optional: default database name" : ""}
                      />
                    </FormControl>
                  )}
                </Flex>
                <Flex flexDirection={'row'} gap={4} w='full' alignItems="flex-end">
                  <FormControl w='full'>
                    <FormLabel mb={1}>
                      <FormattedMessage id="text.description" />
                    </FormLabel>
                    <Input
                      value={formState.description}
                      onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                      id="inputDescription"
                    />
                  </FormControl>
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
        
        let approversData: any[] = [];
        if (FEATURE_FLAGS.ENABLE_APPROVER_ROLE) {
          if (Array.isArray(getApprovers)) {
            approversData = getApprovers;
          } else if (getApprovers && 'content' in getApprovers) {
            approversData = getApprovers.content ?? [];
          } else {
            approversData = [];
          }
        }
        
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
      <ManageUsersModal
        isOpen={isAssetOwnerModalOpen}
        onClose={() => {
          setIsAssetOwnerModalOpen(false);
          setIsCreatingAsset(false);
          setSelectedOwnersForCreate([]);
        }}
        asset={null}
        users={Array.isArray(getAssetOwners) ? getAssetOwners : getAssetOwners?.content || []}
        assignedUsers={selectedOwnersForCreate}
        userType="owners"
        onAddUser={handleAddOwnerForCreate}
        onRemoveUser={handleRemoveOwnerForCreate}
        isLoading={isCreatingAsset}
        onCreateAsset={handleAssetOwnerSelection}
        createButtonTextId="text.create_asset_with_owners"
      />
    </DamBasePage>
  );
} 