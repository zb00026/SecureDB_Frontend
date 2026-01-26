import {
  Button, Flex, Tr, Tbody, Table, TableContainer, Td, Th, Thead,
  useColorModeValue, Input, IconButton, Tooltip, VStack,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody,
  useDisclosure,
  Alert, AlertIcon, AlertTitle, AlertDescription, CloseButton, Box,
  Checkbox, Text, Icon, Badge
} from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { DamCardBody, DamCard, request, useDamToast, DamCardDivider, stateActions, ActionMenu, ActionMenuItem, state, userHasRole } from "@common/index";
import { handleRowClick, handleCheckboxClick } from "@common/libs/utils/tableSelection";
import { AssetCredential } from "@models/assets/AssetCredential";
import { Asset } from "@models/assets/Asset";
import { AssetDTO } from "@models/assets/AssetDTO";
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { SetCredentialDialog } from "@common/components/DamDialog/SetCredentialDialog";
import { SetSSHCredentialDialog } from "@common/components/DamDialog/SetSSHCredentialDialog";
import { DamAlertDialog } from "@common/components/DamDialog/DamAlertDialog";
import { DamTerminalModal } from "@common/components/DamTerminal";
import { AssetRequestApprovals } from "./components/asset_request_approvals";
import { ChangeRequests } from "./components/change_requests";
import { AIMaskingChat } from "./components/ai_masking_chat";
import { MaskingPolicies, MaskingPoliciesRef } from "./components/masking_policies";
import { DamViewAccessModal } from "@common/components/DamDialog/DamViewAccessModal";
import { useViewAccess } from "@common/hooks/useViewAccess";
import { AssetLockDialog, LockAction } from "@common/components/DamDialog";
import { FiEdit, FiSave, FiX, FiShield, FiDatabase, FiTerminal, FiSearch, FiCheckCircle } from "react-icons/fi";
import { FaFire } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { USER_ROLE, LockType } from "@/constants/enums";

export const isSearchable = true;
export const displayName = 'Asset Owner Main Page';

type ActiveTab = 'assets' | 'approvals' | 'changes' | 'masking';

// Default empty edit form state
const getDefaultEditFormState = (): AssetDTO => ({
  name: '',
  description: '',
  hostAddress: '',
  portNumber: '',
  databaseName: '',
  type: undefined,
  databaseType: undefined,
  unixServerType: undefined
});

// Helper function to create edit form state from asset
const createEditFormState = (asset: Asset): AssetDTO => ({
  name: asset.name,
  description: asset.description,
  hostAddress: asset.hostAddress,
  portNumber: asset.portNumber,
  databaseName: asset.databaseName,
  type: asset.type,
  databaseType: asset.databaseType,
  unixServerType: asset.unixServerType,
});

// Helper function to check if tab is valid
const isValidTab = (tab: string | null): tab is ActiveTab => {
  return tab !== null && ['assets', 'approvals', 'changes', 'masking'].includes(tab);
};

// Helper function to check if credential needs setup
const needsCredentialSetup = (credential: AssetCredential): boolean => {
  return !credential.username && credential.isTemporaryPassword === true;
};

// Helper function to check if asset is database type
const isDatabaseAsset = (assetType: string | undefined): boolean => {
  return assetType === 'DATABASE';
};

// Helper function to check if asset is Unix server type
const isUnixServerAsset = (assetType: string | undefined): boolean => {
  return assetType === 'UNIX_SERVER';
};

// Helper function to check if has database credentials
const hasDatabaseCredentials = (credential: AssetCredential): boolean => {
  return Boolean(credential.username && credential.password);
};

// Helper function to check if has SSH credentials
const hasSSHCredentials = (credential: AssetCredential): boolean => {
  return Boolean(credential.username && credential.sshKeyFile);
};

// Helper function to get row background style
const getRowBackgroundStyle = (isRowSelected: boolean, isSelectedCredential: boolean) => {
  if (isRowSelected) {
    return {
      backgroundColor: 'blue.50 !important',
      _dark: {
        backgroundColor: 'blue.900 !important'
      }
    };
  }
  if (isSelectedCredential) {
    return {
      _light: {
        backgroundColor: 'gray.200'
      },
      _dark: {
        backgroundColor: 'gray.600'
      }
    };
  }
  return {};
};

