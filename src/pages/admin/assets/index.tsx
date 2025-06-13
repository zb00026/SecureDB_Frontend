import {
  Box, Button, Flex, Input, Text, Select,
  Tabs,
  Tab,
  TabList,
  TabPanel,
  TabPanels
} from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { DamCard, DamCardBody, DamCardDivider, request, stateActions, useListPage, useDamToast } from "@common/index";
import { Asset } from "@models/assets/Asset";
import { User } from "@models/User";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { AssetType, DatabaseType, USER_ROLE } from "@/constants/enums";
import { DamAlertDialog } from "@common/components/DamDialog/DamAlertDialog";
import { useApiRequest } from "@common/hooks/useApiRequest";
import { FilteredUsers } from "./components/filtered_users";
import { AssetsTable } from "./components/assets_table";
import { DamViewAccessModal } from "@common/components/DamDialog/DamViewAccessModal";
import { useViewAccess } from "@common/hooks/useViewAccess";

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

  // Form states
  const [formState, setFormState] = useState({
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

  const UsersTabs = [
    {
      title: intl.formatMessage({ id: 'text.asset_owner_users' }),
      key: 'owners'
    },
    {
      title: intl.formatMessage({ id: 'text.approver_users' }),
      key: 'approvers'
    }
  ]

  const { getData, getList: getAssetsList } = useListPage<Asset>({
    baseUri: "/api/admin/assets",
    defaultParams: {},
    usePagination: false
  });

  // Use useListPage for asset owners
  const { getData: getAssetOwners, getList: getAssetOwnersList } = useListPage<User>({
    baseUri: '/api/admin/users',
    defaultParams: {
      roles: [USER_ROLE.ASSET_OWNER, USER_ROLE.ADMIN]
    },
    usePagination: false
  });

  // Use useListPage for asset owners
  const { getData: getApprovers, getList: getApproversList } = useListPage<User>({
    baseUri: '/api/admin/users',
    defaultParams: {
      roles: [USER_ROLE.APPROVER]
    },
    usePagination: false
  });

  const { handleRequest } = useApiRequest();

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
    setFormState({
      name: asset.name,
      type: asset.type,
      databaseType: asset.databaseType ?? '',
      description: asset.description,
      hostAddress: asset.hostAddress,
      portNumber: asset.portNumber,
      databaseName: asset.databaseName
    });
    setIsEdit(true);
    setIsFormShow(true);
  };

  const deleteAsset = (asset: Asset) => {
    setDeleteAssetId(asset.id ?? null);
    setIsDelDlgOpen(true);
  }

  const checkAssetOwner = (user: User) => {
    if (!selectedAsset) return false;
    return selectedAsset.owners?.some(owner => owner.id === user.id);
  };

  const checkApprover = (user: User) => {
    if (!selectedAsset) return false;
    return selectedAsset.approvers?.some(approver => approver.id === user.id);
  };

  const updateUserList = (userRoleKey: string) => {
    const roleMap = {
      'owners': { roles: [USER_ROLE.ASSET_OWNER, USER_ROLE.ADMIN], getter: getAssetOwnersList },
      'approvers': { roles: [USER_ROLE.APPROVER], getter: getApproversList }
    };

    const config = roleMap[userRoleKey as keyof typeof roleMap];
    if (config) {
      config.getter({ roles: config.roles });
    }
  };

  const updateAssetUsers = (userRoleKey: string, user: User, isOwner: boolean, isSuccess: boolean) => {
    if (!selectedAsset || !isSuccess) return;

    const userListKey = userRoleKey === 'owners' ? 'owners' : 'approvers';
    const userList = selectedAsset[userListKey];

    if (!userList) return;

    if (isOwner) {
      userList.push(user);
    } else {
      selectedAsset[userListKey] = userList.filter(u => u.id !== user.id);
    }
  };

  const refreshOwners = (user: User, isOwner: boolean, isSuccess: boolean, userRoleKey: string) => {
    updateUserList(userRoleKey);
    getAssetsList({});
    if (isSuccess) {
      updateAssetUsers(userRoleKey, user, isOwner, isSuccess);
    }
  }
  const updateAssetUser = (user: User, isOwner: boolean, userRoleKey: string) => {
    if (!selectedAsset) return;
    stateActions.addLoading();
    request(`/api/admin/assets/${selectedAsset.id}/${userRoleKey}`, {
      method: 'POST',
      data: {
        userIds: [user.id],
        method: isOwner ? 'Add' : 'Remove'
      }
    })
      .then(() => {
        refreshOwners(user, isOwner, true, userRoleKey);
        showSuccess({
          title: intl.formatMessage({ id: userRoleKey == 'owners' ? 'text.asset_owner_updated' : 'text.approver_updated' }),
          description: intl.formatMessage({ id: userRoleKey == 'owners' ? 'text.asset_owner_update_success' : 'text.approver_update_success' })
        });
      })
      .catch((e) => {
        refreshOwners(user, isOwner, false, userRoleKey);
        showError({
          description: e?.response?.data?.error ?? intl.formatMessage({ id: userRoleKey == 'owners' ? 'text.asset_owner_update_failed' : 'text.approver_update_failed' })
        });
      });
  }

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

  const handleUpdate = async () => {
    if (!selectedAsset) return;

    handleRequest(`/api/admin/assets/${selectedAsset.id}`, 'PUT', formState, {
      onSuccess: () => {
        getAssetsList({});
        clearForm();
      },
      successTitleId: 'text.asset_updated',
      successDescriptionId: 'text.asset_update_success',
      errorDescriptionId: 'text.asset_update_failed'
    });
  };

  const getTabContent = (key: string) => {
    const userData = key === 'owners' ? getAssetOwners : getApprovers;
    const users = Array.isArray(userData) ? userData : userData.content ?? [];
    const checkFunction = key === 'owners' ? checkAssetOwner : checkApprover;
    const titleMessageId = key === 'owners' ? 'text.asset_owner_users' : 'text.approver_users';
    const noDataMessageId = key === 'owners' ? 'text.no_asset_owners' : 'text.no_approver_users';

    return (
      <FilteredUsers
        users={users}
        selectedAsset={selectedAsset}
        isFormShow={isFormShow}
        checkAvailability={checkFunction}
        updateAvailability={(user: User, checked: boolean, filterKey: string) => updateAssetUser(user, checked, key)}
        titleMessageId={titleMessageId}
        noDataMessageId={noDataMessageId}
        filterKey={key}
      />
    );
  };

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
            {!isEdit && <Flex alignItems={'center'} w='full' justifyContent={'end'} my={3}>
              <Button id="btnCreateAsset" mr={2} colorScheme={isFormShow ? "red" : "green"}
                onClick={() => {
                  setIsFormShow(!isFormShow);
                  setFormState(prev => ({ ...prev, type: AssetType.DATABASE }));
                }}>
                <FormattedMessage
                  id={getButtonMessageId(isFormShow, isEdit)} />
              </Button>
            </Flex>}
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
                      colorScheme={isEdit ? "green" : "blue"}
                      onClick={isEdit ? handleUpdate : handleCreate}
                      disabled={!formState.name}
                    >
                      {intl.formatMessage({ id: 'text.save' })}
                    </Button>
                    {isEdit && (
                      <Button id="btnClearAsset" onClick={clearForm} colorScheme="red">
                        <FormattedMessage id='text.cancel_update' />
                      </Button>
                    )}
                  </Flex>
                </Flex>
              </Flex>
            )}
          </DamCardBody>
        </DamCard>
        <Flex flexDirection={'row'}
          gap={'2%'}
          flexWrap="wrap">
          <Flex w={{ base: "full", sm: "full", md: "49%", lg: "59%" }}>
            <AssetsTable
              assets={assets}
              selectedAsset={selectedAsset}
              onSelectAsset={handleSelectAsset}
              onDeleteAsset={deleteAsset}
              onViewAccess={viewAssetAccess}
            />
          </Flex>
          <Flex w={{ base: "full", sm: "full", md: "49%", lg: "39%" }}>
            <Tabs w='full'>
              <TabList>
                {UsersTabs.map((tab) => (
                  <Tab key={tab.key}>
                    {tab.title}
                  </Tab>
                ))}
              </TabList>
              <TabPanels>
                {UsersTabs.map((tab) => (
                  <TabPanel key={tab.key} p={0}>
                    {getTabContent(tab.key)}
                  </TabPanel>
                ))}
              </TabPanels>
            </Tabs>
          </Flex>
        </Flex>
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
    </DamBasePage>
  );
} 