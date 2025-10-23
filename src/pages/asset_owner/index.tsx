import {
  Button, Flex, Tr, Tbody, Table, TableContainer, Td, Th, Thead,
  useColorModeValue, Input, IconButton, Tooltip, VStack,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody,
  useDisclosure,
  Alert, AlertIcon, AlertTitle, AlertDescription, CloseButton, Box
} from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { DamCardBody, DamCard, request, useDamToast, TextCardHeader, DamCardDivider, stateActions } from "@common/index";
import { AssetCredential } from "@models/assets/AssetCredential";
import { Asset } from "@models/assets/Asset";
import { AssetDTO } from "@models/assets/AssetDTO";
import { useEffect, useState, useRef } from "react";
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
import { FiEdit, FiSave, FiX, FiShield, FiDatabase, FiTerminal, FiSearch, FiCheckCircle } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";

export const isSearchable = true;
export const displayName = 'Asset Owner Main Page';

type ActiveTab = 'assets' | 'approvals' | 'changes' | 'masking';

export function Component() {
  const { showError, showSuccess } = useDamToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [credentials, setCredentials] = useState<AssetCredential[]>([]);
  const [selectedCredential, setSelectedCredential] = useState<AssetCredential | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSSHDialogOpen, setIsSSHDialogOpen] = useState(false);
  const [isDelDlgOpen, setIsDelDlgOpen] = useState(false);
  const [isTerminalModalOpen, setIsTerminalModalOpen] = useState(false);
  const [terminalAsset, setTerminalAsset] = useState<Asset | null>(null);
  const [editingAssetId, setEditingAssetId] = useState<number | null>(null);
  const [editFormState, setEditFormState] = useState<AssetDTO>({
    name: '',
    description: '',
    hostAddress: '',
    portNumber: '',
    databaseName: '',
    type: undefined,
    databaseType: undefined,
    unixServerType: undefined
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('assets');
  const [newAssetsRequiringCredentials, setNewAssetsRequiringCredentials] = useState<AssetCredential[]>([]);
  const [showNewAssetsAlert, setShowNewAssetsAlert] = useState(false);

  // Check for tab preference from dashboard or URL parameters
  useEffect(() => {
    // Check URL parameters first
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');

    if (tabParam && ['assets', 'approvals', 'changes', 'masking'].includes(tabParam)) {
      setActiveTab(tabParam as ActiveTab);
      // Clean up URL parameter
      const newUrl = location.pathname;
      navigate(newUrl, { replace: true });
    } else {
      // Check session storage for saved tab preference
      const savedTab = sessionStorage.getItem('asset_owner_active_tab');
      if (savedTab && ['assets', 'approvals', 'changes', 'masking'].includes(savedTab)) {
        setActiveTab(savedTab as ActiveTab);
        sessionStorage.removeItem('asset_owner_active_tab');
      }
    }
  }, [location.search, navigate]);
  const selectedRowBg = useColorModeValue('gray.200', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

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

  const fetchAssignedCredentials = () => {
    stateActions.addLoading();
    request('/api/asset_owner/assets/credentials', {})
      .then((res) => {
        if (res.length > 0) {
          setCredentials(res);

          // Check for new assets that need credential setup
          const newAssets = res.filter((credential: AssetCredential) =>
            !credential.username && !credential.sshKeyFile
          );

          if (newAssets.length > 0) {
            setNewAssetsRequiringCredentials(newAssets);
            setShowNewAssetsAlert(true);

            // Show alert to user about new assets requiring credentials
            showSuccess({
              title: intl.formatMessage({ id: 'text.new_assets_require_credentials' }),
              description: intl.formatMessage(
                { id: 'text.credential_setup_required' },
                { count: newAssets.length }
              )
            });
          } else {
            setNewAssetsRequiringCredentials([]);
            setShowNewAssetsAlert(false);
          }
        } else {
          setCredentials([]);
        }
      })
      .catch((e) => {
        showError({
          description: intl.formatMessage({ id: 'text.error_occurred_get_asset_credentials' }),
        });
      })
      .finally(() => {
        stateActions.subLoading();
      });
  }
  useEffect(() => {
    fetchAssignedCredentials();
  }, []);
  const intl = useIntl();

  const handleSetCredential = (username: string, password: string) => {
    if (!selectedCredential) return;
    stateActions.addLoading();

    // Determine if it's a database or SSH credential based on asset type
    const isDatabase = selectedCredential.asset?.type === 'DATABASE';

    if (isDatabase) {
      // For database credentials, set username and password
      request(`/api/asset_owner/assets/credentials/${selectedCredential.id}`, {
        method: 'POST',
        data: { username, password }
      })
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
        });
    }
  };

  const handleSetSSHCredential = (username: string, sshPrivateKey: string) => {
    if (!selectedCredential) return;
    stateActions.addLoading();

    // Determine if it's a Unix Server credential based on asset type
    const isUnixServer = selectedCredential.asset?.type === 'UNIX_SERVER';

    if (isUnixServer) {


      // Update existing SSH credentials
      request(`/api/asset_owner/assets/ssh-credentials/${selectedCredential.id}`, {
        method: 'PUT',
        data: { username, sshKeyFile: sshPrivateKey }
      })
        .then(() => {
          showSuccess({
            description: intl.formatMessage({ id: 'text.ssh_credentials_set_success' }),
          });
          fetchAssignedCredentials();
        })
        .catch((e) => {
          showError({
            description: e.data?.error ?? intl.formatMessage({ id: 'text.error_occurred_setting_ssh_credentials' }),
          });
        });
    }
  };

  const handleRelinquish = () => {
    if (!selectedCredential) return;
    setIsDelDlgOpen(false);
    stateActions.addLoading();

    // Determine if it's a database or SSH credential based on asset type
    const isDatabase = selectedCredential.asset?.type === 'DATABASE';
    const isUnixServer = selectedCredential.asset?.type === 'UNIX_SERVER';

    if (isDatabase) {
      // For database credentials, clear username and password
      request(`/api/asset_owner/assets/credentials/${selectedCredential.id}`, {
        method: 'DELETE'
      })
        .then(() => {
          showSuccess({
            description: intl.formatMessage({ id: 'text.credentials_relinquished_success' }),
          });
          fetchAssignedCredentials();
        })
        .catch((e) => {
          showError({
            description: e.data?.error ?? intl.formatMessage({ id: 'text.error_occurred_relinquishing_credentials' }),
          });
        });
    } else if (isUnixServer) {
      // For SSH credentials, clear username and sshKeyFile using the SSH credentials endpoint
      request(`/api/asset_owner/assets/ssh-credentials/${selectedCredential.id}`, {
        method: 'DELETE'
      })
        .then(() => {
          showSuccess({
            description: intl.formatMessage({ id: 'text.ssh_credentials_relinquished_success' }),
          });
          fetchAssignedCredentials();
        })
        .catch((e) => {
          showError({
            description: e.data?.error ?? intl.formatMessage({ id: 'text.error_occurred_relinquishing_ssh_credentials' }),
          });
        });
    }
  };

  const handleEditAsset = (credential: AssetCredential) => {
    if (!credential.asset) return;
    setEditingAssetId(credential.asset.id || null);
    setEditFormState({
      name: credential.asset.name,
      description: credential.asset.description,
      hostAddress: credential.asset.hostAddress,
      portNumber: credential.asset.portNumber,
      databaseName: credential.asset.databaseName,
      type: credential.asset.type,
      databaseType: credential.asset.databaseType,
      unixServerType: credential.asset.unixServerType,
    });
  };

  const handleSaveAsset = () => {
    if (!editingAssetId) return;
    stateActions.addLoading();


    request(`/api/asset_owner/assets/${editingAssetId}`, {
      method: 'POST',
      data: editFormState
    })
      .then(() => {
        showSuccess({
          description: intl.formatMessage({ id: 'text.asset_updated_success' }),
        });
        setEditingAssetId(null);
        setEditFormState({
          name: '',
          description: '',
          hostAddress: '',
          portNumber: '',
          databaseName: '',
          type: undefined,
          databaseType: undefined,
          unixServerType: undefined
        });
        fetchAssignedCredentials();
      })
      .catch((e) => {
        showError({
          description: e.data?.error ?? intl.formatMessage({ id: 'text.error_occurred_updating_asset' }),
        });
      });
  };

  const handleCancelEdit = () => {
    setEditingAssetId(null);
    setEditFormState({
      name: '',
      description: '',
      hostAddress: '',
      portNumber: '',
      databaseName: '',
      type: undefined,
      databaseType: undefined,
      unixServerType: undefined
    });
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
    navigate(`/asset_owner/query_asset?assetId=${asset.id}`);
  };

  // Helper function to render credential status buttons
  const renderCredentialStatus = (credential: AssetCredential) => {
    const isDatabase = credential.asset?.type === 'DATABASE';
    const isUnixServer = credential.asset?.type === 'UNIX_SERVER';

    if (isDatabase) {
      return renderDatabaseCredentialStatus(credential);
    }

    if (isUnixServer) {
      return renderSSHCredentialStatus(credential);
    }

    return null;
  };

  // Helper function for database credential status
  const renderDatabaseCredentialStatus = (credential: AssetCredential) => {
    const hasDatabaseCredentials = credential.username && credential.password;
    if (!hasDatabaseCredentials) {
      return (
        <Flex gap={2} justifyContent={'center'} w='full'>
          <Button
            size="sm"
            className="btn-set-credential"
            colorScheme="green"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCredential(credential);
              setIsDialogOpen(true);
            }}
          >
            <FormattedMessage id="text.set_credential" />
          </Button>
        </Flex>
      );
    }
    return (
      <Flex flexDirection={'row'} gap={2} justifyContent={'center'} w='full'>
        <Button
          size="sm"
          className="btn-update-credential"
          colorScheme="yellow"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCredential(credential);
            setIsDialogOpen(true);
          }}
        >
          <FormattedMessage id="text.update_credential" />
        </Button>
        <Button
          size="sm"
          className="btn-relinquish-credential"
          colorScheme="red"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCredential(credential);
            setIsDelDlgOpen(true);
          }}
        >
          <FormattedMessage id="text.relinquish_credential" />
        </Button>
      </Flex>
    );
  };

  // Helper function for SSH credential status
  const renderSSHCredentialStatus = (credential: AssetCredential) => {
    const hasSSHCredentials = credential.username && credential.sshKeyFile;
    if (!hasSSHCredentials) {
      return (
        <Flex gap={2} justifyContent={'center'} w='full'>
          <Button
            size="sm"
            className="btn-set-ssh-credential"
            colorScheme="green"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCredential(credential);
              setIsSSHDialogOpen(true);
            }}
          >
            <FormattedMessage id="text.set_ssh_credential" />
          </Button>
        </Flex>
      );
    }
    return (
      <Flex flexDirection={'row'} gap={2} justifyContent={'center'} w='full'>
        <Button
          size="sm"
          className="btn-update-ssh-credential"
          colorScheme="yellow"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCredential(credential);
            setIsSSHDialogOpen(true);
          }}
        >
          <FormattedMessage id="text.update_ssh_credential" />
        </Button>
        <Button
          size="sm"
          className="btn-relinquish-ssh-credential"
          colorScheme="red"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCredential(credential);
            setIsDelDlgOpen(true);
          }}
        >
          <FormattedMessage id="text.relinquish_ssh_credential" />
        </Button>
      </Flex>
    );
  };

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
        />
      );
    }

    // For read-only fields (type, databaseType, unixServerType), show the original asset value
    const value = asset[field];
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '-';
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
          <Button
            variant={activeTab === 'assets' ? 'solid' : 'ghost'}
            colorScheme={activeTab === 'assets' ? 'blue' : 'gray'}
            onClick={() => setActiveTab('assets')}
            leftIcon={<FiDatabase />}
            borderRadius="0"
            borderBottom={activeTab === 'assets' ? '2px solid' : 'none'}
            borderBottomColor={activeTab === 'assets' ? 'blue.500' : 'transparent'}
          >
            <FormattedMessage id="text.assets" />
          </Button>
          <Button
            variant={activeTab === 'approvals' ? 'solid' : 'ghost'}
            colorScheme={activeTab === 'approvals' ? 'blue' : 'gray'}
            onClick={() => setActiveTab('approvals')}
            leftIcon={<FiCheckCircle />}
            borderRadius="0"
            borderBottom={activeTab === 'approvals' ? '2px solid' : 'none'}
            borderBottomColor={activeTab === 'approvals' ? 'blue.500' : 'transparent'}
          >
            <FormattedMessage id="text.asset_request_approvals" />
          </Button>
          <Button
            variant={activeTab === 'changes' ? 'solid' : 'ghost'}
            colorScheme={activeTab === 'changes' ? 'blue' : 'gray'}
            onClick={() => setActiveTab('changes')}
            leftIcon={<FiEdit />}
            borderRadius="0"
            borderBottom={activeTab === 'changes' ? '2px solid' : 'none'}
            borderBottomColor={activeTab === 'changes' ? 'blue.500' : 'transparent'}
          >
            <FormattedMessage id="text.change_requests" />
          </Button>
          <Button
            variant={activeTab === 'masking' ? 'solid' : 'ghost'}
            colorScheme={activeTab === 'masking' ? 'blue' : 'gray'}
            onClick={() => setActiveTab('masking')}
            leftIcon={<FiShield />}
            borderRadius="0"
            borderBottom={activeTab === 'masking' ? '2px solid' : 'none'}
            borderBottomColor={activeTab === 'masking' ? 'blue.500' : 'transparent'}
          >
            <FormattedMessage id="text.data_masking" />
          </Button>
        </Flex>

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <Flex mt={2} flexDirection={'column'} gap={2}>
            <DamCard mt={0}>
              <DamCardBody>
                <DamCardDivider />

                <TableContainer width='100%'>
                  <Table variant='simple' id="tblAssetCredentials">
                    <Thead>
                      <Tr>
                        <Th><FormattedMessage id='text.name' /></Th>
                        <Th><FormattedMessage id='text.type' /></Th>
                        <Th><FormattedMessage id='text.asset_subtype' /></Th>
                        <Th><FormattedMessage id='text.host_address' /></Th>
                        <Th><FormattedMessage id='text.port_number' /></Th>
                        <Th><FormattedMessage id='text.database_name' /></Th>
                        <Th><FormattedMessage id='text.description' /></Th>
                        <Th textAlign={'center'}><FormattedMessage id='text.status' /></Th>
                        <Th textAlign={'center'}><FormattedMessage id='text.actions' /></Th>
                      </Tr>
                    </Thead>
                    <Tbody maxHeight={500}>
                      {credentials.length > 0 ? (
                        <>
                          {credentials.map((credential) => {
                            const isEditing = editingAssetId === credential.asset?.id;
                            const isDatabase = credential.asset?.type === 'DATABASE';
                            const isUnixServer = credential.asset?.type === 'UNIX_SERVER';

                            return (
                              <Tr key={credential.id}
                                backgroundColor={credential.asset?.id === selectedCredential?.asset?.id ? selectedRowBg : 'transparent'}
                                onClick={() => setSelectedCredential(credential)}>
                                <Td>{renderAssetCell(credential.asset, 'name', isEditing)}</Td>
                                <Td>{credential.asset?.type}</Td>
                                <Td>{isDatabase ? (credential.asset?.databaseType ?? '-') : (credential.asset?.unixServerType ?? '-')}</Td>
                                <Td>{renderAssetCell(credential.asset, 'hostAddress', isEditing)}</Td>
                                <Td>{renderAssetCell(credential.asset, 'portNumber', isEditing)}</Td>
                                <Td>{isDatabase ? renderAssetCell(credential.asset, 'databaseName', isEditing) : '-'}</Td>
                                <Td>{renderAssetCell(credential.asset, 'description', isEditing)}</Td>
                                <Td textAlign={'center'}>
                                  {renderCredentialStatus(credential)}
                                </Td>
                                <Td textAlign={'center'}>
                                  <Flex gap={2} justifyContent={'center'}>
                                    {isDatabase && (
                                      <>
                                        <Button
                                          size="sm"
                                          colorScheme="blue"
                                          variant="outline"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            console.log('View Access clicked for credential:', credential);
                                            viewAssetAccess(credential);
                                          }}
                                        >
                                          <FormattedMessage id="text.view_access" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          colorScheme="green"
                                          variant="outline"
                                          leftIcon={<FiSearch />}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenQuery(credential.asset as Asset);
                                          }}
                                        >
                                          <FormattedMessage id="text.query_database" />
                                        </Button>
                                      </>
                                    )}

                                    {isUnixServer && credential.username && credential.sshKeyFile && (
                                      <Button
                                        size="sm"
                                        colorScheme="purple"
                                        variant="outline"
                                        leftIcon={<FiTerminal />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenTerminal(credential.asset as Asset);
                                        }}
                                      >
                                        <FormattedMessage id="text.terminal_access" />
                                      </Button>
                                    )}

                                    {isEditing ? (
                                      <>
                                        <Tooltip label="Save changes" placement="top">
                                          <IconButton
                                            size="sm"
                                            colorScheme="green"
                                            aria-label="Save asset"
                                            icon={<FiSave />}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleSaveAsset();
                                            }}
                                          />
                                        </Tooltip>
                                        <Tooltip label="Cancel edit" placement="top">
                                          <IconButton
                                            size="sm"
                                            colorScheme="gray"
                                            aria-label="Cancel edit"
                                            icon={<FiX />}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleCancelEdit();
                                            }}
                                          />
                                        </Tooltip>
                                      </>
                                    ) : (
                                      <Tooltip label="Edit asset" placement="top">
                                        <IconButton
                                          size="sm"
                                          colorScheme="orange"
                                          variant="outline"
                                          aria-label="Edit asset"
                                          icon={<FiEdit />}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditAsset(credential);
                                          }}
                                        />
                                      </Tooltip>
                                    )}
                                  </Flex>
                                </Td>
                              </Tr>
                            );
                          })}
                        </>
                      ) : (
                        <Tr>
                          <Td colSpan={9} textAlign={'center'}>
                            <FormattedMessage id="text.no_asset_credentials" />
                          </Td>
                        </Tr>
                      )}

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
        {terminalAsset && (
          <DamTerminalModal
            isOpen={isTerminalModalOpen}
            onClose={handleCloseTerminal}
            asset={terminalAsset}
          />
        )}

      </VStack>
    </DamBasePage>
  );
}