import { Flex, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Text, Tooltip, Checkbox, Box, Icon, Badge } from "@chakra-ui/react";
import { DamCard, DamCardBody, DamCardDivider, ActionMenu, ActionMenuItem } from "@common/index";
import { ApprovalStatus, AccessRequest } from "@models/assets/AccessRequest";
import { Asset } from "@models/assets/Asset";
import { FormattedMessage } from "react-intl";
import { WarningIcon } from "@chakra-ui/icons";
import { AssetType, LockType } from "@/constants/enums";
import { useState, useMemo } from "react";
import { handleRowClick, handleCheckboxClick } from "@common/libs/utils/tableSelection";
import { FaFire } from "react-icons/fa";

interface BaseAssetsTableProps {
  readonly assets: Asset[];
  readonly selectedAsset: Asset | null;
  readonly onSelectAsset: (asset: Asset) => void;
  readonly showHighlightRow?: boolean;
  readonly showFetchTemplate?: boolean;
  readonly onQueryAsset?: (asset: Asset) => void;
  readonly onTerminalAsset?: (asset: Asset) => void;
  readonly showAccessRequestStatus?: boolean;
  // Action handlers for the menu
  readonly onEditAsset?: (asset: Asset) => void;
  readonly onDeleteAsset?: (asset: Asset) => void;
  readonly onManageUsers?: (asset: Asset, userType: 'owners' | 'approvers') => void;
  readonly onLockAsset?: (asset: Asset) => void;
  readonly onUnlockAsset?: (asset: Asset) => void;
  readonly onRequestAccess?: (asset: Asset) => void;
  readonly onRelinquishAccess?: (accessRequest: AccessRequest | null) => void;
  readonly onUpdatePassword?: (accessRequest: AccessRequest | null) => void;
  // Permission flags for role-based access
  readonly canManageUsers?: boolean;
  readonly canLockAsset?: boolean;
  readonly userType?: 'admin' | 'accessor';
}

const getStatusColor = (status: string | undefined): string => {
  switch (status) {
    case 'APPROVED':
      return 'green.500';
    case 'REJECTED':
      return 'red.500';
    case 'EXPIRED':
      return 'yellow.500';
    case 'REQUESTED':
      return 'orange.500';
    case 'APPROVAL_IN_PROGRESS':
      return 'blue.500';
    case 'RELINQUISHED_AFTER_APPROVED':
    case 'RELINQUISHED_BEFORE_APPROVAL':
      return 'gray.500';
    default:
      return 'gray.500';
  }
};

// Helper function to determine lock status display
const getLockStatus = (asset: Asset, userType: 'admin' | 'accessor'): string => {
  if (userType === 'admin') {
    // Admin: show "Locked" if locked is true, otherwise blank
    return asset.locked ? 'Locked' : '';
  } else {
    // Accessor: show "Locked" when:
    // - (locked is false AND lock_type is LOCK_ALL_DB_USERS) OR
    // - locked is true
    // Otherwise blank
    const isLocked = asset.locked ?? false;
    const lockType = asset.lockType;
    
    if (isLocked) {
      return 'Locked';
    }
    
    if (!isLocked && lockType === LockType.LOCK_ALL_DB_USERS) {
      return 'Locked';
    }
    
    return '';
  }
};

