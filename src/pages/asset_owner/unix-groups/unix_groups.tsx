import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Select,
  Alert,
  AlertIcon,
  IconButton,
  Tooltip,
  Badge,
  useDisclosure,
  useColorModeValue,
  Flex
} from '@chakra-ui/react';
import { 
  AddIcon, 
  EditIcon, 
  DeleteIcon, 
  RepeatIcon, 
  ViewIcon
} from '@chakra-ui/icons';
import { useIntl } from 'react-intl';
import { DamTable } from '../../../common/components/DamTable';
import { useUnixGroups } from '../../../common/hooks/useUnixGroups';
import { UnixGroup, UnixFolderAccess } from '../../../models/unix/UnixGroup';
import { Asset } from '../../../models/assets/Asset';
import { UnixGroupFormModal } from '../components/unix_group_form_modal';
import { DamAlertDialog } from "@common/components/DamDialog/DamAlertDialog";
import { request } from '../../../common/libs/request';
import { AssetCredential } from '../../../models/assets/AssetCredential';

export default function UnixGroups() {
  const intl = useIntl();
  const {
    groups,
    error,
    groupsPagination,
    filters,
    fetchGroupsByAsset,
    createGroup,
    updateGroup,
    deleteGroup,
    applyAclPermissions,
    updateFilters
  } = useUnixGroups();

  // Asset credentials state
  const [credentials, setCredentials] = useState<AssetCredential[]>([]);
  const [credentialsLoading, setCredentialsLoading] = useState(false);

  // Modal states
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  // Form state
  const [selectedGroup, setSelectedGroup] = useState<UnixGroup | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Filter Unix server assets from credentials
  const unixServerAssets = credentials.filter(credential => 
    credential.asset?.type === 'UNIX_SERVER' && 
    credential.username && 
    credential.sshKeyFile
  );

  // Fetch asset credentials on component mount
  useEffect(() => {
    const fetchCredentials = async () => {
      setCredentialsLoading(true);
      try {
        const response = await request('/api/asset_owner/assets/credentials', {});
        setCredentials(response || []);
      } catch (error) {
        console.error('Failed to fetch credentials:', error);
        setCredentials([]);
      } finally {
        setCredentialsLoading(false);
      }
    };

    fetchCredentials();
  }, []);

  // Load groups for the first available asset (or selected asset)
  useEffect(() => {
    if (selectedAssetId) {
      updateFilters({ assetId: selectedAssetId });
      fetchGroupsByAsset(selectedAssetId);
    }
  }, [selectedAssetId]); // Remove function dependencies to prevent infinite loops

  // Handle search
  const handleSearchInput = (value: string) => {
    updateFilters({ search: value || undefined });
  };

  // Handle create group
  const handleCreateGroup = () => {
    setSelectedGroup(null);
    onFormOpen();
  };

  // Handle edit group
  const handleEditGroup = (group: UnixGroup) => {
    setSelectedGroup(group);
    setSelectedAssetId(group.assetId);
    onFormOpen();
  };

  // Handle delete group
  const handleDeleteGroup = (group: UnixGroup) => {
    setSelectedGroup(group);
    onDeleteOpen();
  };

  // Handle apply ACL
  const handleApplyAcl = async (groupId: number) => {
    try {
      await applyAclPermissions(groupId);
    } catch (error) {
      console.error('ACL apply failed:', error);
    }
  };

  // Handle form submission
  const handleFormSubmit = async (groupData: any, sessionId?: string) => {
    try {
      if (selectedGroup) {
        await updateGroup(selectedGroup.id, groupData, sessionId);
      } else {
        await createGroup({ ...groupData, assetId: selectedAssetId! }, sessionId);
      }
      onFormClose();
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (selectedGroup && selectedAssetId) {
      try {
        await deleteGroup(selectedGroup.id);
        // Explicitly refresh the groups list after deletion
        await fetchGroupsByAsset(selectedAssetId);
        onDeleteClose();
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Table columns
  const columns = [
    {
      key: 'groupName',
      title: intl.formatMessage({ id: 'unix_groups.group_name' }),
      dataIndex: 'groupName',
      render: (groupName: string, record: UnixGroup) => (
        <VStack spacing={1} align="start">
          <Text fontWeight="medium" fontSize="sm" mb={0}>
            {groupName}
          </Text>
          {record.description && (
            <Text fontSize="xs" color="gray.500" noOfLines={1} mb={0}>
              {record.description}
            </Text>
          )}
        </VStack>
      )
    },
    {
      key: 'asset',
      title: intl.formatMessage({ id: 'unix_groups.asset' }),
      dataIndex: 'asset',
      render: (asset: Asset, record: UnixGroup) => (
        <VStack spacing={1} align="start">
          <Text fontSize="sm" fontWeight="medium" mb={0}>
            {asset?.name || 'Unknown Asset'}
          </Text>
          <Text fontSize="xs" color="gray.500" fontFamily="mono" mb={0}>
            {asset?.hostAddress}:{asset?.portNumber}
          </Text>
        </VStack>
      )
    },
    {
      key: 'folderAccesses',
      title: intl.formatMessage({ id: 'unix_groups.folder_count' }),
      dataIndex: 'folderAccesses',
      render: (folderAccesses: UnixFolderAccess[], record: UnixGroup) => {
        const folders = folderAccesses || [];
        return (
          <VStack spacing={1} align="start">
            <Badge colorScheme="blue" size="sm">
              {folders.length} {intl.formatMessage({ id: 'text.folders' })}
            </Badge>
            <Text fontSize="xs" color="gray.500" noOfLines={1} mb={0}>
              {folders.slice(0, 2).map(f => f.folderPath).join(', ')}
              {folders.length > 2 && '...'}
            </Text>
          </VStack>
        );
      }
    },
    {
      key: 'createdAt',
      title: intl.formatMessage({ id: 'unix_groups.created_at' }),
      dataIndex: 'createdAt',
      render: (createdAt: string, record: UnixGroup) => (
        <Text fontSize="sm" mb={0}>
          {formatDate(createdAt)}
        </Text>
      )
    },
    {
      key: 'actions',
      title: intl.formatMessage({ id: 'unix_groups.actions' }),
      dataIndex: 'actions',
      render: (actions: any, record: UnixGroup) => (
        <HStack spacing={2}>
          <Tooltip label={intl.formatMessage({ id: 'unix_groups.view_details' })}>
            <IconButton
              size="sm"
              variant="ghost"
              icon={<ViewIcon />}
              onClick={() => handleEditGroup(record)}
              aria-label="View details"
            />
          </Tooltip>
          <Tooltip label={intl.formatMessage({ id: 'unix_groups.edit' })}>
            <IconButton
              size="sm"
              variant="ghost"
              icon={<EditIcon />}
              onClick={() => handleEditGroup(record)}
              aria-label="Edit group"
            />
          </Tooltip>
          <Tooltip label={intl.formatMessage({ id: 'unix_groups.apply_acl' })}>
            <IconButton
              size="sm"
              variant="ghost"
              icon={<RepeatIcon />}
              onClick={() => handleApplyAcl(record.id)}
              aria-label="Apply ACL"
              colorScheme="green"
            />
          </Tooltip>
          <Tooltip label={intl.formatMessage({ id: 'unix_groups.delete' })}>
            <IconButton
              size="sm"
              variant="ghost"
              icon={<DeleteIcon />}
              onClick={() => handleDeleteGroup(record)}
              aria-label="Delete group"
              colorScheme="red"
            />
          </Tooltip>
        </HStack>
      )
    }
  ];

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Flex justify="space-between" align="center">
        <VStack spacing={1} align="start">
          
          <Text fontSize="sm" color="gray.600" mb={0}>
            {intl.formatMessage({ id: 'unix_groups.manage_groups' })}
          </Text>
        </VStack>
          <HStack spacing={3}>
            <Button
              leftIcon={<AddIcon />}
              onClick={handleCreateGroup}
              colorScheme="blue"
              isDisabled={!selectedAssetId || unixServerAssets.length === 0}
            >
              {intl.formatMessage({ id: 'unix_groups.create_group' })}
            </Button>
          </HStack>
        </Flex>

        {/* Asset Selection */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={0}>
            {intl.formatMessage({ id: 'unix_groups.select_asset' })}
          </Text>
          <Select
            placeholder={intl.formatMessage({ id: 'unix_groups.select_asset_placeholder' })}
            value={selectedAssetId || ''}
            onChange={(e) => setSelectedAssetId(e.target.value ? Number(e.target.value) : null)}
            maxW="400px"
            isDisabled={credentialsLoading}
          >
            {unixServerAssets.map((credential) => (
              <option key={credential.asset?.id} value={credential.asset?.id}>
                {credential.asset?.name} ({credential.asset?.hostAddress}:{credential.asset?.portNumber})
              </option>
            ))}
          </Select>
          {credentialsLoading && (
            <Text fontSize="xs" color="gray.500" mt={1} mb={0}>
              {intl.formatMessage({ id: 'unix_groups.loading_assets' })}
            </Text>
          )}
          {!credentialsLoading && unixServerAssets.length === 0 && (
            <VStack spacing={2} align="start" mt={2}>
              <Text fontSize="xs" color="orange.500" mb={0}>
                {intl.formatMessage({ id: 'unix_groups.no_unix_assets' })}
              </Text>
              <Text fontSize="xs" color="gray.500" mb={0}>
                {intl.formatMessage({ id: 'unix_groups.setup_ssh_credentials' })}
              </Text>
            </VStack>
          )}
        </Box>

        {/* Filters */}
        <Box
          p={4}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="md"
          bg={bgColor}
        >
          <HStack spacing={4} align="center">
            <Box flex={1}>
              <Input
                placeholder={intl.formatMessage({ id: 'unix_groups.search_placeholder' })}
                value={filters.search || ''}
                onChange={(e) => handleSearchInput(e.target.value)}
                size="sm"
              />
            </Box>
          </HStack>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            <Text fontSize="sm" mb={0}>{error}</Text>
          </Alert>
        )}

        {/* Groups Table */}
        <Box
          border="1px solid"
          borderColor={borderColor}
          borderRadius="md"
          bg={bgColor}
          overflow="hidden"
        >
          {groups.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text fontSize="sm" color="gray.500" mb={0}>
                {intl.formatMessage({ id: 'unix_groups.no_groups' })}
              </Text>
              {selectedAssetId && (
                <Button
                  mt={3}
                  leftIcon={<AddIcon />}
                  onClick={handleCreateGroup}
                  size="sm"
                >
                  {intl.formatMessage({ id: 'unix_groups.create_first_group' })}
                </Button>
              )}
            </Box>
          ) : (
            <DamTable
              dataSource={groups}
              columns={columns}
              rowKey="id"
              pagination={{
                ...groupsPagination,
                onChange: (page: number, pageSize: number) => {
                  if (selectedAssetId) {
                    updateFilters({ page: page - 1, size: pageSize });
                    fetchGroupsByAsset(selectedAssetId, { page: page - 1, size: pageSize });
                  }
                }
              }}
            />
          )}
        </Box>

        {/* Form Modal */}
        <UnixGroupFormModal
          isOpen={isFormOpen}
          onClose={onFormClose}
          onSubmit={handleFormSubmit}
          assetId={selectedAssetId || 0}
          group={selectedGroup || undefined}
          loading={false}
        />

        {/* Delete Confirmation Dialog */}
        <DamAlertDialog
          isOpen={isDeleteOpen}
          onClose={onDeleteClose}
          onConfirm={handleDeleteConfirm}
          title='unix_groups.delete_group'
          message='unix_groups.confirm_delete_description'
          confirmButtonId="btnConfirmDelete"
        />
      </VStack>
    );
  }
