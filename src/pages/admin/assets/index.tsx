import {
  Box, Button, Flex, Input, Text, Select, Table, TableContainer, Tbody, Td, Th, Thead, Tr,
  Checkbox,
  IconButton
} from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { DamCard, DamCardBody, DamCardDivider, DamContent, request, stateActions, TextCardHeader, useListPage, useDamToast } from "@common/index";
import { Asset } from "@models/Asset";
import { User } from "@models/User";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { AssetType, DatabaseType, USER_ROLE } from "@/constants/enums";
import { DamAlertDialog } from "@common/components/DamAlert/DamAlertDialog";
import { useApiRequest } from "@common/hooks/useApiRequest";
import { CloseIcon, SearchIcon } from "@chakra-ui/icons";

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
  const [isSearchShow, setIsSearchShow] = useState(false);
  const [deleteAssetId, setDeleteAssetId] = useState<number | null>(null);
  const [userSearchCriteria, setUserSearchCriteria] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState<AssetType | ''>('');
  const [databaseType, setDatabaseType] = useState<DatabaseType | ''>('');
  const [description, setDescription] = useState('');
  const [hostAddress, setHostAddress] = useState('');

  const { getData, getList: getAssetsList } = useListPage<Asset>({
    baseUri: "/api/admin/assets",
    defaultParams: {},
    usePagination: false
  });

  // Use useListPage for resource owners
  const { getData: getResourceOwners, getList: getResourceOwnersList } = useListPage<User>({
    baseUri: '/api/admin/users',
    defaultParams: {
      roles: [USER_ROLE.RESOURCE_OWNER, USER_ROLE.ADMIN]
    },
    usePagination: false
  });

  const { handleRequest } = useApiRequest();

  useEffect(() => {
    setAssets(Array.isArray(getData) ? getData : getData.content || []);
  }, [getData]);


  const clearForm = () => {
    setName('');
    setAssetType('');
    setDatabaseType('');
    setDescription('');
    setHostAddress('');
    setSelectedAsset(null);
    setIsEdit(false);
  };

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setName(asset.name);
    setAssetType(asset.type);
    setDatabaseType(asset.databaseType ?? '');
    setDescription(asset.description);
    setHostAddress(asset.hostAddress);
    setIsEdit(true);
  };

  const deleteAsset = (asset: Asset) => {
    setDeleteAssetId(asset.id);
    setIsDelDlgOpen(true);
  }

  const checkResourceOwner = (user: User) => {
    if (!selectedAsset) return false;
    return selectedAsset.owners?.some(owner => owner.id === user.id);
  };

  const refreshOwners = (user: User, isOwner: boolean, isSuccess: boolean) => {
    getResourceOwnersList({ roles: [USER_ROLE.RESOURCE_OWNER, USER_ROLE.ADMIN] });
    getAssetsList({});
    if (isSuccess) {
      let tmpAsset = selectedAsset;
      if (selectedAsset?.owners) {
        if (isOwner) {
          selectedAsset.owners.push(user);
        } else {
          selectedAsset.owners = selectedAsset.owners.filter(owner => owner.id !== user.id);
        }
      }
      setSelectedAsset(tmpAsset);
    }

  }
  const updateResourceOwner = (user: User, isOwner: boolean) => {
    if (!selectedAsset) return;
    stateActions.addLoading();
    request(`/api/admin/assets/${selectedAsset.id}/owners`, {
      method: 'POST',
      data: {
        userIds: [user.id],
        method: isOwner ? 'Add' : 'Remove'
      }
    })
      .then(() => {
        refreshOwners(user, isOwner, true);
        showSuccess({
          id: 'toastSuccess',
          title: intl.formatMessage({ id: 'text.resource_owner_updated' }),
          description: intl.formatMessage({ id: 'text.resource_owner_update_success' })
        });
      })
      .catch((e) => {
        refreshOwners(user, isOwner, false);
        showError({
          id: 'toastError',
          description: e?.response?.data?.error ?? intl.formatMessage({ id: 'text.resource_owner_update_failed' })
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

    const assetData = {
      name,
      type: assetType,
      databaseType: assetType === AssetType.DATABASE ? databaseType : undefined,
      description,
      hostAddress
    };

    handleRequest('/api/admin/assets', 'POST', assetData, {
      onSuccess: () => {
        getAssetsList({});
        clearForm();
      },
      successTitleId: 'text.asset_created',
      successDescriptionId: 'text.asset_create_success',
      errorDescriptionId: 'text.asset_create_failed'
    });
  };

  const handleUpdate = async () => {
    if (!selectedAsset) return;

    const assetData = {
      name,
      type: assetType,
      databaseType: assetType === AssetType.DATABASE ? databaseType : undefined,
      description,
      hostAddress
    };

    handleRequest(`/api/admin/assets/${selectedAsset.id}`, 'PUT', assetData, {
      onSuccess: () => {
        getAssetsList({});
        clearForm();
      },
      successTitleId: 'text.asset_updated',
      successDescriptionId: 'text.asset_update_success',
      errorDescriptionId: 'text.asset_update_failed'
    });
  };

  const resourceOwners = Array.isArray(getResourceOwners) ? getResourceOwners : getResourceOwners.content;

  const checkUserCriteria = (user: User) => {
    if (!userSearchCriteria) return true;
    return user.firstName.toLowerCase().indexOf(userSearchCriteria.toLowerCase()) != -1 ||
      user.lastName.toLowerCase().indexOf(userSearchCriteria.toLowerCase()) != -1 ||
      user.email.toLowerCase().indexOf(userSearchCriteria.toLowerCase()) != -1;
  }

  return (
    <DamContent w="98%">
      <DamBasePage
        title={intl.formatMessage({ id: 'text.asset_management' })}
        backTitle={intl.formatMessage({ id: 'text.dashboard' })}
        backURI="/"
      >
        <Flex flexDir="column" w="full" px={0} pt={3}>
          <DamCard>
            <DamCardBody pb={4}>
              <Flex alignItems={'center'} w='full' justifyContent={'space-between'}>
                <TextCardHeader id="lblAssetSetting" mb={0}>
                  <FormattedMessage id="text.asset_setting" />
                </TextCardHeader>
                <Button id="btnCreateAsset" mr={2} colorScheme={isFormShow ? "red" : "green"} onClick={() => {
                  setIsFormShow(!isFormShow);
                  clearForm();
                  setAssetType(AssetType.DATABASE);
                }}>
                  <FormattedMessage id={isFormShow ? "text.cancel_creation" : "text.create"} />
                </Button>
              </Flex>
              <DamCardDivider />

              {isFormShow &&
                <Flex gap={4} mt={4} ml={4} alignItems="center" id="flexAssetTypeForm">
                  <Text mb={0}>
                    <FormattedMessage id="text.asset_type" />
                  </Text>
                  <Select
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value as AssetType)}
                    width="200px"
                    placeholder={intl.formatMessage({ id: 'text.select_asset_type' })}
                  >
                    <option value={AssetType.DATABASE}>{AssetType.DATABASE}</option>
                  </Select>

                  {assetType === AssetType.DATABASE && (
                    <Box>

                      <Select
                        value={databaseType}
                        id="selectDBType"
                        onChange={(e) => setDatabaseType(e.target.value as DatabaseType)}
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
              {isFormShow && assetType != '' && databaseType != '' && (
                <Flex mt={4} ml={4} flexDirection={'row'} gap={4} id="flexAssetDetailForm">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    id="inputAssetName"
                    placeholder={intl.formatMessage({ id: 'text.asset_name' })}
                  />
                  <Input
                    value={hostAddress}
                    onChange={(e) => setHostAddress(e.target.value)}
                    id="inputHostAddress"
                    placeholder={intl.formatMessage({ id: 'text.host_address' })}
                  />
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    id="inputDescription"
                    placeholder={intl.formatMessage({ id: 'text.description' })}
                  />
                  <Flex justify="flex-end" gap={4}>
                    <Button
                      id="btnSaveAsset"
                      colorScheme={isEdit ? "green" : "blue"}
                      onClick={isEdit ? handleUpdate : handleCreate}
                      disabled={!name}
                    >
                      {intl.formatMessage({ id: 'text.save' })}
                    </Button>
                    {isEdit && (
                      <Button id="btnClearAsset" onClick={clearForm}>
                        <FormattedMessage id='text.clear' />
                      </Button>
                    )}
                  </Flex>
                </Flex>
              )}
            </DamCardBody>
          </DamCard>
          <Flex flexDirection={'row'}
            gap={'2%'}
            flexWrap="wrap">
            <Flex w={{ base: "full", sm: "full", md: "49%", lg: "59%" }}>
              <DamCard mt={4}>
                <DamCardBody>
                  <TextCardHeader mb={0}>
                    <FormattedMessage id="text.assets" />
                  </TextCardHeader>
                  <DamCardDivider />

                  <TableContainer width='100%'>
                    <Table variant='simple' id="tblAssets">
                      <Thead>
                        <Tr>
                          <Th><FormattedMessage id='text.name' /></Th>
                          <Th><FormattedMessage id='text.type' /></Th>
                          <Th><FormattedMessage id='text.database_type' /></Th>
                          <Th><FormattedMessage id='text.host_address' /></Th>
                          <Th><FormattedMessage id='text.description' /></Th>
                          <Th><FormattedMessage id='text.actions' /></Th>
                        </Tr>
                      </Thead>
                      <Tbody maxHeight={500}>
                        {assets.length > 0 ? (
                          <>
                            {assets.map((asset) => (
                              <Tr key={asset.id}
                                backgroundColor={asset.id === selectedAsset?.id ? 'gray.80' : 'transparent'}
                                onClick={() => handleSelectAsset(asset)}>
                                <Td>{asset.name}</Td>
                                <Td>{asset.type}</Td>
                                <Td>{asset.databaseType || '-'}</Td>
                                <Td>{asset.hostAddress}</Td>
                                <Td>{asset.description}</Td>
                                <Td>
                                  <Flex gap={2}>
                                    <Button
                                      size="sm"
                                      colorScheme="red"
                                      onClick={() => deleteAsset(asset)}
                                    >
                                      <FormattedMessage id="text.delete" />
                                    </Button>
                                  </Flex>
                                </Td>
                              </Tr>
                            ))}
                          </>
                        ) : (
                          <Tr>
                            <Td colSpan={6} textAlign={'center'}>
                              <FormattedMessage id="text.no_assets" />
                            </Td>
                          </Tr>
                        )}

                      </Tbody>
                    </Table>
                  </TableContainer>
                </DamCardBody>
              </DamCard>
            </Flex>
            <Flex w={{ base: "full", sm: "full", md: "49%", lg: "39%" }}>
              <DamCard mt={4} flex={1}>
                <DamCardBody>
                  <Flex justifyContent={'space-between'} alignItems={'center'} w='full'>
                    {!isSearchShow && <TextCardHeader mb={0}>
                      <FormattedMessage id="text.resource_owner_users" />
                    </TextCardHeader>}
                    {isSearchShow && <Input
                      m={1}
                      flex={1}
                      onChange={(e) => setUserSearchCriteria(e.target.value)}
                      placeholder="Search User..."
                    />}
                    <IconButton
                      aria-label="First page"
                      icon={isSearchShow ? <CloseIcon /> : <SearchIcon />}
                      onClick={() => {
                        setUserSearchCriteria('');
                        setIsSearchShow(!isSearchShow);
                      }}
                      size="sm"
                      mr={2}
                    />
                  </Flex>

                  <DamCardDivider />

                  <TableContainer width='100%'>
                    <Table variant='simple' id="tblAssetOwners">
                      <Thead>
                        <Tr>
                          <Th><FormattedMessage id='text.status' /></Th>
                          <Th><FormattedMessage id='text.first_name' /></Th>
                          <Th><FormattedMessage id='text.last_name' /></Th>
                          <Th><FormattedMessage id='text.email' /></Th>
                        </Tr>
                      </Thead>
                      <Tbody maxHeight={500}>
                        {resourceOwners.length > 0 ? (
                          <>
                            {resourceOwners.map((user: User) => (
                              checkUserCriteria(user) && <Tr key={user.id}>
                                <Td>
                                  <Flex gap={2}>
                                    <Checkbox
                                      disabled={selectedAsset == null || !isFormShow}
                                      isChecked={checkResourceOwner(user)}
                                      onChange={(e) => { updateResourceOwner(user, e.target.checked) }}
                                    />
                                  </Flex>
                                </Td>
                                <Td>{user.firstName}</Td>
                                <Td>{user.lastName}</Td>
                                <Td>{user.email}</Td>
                              </Tr>
                            ))}
                          </>
                        ) : (
                          <Tr>
                            <Td colSpan={6} textAlign={'center'}>
                              <FormattedMessage id="text.no_resource_owners" />
                            </Td>
                          </Tr>
                        )}

                      </Tbody>
                    </Table>
                  </TableContainer>
                </DamCardBody>
              </DamCard>
            </Flex>
          </Flex>
        </Flex>
      </DamBasePage>

      <DamAlertDialog
        isOpen={isDelDlgOpen}
        onClose={closeAskDialog}
        onConfirm={handleDelete}
        title="text.delete_asset"
        message="text.are_you_sure_del_asset"
        confirmButtonId="btnConfirmDeleteAsset"
      />
    </DamContent>
  );
} 