export function BaseAssetsTable({
  assets,
  selectedAsset,
  onSelectAsset,
  showHighlightRow = false,
  showFetchTemplate = false,
  onQueryAsset,
  onTerminalAsset,
  showAccessRequestStatus,
  onEditAsset,
  onDeleteAsset,
  onManageUsers,
  onLockAsset,
  onUnlockAsset,
  onRequestAccess,
  onRelinquishAccess,
  onUpdatePassword,
  canManageUsers = false,
  canLockAsset = false,
  userType = 'admin'
}: BaseAssetsTableProps) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const selectedRows = useMemo(() => {
    return assets.filter(asset => asset.id && selectedRowKeys.includes(String(asset.id)));
  }, [assets, selectedRowKeys]);

  const selectAll = () => {
    setSelectedRowKeys(assets.filter(asset => asset.id).map(asset => String(asset.id)));
  };

  const deselectAll = () => {
    setSelectedRowKeys([]);
  };

  // Wrapper functions for asset IDs
  const handleAssetRowClick = (assetId: number) => {
    handleRowClick(String(assetId), selectedRowKeys, setSelectedRowKeys);
  };

  const handleAssetCheckboxClick = (assetId: number, checked: boolean) => {
    handleCheckboxClick(String(assetId), checked, selectedRowKeys, setSelectedRowKeys);
  };

  const isAllSelected = assets.length > 0 && selectedRowKeys.length === assets.length;
  const isIndeterminate = selectedRowKeys.length > 0 && selectedRowKeys.length < assets.length;

  // Helper functions to reduce cognitive complexity
  const addEditItem = (items: ActionMenuItem[], selectedAssetForActions: Asset) => {
    if (onEditAsset) {
      items.push({
        label: 'Edit',
        onClick: () => onEditAsset(selectedAssetForActions),
        colorScheme: 'green',
        variant: 'outline',
      });
    }
  };

  const addQueryItem = (items: ActionMenuItem[], selectedAssetForActions: Asset) => {
    if (!onQueryAsset) return;
    
    const canQuery = selectedAssetForActions.accessRequest &&
      selectedAssetForActions.accessRequest?.assetApproverStatus === ApprovalStatus.APPROVED &&
      !selectedAssetForActions.locked && (selectedAssetForActions.lockType !== LockType.LOCK_ALL_DB_USERS);
    
    if (canQuery) {
      items.push({
        label: selectedAssetForActions.type === AssetType.UNIX_SERVER ? 'Terminal Access' : 'Run Query',
        onClick: () => {
          if (selectedAssetForActions.type === AssetType.UNIX_SERVER) {
            onTerminalAsset?.(selectedAssetForActions);
          } else {
            onQueryAsset(selectedAssetForActions);
          }
        },
        colorScheme: 'blue',
        variant: 'outline',
      });
    }
  };

  const addManageUsersItem = (items: ActionMenuItem[], selectedAssetForActions: Asset) => {
    if (onManageUsers) {
      items.push({
        label: 'Manage Users',
        onClick: () => onManageUsers?.(selectedAssetForActions, 'owners'),
        colorScheme: 'purple',
        variant: 'outline',
        isDisabled: !canManageUsers,
      });
    }
  };

  const addLockUnlockItems = (items: ActionMenuItem[], selectedAssetForActions: Asset) => {
    // Only show lock/unlock items for admin userType
    if (userType !== 'admin') {
      return;
    }
    
    const isLocked = selectedAssetForActions.locked ?? false;
    
    if (!isLocked && onLockAsset) {
      items.push({
        label: 'Lockout',
        onClick: () => onLockAsset(selectedAssetForActions),
        colorScheme: 'orange',
        variant: 'outline',
        isDisabled: !canLockAsset,
      });
    }
    
    if (isLocked && onUnlockAsset) {
      items.push({
        label: 'Unlock',
        onClick: () => onUnlockAsset(selectedAssetForActions),
        colorScheme: 'green',
        variant: 'outline',
        isDisabled: !canLockAsset,
      });
    }
  };

  const addDeleteItem = (items: ActionMenuItem[], selectedAssetForActions: Asset) => {
    if (onDeleteAsset) {
      items.push({
        label: 'Delete',
        onClick: () => {
          onDeleteAsset(selectedAssetForActions);
          setSelectedRowKeys([]);
        },
        colorScheme: 'red',
        variant: 'outline',
      });
    }
  };

  // Helper function to check if access can be requested
  const canRequestAccess = (asset: Asset): boolean => {
    if (!asset.accessRequest) {
      return true;
    }
    const status = asset.accessRequest.assetApproverStatus;
    return status === ApprovalStatus.REJECTED ||
           status === ApprovalStatus.EXPIRED ||
           status === ApprovalStatus.RELINQUISHED_AFTER_APPROVED ||
           status === ApprovalStatus.RELINQUISHED_BEFORE_APPROVAL;
  };

  const addRequestAccessItems = (items: ActionMenuItem[], selectedAssetForActions: Asset) => {
    if (!onRequestAccess && !onRelinquishAccess && !onUpdatePassword) {
      return;
    }

    // Don't allow access requests if asset is locked
    if (selectedAssetForActions.locked) {
      return;
    }

    if (canRequestAccess(selectedAssetForActions)) {
      if (onRequestAccess) {
        items.push({
          label: 'Request Access',
          onClick: () => onRequestAccess(selectedAssetForActions),
          colorScheme: 'green',
          variant: 'outline',
        });
      }
    } else if (selectedAssetForActions.accessRequest) {
      const status = selectedAssetForActions.accessRequest.assetApproverStatus;
      
      // Relinquish/Cancel Access
      if (onRelinquishAccess) {
        const isApproved = status === ApprovalStatus.APPROVED;
        items.push({
          label: isApproved ? 'Relinquish Access' : 'Cancel Request',
          onClick: () => onRelinquishAccess(selectedAssetForActions.accessRequest ?? null),
          colorScheme: 'red',
          variant: 'outline',
        });
      }
    }
  };

  // Build action menu items based on selected rows
  const actionMenuItems: ActionMenuItem[] = useMemo(() => {
    const items: ActionMenuItem[] = [];
    const singleSelected = selectedRows.length === 1;
    const selectedAssetForActions = singleSelected ? selectedRows[0] : null;
    
    if (!singleSelected || !selectedAssetForActions) {
      return items;
    }

    addEditItem(items, selectedAssetForActions);
    addQueryItem(items, selectedAssetForActions);
    addRequestAccessItems(items, selectedAssetForActions);
    addManageUsersItem(items, selectedAssetForActions);
    addLockUnlockItems(items, selectedAssetForActions);
    addDeleteItem(items, selectedAssetForActions);

    return items;
  }, [selectedRows, onEditAsset, onQueryAsset, onTerminalAsset, onRequestAccess, onRelinquishAccess, onUpdatePassword, onManageUsers, onLockAsset, onUnlockAsset, onDeleteAsset, canManageUsers, canLockAsset, userType]);

  return (
    <DamCard mt={4}>
      <DamCardBody>
        {/* AWS-style Header with Selection Count and Actions */}
        <Flex justify="space-between" align="center" my={2} minH="32px">
          <Flex align="center" gap={2} minH="32px">
            <Text fontSize="md" fontWeight="semibold" mb={0} mx={1} lineHeight="32px">
              <FormattedMessage id='text.assets' /> 
              {selectedRows.length > 0 && ` (${selectedRows.length} selected)`}
            </Text>
          </Flex>
          <ActionMenu
            items={actionMenuItems}
            hasSelection={selectedRows.length === 1}
            selectedCount={selectedRows.length}
            variant="buttons"
          />
        </Flex>

        <DamCardDivider />

        <TableContainer width='100%'>
          <Table variant='simple' id="tblAssets" size="sm">
            <Thead>
              <Tr>
                <Th width="40px">
                  <Checkbox
                    isChecked={isAllSelected}
                    isIndeterminate={isIndeterminate}
                    onChange={(e) => e.target.checked ? selectAll() : deselectAll()}
                  />
                </Th>
                <Th><FormattedMessage id='text.name' /></Th>
                <Th><FormattedMessage id='text.type' /></Th>
                <Th><FormattedMessage id='text.database_type' /></Th>
                <Th><FormattedMessage id='text.host_address' /></Th>
                <Th><FormattedMessage id='text.port_number' /></Th>
                <Th><FormattedMessage id='text.database_name' /></Th>
                <Th><FormattedMessage id='text.description' /></Th>
                <Th textAlign="center">
                  <Text whiteSpace="pre-line" mb={0}>
                    <FormattedMessage id='text.lock_status' />
                  </Text>
                </Th>
                {showFetchTemplate && (
                  <Th><FormattedMessage id='text.fetch_template' /></Th>
                )}
                {showAccessRequestStatus && (
                  <Th textAlign="center">
                    <Text whiteSpace="pre-line" mb={0}>
                      Access Request{'\n'}Status
                    </Text>
                  </Th>
                )}
              </Tr>
            </Thead>
            <Tbody maxHeight={500}>
              {assets.length > 0 ? (
                <>
                  {assets.map((asset) => {
                    if (!asset.id) return null;
                    const isRowSelected = selectedRowKeys.includes(String(asset.id));
                    const isSelectedAsset = asset.id === selectedAsset?.id;
                    
                    // Determine row background style
                    let rowBackgroundStyle = {};
                    if (isRowSelected) {
                      rowBackgroundStyle = {
                        backgroundColor: 'blue.50 !important',
                        _dark: {
                          backgroundColor: 'blue.900 !important'
                        }
                      };
                    } else if (isSelectedAsset) {
                      rowBackgroundStyle = {
                        _light: {
                          backgroundColor: 'gray.200'
                        },
                        _dark: {
                          backgroundColor: 'gray.600'
                        }
                      };
                    }

                    return (
                      <Tr key={asset.id}
                        sx={{
                          _hover: {
                            backgroundColor: 'gray.100',
                            _dark: {
                              backgroundColor: 'gray.700'
                            }
                          },
                          ...rowBackgroundStyle
                        }}
                        cursor="pointer"
                        onClick={() => {
                          // Rule 1 & 2: Handle row click (not checkbox)
                          if (asset.id) {
                            handleAssetRowClick(asset.id);
                          }
                          // Also call the original onSelectAsset for navigation/details
                          onSelectAsset(asset);
                        }}>
                        <Td onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            isChecked={isRowSelected}
                            onChange={(e) => asset.id && handleAssetCheckboxClick(asset.id, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Td>
                        <Td>
                          <Flex align="center" gap={2}>
                            <Text mb={0}>{asset.name}</Text>
                            {/* Show fire icon if access is approved but credentials need to be set (for accessors) */}
                            {showHighlightRow && asset.accessRequest?.assetApproverStatus === ApprovalStatus.APPROVED && 
                             asset.accessRequest?.isTempPassword && (
                              <Tooltip label="Approved access request" placement="top" hasArrow>
                                <Box display="inline-flex" cursor="pointer">
                                  <Icon as={FaFire} color="red.500" boxSize={4} />
                                </Box>
                              </Tooltip>
                            )}
                          </Flex>
                        </Td>
                        <Td>{asset.type}</Td>
                        <Td>{asset.databaseType ?? '-'}</Td>
                        <Td>{asset.hostAddress}</Td>
                        <Td>{asset.portNumber}</Td>
                        <Td>{asset.databaseName}</Td>
                        <Td>{asset.description}</Td>
                        <Td>
                          {(() => {
                            const lockStatus = getLockStatus(asset, userType);
                            return lockStatus ? (
                              <Badge colorScheme="red" variant="solid">
                                {lockStatus}
                              </Badge>
                            ) : (
                              <Text mb={0} color="gray.400">-</Text>
                            );
                          })()}
                        </Td>
                        {showFetchTemplate && (
                          <Td>{asset.fetchTemplate ?? '-'}</Td>
                        )}
                        {showAccessRequestStatus && (
                          <Td>
                            <Tooltip
                              label={asset.accessRequest?.rejectReason ?? 'No reason provided'}
                              isDisabled={asset.accessRequest?.assetApproverStatus !== 'REJECTED'}
                              placement="right"
                              hasArrow
                            >
                              <Flex
                                dir="row"
                                alignItems={'center'}
                                gap={2}
                                display="inline-flex"
                              >
                                <Text
                                  color={getStatusColor(asset.accessRequest?.assetApproverStatus)}
                                  mb={0}
                                  fontWeight="semibold"
                                >
                                  {asset.accessRequest?.assetApproverStatus}
                                </Text>
                                {asset.accessRequest?.assetApproverStatus === 'REJECTED' && (
                                  <WarningIcon color="red.500" />
                                )}
                              </Flex>
                            </Tooltip>
                          </Td>
                        )}
                      </Tr>
                    );
                  })}
                </>
              ) : (
                <Tr>
                  <Td colSpan={
                    9 +
                    (showFetchTemplate ? 1 : 0) +
                    (showAccessRequestStatus ? 1 : 0)
                  } textAlign={'center'}>
                    <FormattedMessage id="text.no_assets" />
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </DamCardBody>
    </DamCard>
  );
}