// Tab Button Component
interface TabButtonProps {
  readonly tab: ActiveTab;
  readonly activeTab: ActiveTab;
  readonly onTabClick: (tab: ActiveTab) => void;
  readonly icon: React.ReactElement;
  readonly messageId: string;
}

const TabButton = ({ tab, activeTab, onTabClick, icon, messageId }: TabButtonProps) => {
  const isActive = activeTab === tab;
  return (
    <Button
      variant={isActive ? 'solid' : 'ghost'}
      colorScheme={isActive ? 'blue' : 'gray'}
      onClick={() => onTabClick(tab)}
      leftIcon={icon}
      borderRadius="0"
      borderBottom={isActive ? '2px solid' : 'none'}
      borderBottomColor={isActive ? 'blue.500' : 'transparent'}
    >
      <FormattedMessage id={messageId} />
    </Button>
  );
};

export function Component() {
  const { showError, showSuccess } = useDamToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [credentials, setCredentials] = useState<AssetCredential[]>([]);
  const [selectedCredential, setSelectedCredential] = useState<AssetCredential | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSSHDialogOpen, setIsSSHDialogOpen] = useState(false);
  const [isDelDlgOpen, setIsDelDlgOpen] = useState(false);
  const [isTerminalModalOpen, setIsTerminalModalOpen] = useState(false);
  const [terminalAsset, setTerminalAsset] = useState<Asset | null>(null);
  const [editingAssetId, setEditingAssetId] = useState<number | null>(null);
  const [editFormState, setEditFormState] = useState<AssetDTO>(getDefaultEditFormState());
  const [activeTab, setActiveTab] = useState<ActiveTab>('assets');
  const [newAssetsRequiringCredentials, setNewAssetsRequiringCredentials] = useState<AssetCredential[]>([]);
  const [showNewAssetsAlert, setShowNewAssetsAlert] = useState(false);
  
  // Lock/Unlock states
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);
  const [lockDialogAsset, setLockDialogAsset] = useState<Asset | null>(null);
  const [lockDialogAction, setLockDialogAction] = useState<LockAction>(LockAction.LOCK);
  const [isLockLoading, setIsLockLoading] = useState(false);

  // Helper function to set tab from URL parameter
  const setTabFromUrl = () => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');

    if (isValidTab(tabParam)) {
      setActiveTab(tabParam);
      navigate(location.pathname, { replace: true });
      return true;
    }
    return false;
  };

  // Helper function to set tab from session storage
  const setTabFromSession = () => {
    const savedTab = sessionStorage.getItem('asset_owner_active_tab');
    if (isValidTab(savedTab)) {
      setActiveTab(savedTab);
      sessionStorage.removeItem('asset_owner_active_tab');
      return true;
    }
    return false;
  };

  // Check for tab preference from dashboard or URL parameters
  useEffect(() => {
    if (!setTabFromUrl()) {
      setTabFromSession();
    }
  }, [location.search, navigate]);
  const selectedRowBg = useColorModeValue('gray.200', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const inputBorderColor = useColorModeValue('gray.300', 'gray.600');
  const inputFocusBorderColor = useColorModeValue('blue.500', 'blue.300');

  // Ref for MaskingPolicies component to call refresh function
  const maskingPoliciesRef = useRef<MaskingPoliciesRef>(null);
  const { isOpen: isAIModalOpen, onOpen: openAIModal, onClose: closeAIModal } = useDisclosure();

  // Callback function to refresh masking policies
  const handlePolicyCreated = () => {
    maskingPoliciesRef.current?.refreshPolicies();
  };

  // Use the shared view access hook
  const {
    isViewAccessModalOpen,
    viewAccessAsset,
    assetAccessData,
    isLoadingAccess,
    accessError,
    viewAssetAccess,
    closeViewAccessModal
  } = useViewAccess({ apiEndpoint: '/api/asset_owner/assets' });

  const intl = useIntl();

  // Helper function to check and handle new assets requiring credentials
  const handleNewAssetsCheck = (res: AssetCredential[]) => {
    const newAssets = res.filter(needsCredentialSetup);

    if (newAssets.length === 0) {
      setNewAssetsRequiringCredentials([]);
      setShowNewAssetsAlert(false);
      return;
    }

    setNewAssetsRequiringCredentials(newAssets);
    setShowNewAssetsAlert(true);
    showSuccess({
      title: intl.formatMessage({ id: 'text.new_assets_require_credentials' }),
      description: intl.formatMessage(
        { id: 'text.credential_setup_required' },
        { count: newAssets.length }
      )
    });
  };

  const fetchAssignedCredentials = () => {
    stateActions.addLoading();
    request('/api/asset_owner/assets/credentials', {})
      .then((res) => {
        if (res.length === 0) {
          setCredentials([]);
          return;
        }
        setCredentials(res);
        handleNewAssetsCheck(res);
      })
      .catch((e) => {
        showError({
          description: intl.formatMessage({ id: 'text.error_occurred_get_asset_credentials' }),
        });
      })
      .finally(() => {
        stateActions.subLoading();
      });
  };

  useEffect(() => {
    fetchAssignedCredentials();
  }, []);

  // Helper function to handle database credential request
  const handleDatabaseCredentialRequest = (endpoint: string, method: string, data?: { username: string; password?: string; awsSecretsManagerKey?: string }) => {
    return request(endpoint, { method, data })
      .then(() => {
        showSuccess({
          description: intl.formatMessage({ id: 'text.credentials_set_success' }),
        });
        fetchAssignedCredentials();
      })
      .catch((e) => {
        showError({
          description: e.data?.error ?? intl.formatMessage({ id: 'text.error_occurred_setting_credentials' }),
        });
      })
      .finally(() => {
        stateActions.subLoading();
      });
  };

  // Helper function to handle SSH credential request
  const handleSSHCredentialRequest = (endpoint: string, method: string, data?: { username: string; sshKeyFile?: string; awsSecretsManagerKey?: string }) => {
    return request(endpoint, { method, data })
      .then(() => {
        showSuccess({
          description: intl.formatMessage({ id: 'text.ssh_credentials_set_success' }),
        });
        fetchAssignedCredentials();
      })
      .catch((e) => {
        showError({
          description: e.data?.error ? e.data?.details : intl.formatMessage({ id: 'text.error_occurred_setting_ssh_credentials' }),
        });
      })
      .finally(() => {
        stateActions.subLoading();
      });
  };

  // Helper function to handle relinquish credential (generic for both database and SSH)
  const handleRelinquishCredential = (endpoint: string, successMessageId: string, errorMessageId: string) => {
    return request(endpoint, { method: 'DELETE' })
      .then(() => {
        showSuccess({
          description: intl.formatMessage({ id: successMessageId }),
        });
        fetchAssignedCredentials();
      })
      .catch((e) => {
        showError({
          description: e.data?.error ?? intl.formatMessage({ id: errorMessageId }),
        });
      })
      .finally(() => {
        stateActions.subLoading();
      });
  };

  const handleSetCredential = (username: string, password: string, awsSecretsManagerKey?: string) => {
    if (!selectedCredential || !isDatabaseAsset(selectedCredential.asset?.type)) return;
    stateActions.addLoading();
    const requestData = awsSecretsManagerKey 
      ? { username, awsSecretsManagerKey }
      : { username, password };
    handleDatabaseCredentialRequest(
      `/api/asset_owner/assets/credentials/${selectedCredential.id}`,
      'POST',
      requestData
    );
  };

  const handleSetSSHCredential = (username: string, sshPrivateKey: string, awsSecretsManagerKey?: string) => {
    if (!selectedCredential || !isUnixServerAsset(selectedCredential.asset?.type)) return;
    stateActions.addLoading();
    const requestData = awsSecretsManagerKey
      ? { username, awsSecretsManagerKey }
      : { username, sshKeyFile: sshPrivateKey };
    handleSSHCredentialRequest(
      `/api/asset_owner/assets/ssh-credentials/${selectedCredential.id}`,
      'PUT',
      requestData
    );
  };

  const handleRelinquish = () => {
    if (!selectedCredential) return;
    setIsDelDlgOpen(false);
    stateActions.addLoading();

    const assetType = selectedCredential.asset?.type;
    if (isDatabaseAsset(assetType)) {
      handleRelinquishCredential(
        `/api/asset_owner/assets/credentials/${selectedCredential.id}`,
        'text.credentials_relinquished_success',
        'text.error_occurred_relinquishing_credentials'
      );
      return;
    }
    
    if (isUnixServerAsset(assetType)) {
      handleRelinquishCredential(
        `/api/asset_owner/assets/ssh-credentials/${selectedCredential.id}`,
        'text.ssh_credentials_relinquished_success',
        'text.error_occurred_relinquishing_ssh_credentials'
      );
    }
  };

  // Helper function to reset edit form state
  const resetEditForm = () => {
    setEditingAssetId(null);
    setEditFormState(getDefaultEditFormState());
  };

  // Helper function to handle asset update success
  const handleAssetUpdateSuccess = () => {
    showSuccess({
      description: intl.formatMessage({ id: 'text.asset_updated_success' }),
    });
    resetEditForm();
    fetchAssignedCredentials();
  };

  // Helper function to handle asset update error
  const handleAssetUpdateError = (e: any) => {
    showError({
      description: e.data?.error ? e.data?.details : intl.formatMessage({ id: 'text.error_occurred_updating_asset' }),
    });
  };

  const handleEditAsset = (credential: AssetCredential) => {
    if (!credential.asset) return;
    setEditingAssetId(credential.asset.id || null);
    setEditFormState(createEditFormState(credential.asset));
  };

  const handleSaveAsset = () => {
    if (!editingAssetId) return;
    stateActions.addLoading();
    request(`/api/asset_owner/assets/${editingAssetId}`, {
      method: 'POST',
      data: editFormState
    })
      .then(handleAssetUpdateSuccess)
      .catch(handleAssetUpdateError)
      .finally(() => {
        stateActions.subLoading();
      });
  };

  const handleCancelEdit = () => {
    resetEditForm();
  };

  const handleOpenTerminal = (asset: Asset) => {
    setTerminalAsset(asset);
    setIsTerminalModalOpen(true);
  };

  const handleCloseTerminal = () => {
    setIsTerminalModalOpen(false);
    setTerminalAsset(null);
  };

  const handleOpenQuery = (asset: Asset) => {
    if (asset.locked) {
      showError({ description: 'This asset is locked. You cannot run queries on a locked asset.' });
      return;
    }
    navigate(`/asset_owner/query_asset?assetId=${asset.id}`);
  };

  // Lock/Unlock handlers
  const handleLockAsset = (credential: AssetCredential) => {
    const asset = credential.asset as Asset;
    if (!asset) return;
    setLockDialogAsset(asset);
    setLockDialogAction(LockAction.LOCK);
    setIsLockDialogOpen(true);
  };

  const handleUnlockAsset = (credential: AssetCredential) => {
    const asset = credential.asset as Asset;
    if (!asset) return;
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
      if (!asset?.id) {
        throw new Error('Invalid asset selected');
      }

      const endpoint = lockAction === LockAction.LOCK
        ? `/api/asset_owner/assets/${asset.id}/lockout`
        : `/api/asset_owner/assets/${asset.id}/unlock`;

      await request(endpoint, {
        method: 'POST',
        data: {}
      });

      showSuccess({
        title: lockAction === LockAction.LOCK ? 'text.asset_locked' : 'text.asset_unlocked',
        description: lockAction === LockAction.LOCK ? 'text.asset_lock_success' : 'text.asset_unlock_success'
      });

      fetchAssignedCredentials();

      closeLockDialog();
    } catch (error: any) {
      console.error(`${lockAction} operation failed:`, error);
      showError({
        description: error?.response?.data?.error ?? `Failed to ${lockAction.toLowerCase()} asset access. Please try again.`
      });
    } finally {
      setIsLockLoading(false);
    }
  };
  
  const selectedRows = useMemo(() => {
    return credentials.filter(cred => cred.id && selectedRowKeys.includes(String(cred.id)));
  }, [credentials, selectedRowKeys]);

  const selectAll = () => {
    setSelectedRowKeys(credentials.filter(cred => cred.id).map(cred => String(cred.id)));
  };

  const deselectAll = () => {
    setSelectedRowKeys([]);
  };

  // Wrapper functions for credential IDs
  const handleCredentialRowClick = (credentialId: number) => {
    handleRowClick(String(credentialId), selectedRowKeys, setSelectedRowKeys);
  };

  const handleCredentialCheckboxClick = (credentialId: number, checked: boolean) => {
    handleCheckboxClick(String(credentialId), checked, selectedRowKeys, setSelectedRowKeys);
  };

  const isAllSelected = credentials.length > 0 && selectedRowKeys.length === credentials.length;
  const isIndeterminate = selectedRowKeys.length > 0 && selectedRowKeys.length < credentials.length;

  // Helper function to get editing menu items (Save/Cancel)
  const getEditingMenuItems = useCallback((): ActionMenuItem[] => {
    return [
      { label: 'Save', onClick: () => handleSaveAsset(), colorScheme: 'green', variant: 'outline' },
      { label: 'Cancel', onClick: () => handleCancelEdit(), colorScheme: 'gray', variant: 'outline' }
    ];
  }, [handleSaveAsset, handleCancelEdit]);

  // Helper function to add Edit Asset menu item if not locked and not temporary password
  const addEditAssetMenuItem = useCallback((items: ActionMenuItem[], selectedCredential: AssetCredential, isLocked: boolean, isTemporaryPassword: boolean) => {
    if (!isLocked && !isTemporaryPassword) {
      items.push({ label: 'Edit Asset', onClick: () => handleEditAsset(selectedCredential), colorScheme: 'orange', variant: 'outline' });
    }
  }, [handleEditAsset]);

  // Helper function to build action menu items for database assets
  const buildDatabaseMenuItems = useCallback((selectedCredential: AssetCredential, isEditing: boolean): ActionMenuItem[] => {
    const asset = selectedCredential.asset as Asset;
    const isLocked = asset?.locked ?? false;
    const lockType = asset?.lockType;
    const isTemporaryPassword = selectedCredential.isTemporaryPassword ?? false;
    
    // If editing, show only Save and Cancel buttons
    if (isEditing) {
      return getEditingMenuItems();
    }
    
    const items: ActionMenuItem[] = [];
    
    // Only add Edit Asset if asset is not locked and not temporary password
    addEditAssetMenuItem(items, selectedCredential, isLocked, isTemporaryPassword);
    
    items.push(
      { label: 'Relinquish Credential', onClick: () => { setSelectedCredential(selectedCredential); setIsDelDlgOpen(true); }, colorScheme: 'red', variant: 'outline' }
    );
    
    // Only add View Access if not temporary password
    if (!isTemporaryPassword) {
      items.push(
        { label: 'View Access', onClick: () => viewAssetAccess(selectedCredential), colorScheme: 'blue', variant: 'outline', isDisabled: isLocked }
      );
    }
    
    // Only add Lockout/Unlock if not locked and not temporary password
    if (!isLocked && !isTemporaryPassword) {
      if (lockType === LockType.LOCK_ALL_DB_USERS) {
        items.push({ label: 'Unlock', onClick: () => handleUnlockAsset(selectedCredential), colorScheme: 'green', variant: 'outline' });
      } else {
        items.push({ label: 'Lockout', onClick: () => handleLockAsset(selectedCredential), colorScheme: 'orange', variant: 'outline' });
      }
    }
    
    if (!selectedCredential.isTemporaryPassword && !isLocked) {
      items.push({ label: 'Query Database', onClick: () => handleOpenQuery(asset), colorScheme: 'green', variant: 'outline' });
    }

    if (!hasDatabaseCredentials(selectedCredential)) {
      items.push({ label: 'Set Credential', onClick: () => { setSelectedCredential(selectedCredential); setIsDialogOpen(true); }, colorScheme: 'green', variant: 'outline' });
      return items;
    }
    
    items.push(
      { label: 'Update Credential', onClick: () => { setSelectedCredential(selectedCredential); setIsDialogOpen(true); }, colorScheme: 'yellow', variant: 'outline' },
    );
    return items;
  }, [getEditingMenuItems, addEditAssetMenuItem, viewAssetAccess, handleOpenQuery, handleLockAsset, handleUnlockAsset, hasDatabaseCredentials, setSelectedCredential, setIsDialogOpen, setIsDelDlgOpen]);

  // Helper function to build action menu items for Unix server assets
  const buildUnixServerMenuItems = useCallback((selectedCredential: AssetCredential, isEditing: boolean): ActionMenuItem[] => {
    const asset = selectedCredential.asset as Asset;
    const isLocked = asset?.locked ?? false;
    const isTemporaryPassword = selectedCredential.isTemporaryPassword ?? false;
    
    // If editing, show only Save and Cancel buttons
    if (isEditing) {
      return getEditingMenuItems();
    }
    
    const items: ActionMenuItem[] = [];
    
    // Only add Edit Asset if asset is not locked and not temporary password
    addEditAssetMenuItem(items, selectedCredential, isLocked, isTemporaryPassword);
    
    if (!hasSSHCredentials(selectedCredential)) {
      items.push({ label: 'Set SSH Credential', onClick: () => { setSelectedCredential(selectedCredential); setIsSSHDialogOpen(true); }, colorScheme: 'green', variant: 'outline' });
      return items;
    }
    
    items.push(
      { label: 'Terminal Access', onClick: () => handleOpenTerminal(selectedCredential.asset as Asset), colorScheme: 'purple', variant: 'outline' },
      { label: 'Update SSH Credential', onClick: () => { setSelectedCredential(selectedCredential); setIsSSHDialogOpen(true); }, colorScheme: 'yellow', variant: 'outline' },
      { label: 'Relinquish SSH Credential', onClick: () => { setSelectedCredential(selectedCredential); setIsDelDlgOpen(true); }, colorScheme: 'red', variant: 'outline' }
    );
    return items;
  }, [getEditingMenuItems, addEditAssetMenuItem, hasSSHCredentials, handleOpenTerminal, setSelectedCredential, setIsSSHDialogOpen, setIsDelDlgOpen]);

  // Build action menu items based on selected rows
  const actionMenuItems: ActionMenuItem[] = useMemo(() => {
    const singleSelected = selectedRows.length === 1;
    const selectedCredential = singleSelected ? selectedRows[0] : null;

    if (!selectedCredential || !singleSelected) {
      return [];
    }

    const isEditing = editingAssetId === selectedCredential.asset?.id;
    const assetType = selectedCredential.asset?.type;
    
    if (assetType === 'DATABASE') {
      return buildDatabaseMenuItems(selectedCredential, isEditing);
    }
    if (assetType === 'UNIX_SERVER') {
      return buildUnixServerMenuItems(selectedCredential, isEditing);
    }
    
    // For other asset types, show Edit/Save/Cancel based on editing state
    if (isEditing) {
      return [
        { label: 'Save', onClick: () => handleSaveAsset(), colorScheme: 'green', variant: 'outline' },
        { label: 'Cancel', onClick: () => handleCancelEdit(), colorScheme: 'gray', variant: 'outline' }
      ];
    }
    
    return [{ label: 'Edit Asset', onClick: () => handleEditAsset(selectedCredential), colorScheme: 'orange', variant: 'outline' }];
  }, [selectedRows, editingAssetId, buildDatabaseMenuItems, buildUnixServerMenuItems, handleEditAsset, handleSaveAsset, handleCancelEdit]);

  const renderAssetCell = (asset: Asset | undefined, field: keyof Asset, isEditing: boolean) => {
    if (!asset) return '-';

    // Only allow editing of specific fields (type, databaseType, and unixServerType are read-only)
    const editableFields = ['name', 'description', 'hostAddress', 'portNumber', 'databaseName'];

    if (isEditing && editableFields.includes(field)) {
      const fieldKey = field as keyof AssetDTO;
      return (
        <Input
          size="sm"
          value={String(editFormState[fieldKey] || '')}
          onChange={(e) => setEditFormState(prev => ({ ...prev, [fieldKey]: e.target.value }))}
          onClick={(e) => e.stopPropagation()}
          borderColor={inputBorderColor}
          borderWidth="1px"
          _focus={{
            borderColor: inputFocusBorderColor,
            boxShadow: `0 0 0 1px ${inputFocusBorderColor}`
          }}
        />
      );
    }

    // For read-only fields (type, databaseType, unixServerType), show the original asset value
    const value = asset[field];
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '-';
  };

  // Helper function to render table rows
  const renderTableRows = () => {
    if (credentials.length === 0) {
      return (
        <Tr>
          <Td colSpan={11} textAlign={'center'}>
            <FormattedMessage id="text.no_asset_credentials" />
          </Td>
        </Tr>
      );
    }

    return (
      <>
        {credentials.map((credential) => {
          if (!credential.id) return null;
          const isEditing = editingAssetId === credential.asset?.id;
          const isDatabase = isDatabaseAsset(credential.asset?.type);
          const isRowSelected = selectedRowKeys.includes(String(credential.id));
          const isSelectedCredential = credential.asset?.id === selectedCredential?.asset?.id;
          const rowBackgroundStyle = getRowBackgroundStyle(isRowSelected, isSelectedCredential);

          return (
            <Tr
              key={credential.id}
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
                if (credential.id) {
                  handleCredentialRowClick(credential.id);
                }
                setSelectedCredential(credential);
              }}
            >
              <Td onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  isChecked={isRowSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    credential.id && handleCredentialCheckboxClick(credential.id, e.target.checked);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Td>
              <Td>
                <Flex align="center" gap={2}>
                  {renderAssetCell(credential.asset, 'name', isEditing)}
                  {/* Show fire icon if credential needs setup */}
                  {needsCredentialSetup(credential) && (
                    <Tooltip label="Credential setup required" placement="top" hasArrow>
                      <Box display="inline-flex" cursor="pointer">
                        <Icon as={FaFire} color="red.500" boxSize={4} />
                      </Box>
                    </Tooltip>
                  )}
                </Flex>
              </Td>
              <Td>{credential.asset?.type}</Td>
              <Td>{isDatabase ? (credential.asset?.databaseType ?? '-') : (credential.asset?.unixServerType ?? '-')}</Td>
              <Td>{renderAssetCell(credential.asset, 'hostAddress', isEditing)}</Td>
              <Td>{renderAssetCell(credential.asset, 'portNumber', isEditing)}</Td>
              <Td>{isDatabase ? renderAssetCell(credential.asset, 'databaseName', isEditing) : '-'}</Td>
              <Td>{renderAssetCell(credential.asset, 'description', isEditing)}</Td>
              <Td textAlign={'center'}>
                {(() => {
                  const asset = credential.asset;
                  const isLocked = asset?.locked ?? false;
                  const lockType = asset?.lockType;
                  
                  // Show lock status if asset is locked OR if lockType is LOCK_ALL_DB_USERS
                  const shouldShowLocked = isLocked || lockType === LockType.LOCK_ALL_DB_USERS;
                  
                  if (!shouldShowLocked) {
                    return <Text mb={0} color="gray.400">-</Text>;
                  }
                  
                  // Show "Locked for all users" if lockType is LOCK_ALL_DB_USERS, otherwise "Locked"
                  const lockStatusText = lockType === LockType.LOCK_ALL_DB_USERS 
                    ? 'Locked for all users' 
                    : 'Locked';
                  
                  return (
                    <Badge colorScheme="red" variant="solid">
                      {lockStatusText}
                    </Badge>
                  );
                })()}
              </Td>
            </Tr>
          );
        })}
      </>
    );
  };

  return (
    <DamBasePage
      title={intl.formatMessage({ id: 'text.asset_owner' })}>
      <VStack spacing={0} align="stretch">
        {/* New Assets Alert Banner */}
        {showNewAssetsAlert && newAssetsRequiringCredentials.length > 0 && (
          <Alert status="warning" mb={4} borderRadius="md">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle fontSize="md">
                <FormattedMessage id="text.new_assets_require_credentials" />
              </AlertTitle>
              <AlertDescription fontSize="sm">
                <FormattedMessage
                  id="text.credential_setup_required"
                  values={{ count: newAssetsRequiringCredentials.length }}
                />
              </AlertDescription>
            </Box>
            <CloseButton
              position="absolute"
              right="8px"
              top="8px"
              onClick={() => setShowNewAssetsAlert(false)}
            />
          </Alert>
        )}
        {/* Tab Navigation */}
        <Flex mt={4} borderBottom="1px" borderColor={borderColor}>
          <TabButton
            tab="assets"
            activeTab={activeTab}
            onTabClick={setActiveTab}
            icon={<FiDatabase />}
            messageId="text.assets"
          />
          <TabButton
            tab="approvals"
            activeTab={activeTab}
            onTabClick={setActiveTab}
            icon={<FiCheckCircle />}
            messageId="text.asset_request_approvals"
          />
          <TabButton
            tab="changes"
            activeTab={activeTab}
            onTabClick={setActiveTab}
            icon={<FiEdit />}
            messageId="text.change_requests"
          />
          <TabButton
            tab="masking"
            activeTab={activeTab}
            onTabClick={setActiveTab}
            icon={<FiShield />}
            messageId="text.data_masking"
          />
        </Flex>

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <Flex mt={2} flexDirection={'column'} gap={2}>
            <DamCard mt={0}>
              <DamCardBody>
                {/* AWS-style Header with Selection Count and Actions */}
                <Flex justify="space-between" align="center" my={2} minH="32px" gap={2} pl={2}>
                  <Flex align="center" gap={2} minH="32px">
                    <Text fontSize="md" fontWeight="semibold" mb={0} lineHeight="32px">
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
                  <Table variant='simple' id="tblAssetCredentials" size="sm">
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
                        <Th><FormattedMessage id='text.asset_subtype' /></Th>
                        <Th><FormattedMessage id='text.host_address' /></Th>
                        <Th><FormattedMessage id='text.port_number' /></Th>
                        <Th><FormattedMessage id='text.database_name' /></Th>
                        <Th><FormattedMessage id='text.description' /></Th>
                        <Th textAlign="center">
                          <Text whiteSpace="pre-line" mb={0}>
                            <FormattedMessage id='text.lock_status' />
                          </Text>
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody maxHeight={500}>
                      {renderTableRows()}
                    </Tbody>
                  </Table>
                </TableContainer>
              </DamCardBody>
            </DamCard>
            <Flex mt={6} />
          </Flex>
        )}

        {/* Asset Request Approvals Tab */}
        {activeTab === 'approvals' && (
          <Flex mt={2} flexDirection={'column'} gap={2}>
            <AssetRequestApprovals />
          </Flex>
        )}

        {/* Change Requests Tab */}
        {activeTab === 'changes' && (
          <Flex mt={2} flexDirection={'column'} gap={2}>
            <ChangeRequests />
          </Flex>
        )}

        {/* Data Masking Tab */}
        {activeTab === 'masking' && (
          <Flex flexDirection={'column'} gap={2} mt={2}>
            <DamCard>
              <DamCardBody>
                <Flex alignItems={'center'} mb={4} p={2} justifyContent={'flex-end'} w='full'>
                  <Button colorScheme="blue" onClick={openAIModal}>
                    Add Masking Policy
                  </Button>
                </Flex>
                <MaskingPolicies ref={maskingPoliciesRef} />
              </DamCardBody>
            </DamCard>

            {/* AI Data Masking Assistant Modal */}
            <Modal isOpen={isAIModalOpen} onClose={closeAIModal} size="6xl">
              <ModalOverlay />
              <ModalContent maxW="90vw">
                <ModalHeader>AI Data Masking Assistant</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <AIMaskingChat
                    credentials={credentials}
                    onPolicyCreated={() => { handlePolicyCreated(); closeAIModal(); }}
                  />
                </ModalBody>
              </ModalContent>
            </Modal>

          </Flex>
        )}


        <SetCredentialDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSubmit={handleSetCredential}
          showPasswordWarning={true}
          assetName={selectedCredential?.asset?.name}
          usernamePlaceholder="Enter DB Username"
          passwordPlaceholder="Enter DB Password"
          confirmPasswordPlaceholder="Re-enter DB Password"
          titleId={selectedCredential && hasDatabaseCredentials(selectedCredential) ? "text.update_credential" : "text.set_credential"}
          saveButtonTextId={selectedCredential && hasDatabaseCredentials(selectedCredential) ? "text.update" : "text.save"}
        />

        <SetSSHCredentialDialog
          isOpen={isSSHDialogOpen}
          onClose={() => setIsSSHDialogOpen(false)}
          onSubmit={handleSetSSHCredential}
          showSSHKeyWarning={true}
        />

        <DamAlertDialog
          isOpen={isDelDlgOpen}
          onClose={() => setIsDelDlgOpen(false)}
          onConfirm={handleRelinquish}
          title="text.relinquish_credential"
          message="text.are_you_sure_relinquish_credential"
          confirmButtonId="btnConfirmRelinquish"
        />

        {/* View Access Modal */}
        <DamViewAccessModal
          isOpen={isViewAccessModalOpen}
          onClose={closeViewAccessModal}
          asset={viewAccessAsset}
          assetAccessData={assetAccessData}
          isLoading={isLoadingAccess}
          error={accessError}
        />

        {/* Terminal Modal */}
        {terminalAsset && (() => {
          const user = state.session.user;
          const userAccessType = userHasRole(user, USER_ROLE.ASSET_OWNER) ? USER_ROLE.ASSET_OWNER : undefined;
          return (
            <DamTerminalModal
              isOpen={isTerminalModalOpen}
              onClose={handleCloseTerminal}
              asset={terminalAsset}
              userAccessType={userAccessType}
            />
          );
        })()}

        {/* Asset Lock Dialog */}
        <AssetLockDialog
          isOpen={isLockDialogOpen}
          onClose={closeLockDialog}
          asset={lockDialogAsset}
          action={lockDialogAction}
          onConfirm={handleLockConfirm}
          isLoading={isLockLoading}
        />

      </VStack>
    </DamBasePage>
  );
}