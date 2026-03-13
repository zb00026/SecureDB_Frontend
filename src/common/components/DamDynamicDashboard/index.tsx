import { VStack, Box, Button, Text, Flex, useColorModeValue, HStack, Icon, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, useDisclosure, Skeleton, SkeletonCircle } from "@chakra-ui/react";
import { request, userHasRole, useDamToast, handleSetCredential as handleSetCredentialUtil, handleSetSSHCredential as handleSetSSHCredentialUtil } from "@common/index";
import { useIntl, FormattedMessage } from "react-intl";
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { USER_ROLE, AssetType } from "@/constants/enums";
import { User } from "@models/User";
import { AssetCredential } from "@models/assets/AssetCredential";
import { AccessRequest, ApprovalStatus } from "@models/assets/AccessRequest";
import { Asset } from "@models/assets/Asset";
import { SetCredentialDialog } from "@common/components/DamDialog/SetCredentialDialog";
import { SetSSHCredentialDialog } from "@common/components/DamDialog/SetSSHCredentialDialog";
import { AIMaskingChat } from "@pages/asset_owner/components/ai_masking_chat";
import { FiKey, FiShield, FiDatabase, FiSettings, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

interface DamDynamicDashboardProps {
  readonly user: User | null | undefined;
}

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

// Loading skeleton component
const DashboardSkeletonLoader = () => {
  const skeletonBg = useColorModeValue('gray.50', 'gray.800');
  const skeletonBorder = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <VStack spacing={5} align="stretch" mt={8} w="100%">
      {[1, 2, 3].map((index) => (
        <Box
          key={index}
          bg={skeletonBg}
          border="1px solid"
          borderColor={skeletonBorder}
          borderRadius="xl"
          p={5}
          boxShadow="lg"
        >
          <Flex align="center" gap={4} justify="space-between">
            <Flex align="flex-start" gap={4} flex="1">
              <SkeletonCircle size="12" startColor="gray.300" endColor="gray.500" />
              <Box flex="1">
                <Skeleton height="24px" width="70%" mb={2} startColor="gray.300" endColor="gray.500" />
                <Skeleton height="16px" width="85%" startColor="gray.300" endColor="gray.500" />
              </Box>
            </Flex>
            <Skeleton height="40px" width="140px" borderRadius="md" startColor="gray.300" endColor="gray.500" />
          </Flex>
        </Box>
      ))}
    </VStack>
  );
};

export function DamDynamicDashboard({ user }: DamDynamicDashboardProps) {
  const navigate = useNavigate();
  const intl = useIntl();
  const { showSuccess, showError } = useDamToast();
  
  const [newCredentials, setNewCredentials] = useState<AssetCredential[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<AccessRequest[]>([]);
  const [assetsWithCredentials, setAssetsWithCredentials] = useState<AssetCredential[]>([]);
  const [approvedAccessAssets, setApprovedAccessAssets] = useState<Asset[]>([]);
  const [isAuditLogStorageNotConfigured, setIsAuditLogStorageNotConfigured] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<AssetCredential | null>(null);
  const [isCredentialDialogOpen, setIsCredentialDialogOpen] = useState(false);
  const [isSSHCredentialDialogOpen, setIsSSHCredentialDialogOpen] = useState(false);
  const { isOpen: isMaskingModalOpen, onOpen: openMaskingModal, onClose: closeMaskingModal } = useDisclosure();
  const [selectedAssetForMasking, setSelectedAssetForMasking] = useState<AssetCredential | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  // Check for audit log storage configuration (for ADMIN users)
  useEffect(() => {
    if (user && userHasRole(user, USER_ROLE.ADMIN)) {
      request('/api/admin/settings/get-current-audit-log-storage', {
        method: 'GET',
      })
        .then((res) => {
          if (res?.bucketName === '') {
            setIsAuditLogStorageNotConfigured(true);
          } else {
            setIsAuditLogStorageNotConfigured(false);
          }
        })
        .catch((error) => {
          console.error('Failed to check audit log storage configuration:', error);
          setIsAuditLogStorageNotConfigured(true);
        });
    }
  }, [user]);

  // Check for new credentials and pending approvals (for ASSET_OWNER/ADMIN)
  useEffect(() => {
    if (user && (userHasRole(user, USER_ROLE.ASSET_OWNER) || userHasRole(user, USER_ROLE.ADMIN))) {
      setIsLoadingDashboard(true);
      
      // Check for new credentials
      request('/api/asset_owner/assets/new-credentials', {})
        .then((res) => {
          if (res && res.length > 0) {
            setNewCredentials(res);
          } else {
            setNewCredentials([]);
          }
        })
        .catch((e) => {
          console.log('Failed to check new credentials:', e);
          setNewCredentials([]);
        });

      // Check for pending approvals independently
      request('/api/asset_owner/assets/approvals', {})
        .then((res) => {
          if (res && res.length > 0) {
            // Filter to show only REQUESTED or APPROVAL_IN_PROGRESS status
            const pending = res.filter((req: AccessRequest) => 
              req.assetApproverStatus === ApprovalStatus.REQUESTED || 
              req.assetApproverStatus === ApprovalStatus.APPROVAL_IN_PROGRESS
            );
            setPendingApprovals(pending);
          } else {
            setPendingApprovals([]);
          }
        })
        .catch((e) => {
          console.log('Failed to check pending approvals:', e);
          setPendingApprovals([]);
        });

      // Fetch assigned credentials to check for assets with credentials set
      request('/api/asset_owner/assets/credentials', {})
        .then((res) => {
          if (res && res.length > 0) {
            // Filter to show only assets that have credentials set
            const withCredentials = res.filter((credential: AssetCredential) => 
              (hasDatabaseCredentials(credential) || hasSSHCredentials(credential)) && credential.asset?.type === AssetType.DATABASE
            );
            setAssetsWithCredentials(withCredentials);
          } else {
            setAssetsWithCredentials([]);
          }
        })
        .catch((e) => {
          console.log('Failed to check credentials:', e);
          setAssetsWithCredentials([]);
        })
        .finally(() => {
          setIsLoadingDashboard(false);
        });
    }
  }, [user]);

  // Check for approved access requests (for ACCESSOR)
  useEffect(() => {
    if (user && userHasRole(user, USER_ROLE.ACCESSOR)) {
      setIsLoadingDashboard(true);
      
      // Fetch accessor assets
      request('/api/accessor/assets', {})
        .then((res) => {
          if (res) {
            const allAssets = Array.isArray(res) ? res : res.content ?? [];
            // Filter to show only approved DATABASE assets that are not locked
            const approvedDatabaseAssets = allAssets.filter((asset: Asset) => 
              asset.type === AssetType.DATABASE &&
              asset.accessRequest?.assetApproverStatus === ApprovalStatus.APPROVED &&
              !asset.locked &&
              asset.accessRequest?.id
            );
            setApprovedAccessAssets(approvedDatabaseAssets);
          } else {
            setApprovedAccessAssets([]);
          }
        })
        .catch((e) => {
          console.log('Failed to check approved access assets:', e);
          setApprovedAccessAssets([]);
        })
        .finally(() => {
          setIsLoadingDashboard(false);
        });
    }
  }, [user]);

  // Helper function to refresh credentials list
  const refreshCredentialsList = () => {
    if (user && (userHasRole(user, USER_ROLE.ASSET_OWNER) || userHasRole(user, USER_ROLE.ADMIN))) {
      request('/api/asset_owner/assets/new-credentials', {})
        .then((res) => {
          setNewCredentials(res && res.length > 0 ? res : []);
        })
        .catch((e) => {
          console.log('Failed to refresh credentials:', e);
        });
    }
  };

  const handleSetCredential = (username: string, password: string, awsSecretsManagerKey?: string) => {
    if (!selectedCredential) return;
    return handleSetCredentialUtil({
      credentialId: selectedCredential.id,
      assetType: selectedCredential.asset?.type,
      username,
      password,
      awsSecretsManagerKey,
      callbacks: {
        intl,
        showSuccess,
        showError,
        onSuccess: refreshCredentialsList,
      },
    });
    // Dialog will close itself via onClose callback
  };

  const handleSetSSHCredential = (username: string, sshPrivateKey: string, awsSecretsManagerKey?: string) => {
    if (!selectedCredential) return;
    return handleSetSSHCredentialUtil({
      credentialId: selectedCredential.id,
      assetType: selectedCredential.asset?.type,
      username,
      sshPrivateKey,
      awsSecretsManagerKey,
      callbacks: {
        intl,
        showSuccess,
        showError,
        onSuccess: refreshCredentialsList,
      },
    });
    // Dialog will close itself via onClose callback
  };

  const handleOpenCredentialDialog = (credential: AssetCredential) => {
    setSelectedCredential(credential);
    const assetType = credential.asset?.type;
    if (isDatabaseAsset(assetType)) {
      setIsCredentialDialogOpen(true);
    } else if (isUnixServerAsset(assetType)) {
      setIsSSHCredentialDialogOpen(true);
    }
  };

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const errorBg = useColorModeValue('red.50', 'red.900');
  const errorBorder = useColorModeValue('red.200', 'red.700');
  const warningBg = useColorModeValue('orange.50', 'orange.900');
  const warningBorder = useColorModeValue('orange.200', 'orange.700');
  const infoBg = useColorModeValue('blue.50', 'blue.900');
  const infoBorder = useColorModeValue('blue.200', 'blue.700');
  const purpleBg = useColorModeValue('purple.50', 'purple.900');
  const purpleBorder = useColorModeValue('purple.200', 'purple.700');
  const successBg = useColorModeValue('green.50', 'green.900');
  const successBorder = useColorModeValue('green.200', 'green.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');

  // Show loading skeleton while fetching data
  if (isLoadingDashboard) {
    return <DashboardSkeletonLoader />;
  }

  // Don't render anything if there are no alerts to show
  if (!isAuditLogStorageNotConfigured && newCredentials.length === 0 && pendingApprovals.length === 0 && assetsWithCredentials.length === 0 && approvedAccessAssets.length === 0) {
    return null;
  }

  return (
    <VStack spacing={5} align="stretch" mt={8} w="100%">
      {/* Audit Log Storage Not Configured Alert */}
      {isAuditLogStorageNotConfigured && (
        <Box
          bg={errorBg}
          border="1px solid"
          borderColor={errorBorder}
          borderRadius="xl"
          p={5}
          boxShadow="lg"
          transition="all 0.2s"
          _hover={{
            boxShadow: 'xl',
            transform: 'translateY(-2px)',
          }}
        >
          <Flex align="center" gap={4} justify="space-between">
            <Flex align="flex-start" gap={4} flex="1">
              <Box
                bg="red.500"
                color="white"
                borderRadius="full"
                p={3}
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                <Icon as={FiAlertCircle} boxSize={5} />
              </Box>
              <Box flex="1">
                <Text fontSize="lg" fontWeight="semibold" color={textColor} mb={0}>
                  <FormattedMessage id="text.audit_log_storage_not_configured" />
                </Text>
                <Text fontSize="sm" color={textSecondary} mt={1} mb={0}>
                  <FormattedMessage id="text.audit_log_storage_configure_description" />
                </Text>
              </Box>
            </Flex>
            <Button
              size="md"
              colorScheme="red"
              onClick={() => navigate('/hagrids_admin/settings')}
              leftIcon={<FiSettings />}
              fontWeight="medium"
              flexShrink={0}
            >
              {intl.formatMessage({ id: 'text.settings' })}
            </Button>
          </Flex>
        </Box>
      )}

      {/* New Credentials Alerts - One per asset */}
      {newCredentials.map((credential) => (
        <Box
          key={credential.id}
          bg={warningBg}
          border="1px solid"
          borderColor={warningBorder}
          borderRadius="xl"
          p={5}
          boxShadow="lg"
          transition="all 0.2s"
          _hover={{
            boxShadow: 'xl',
            transform: 'translateY(-2px)',
          }}
        >
          <Flex align="center" gap={4} justify="space-between">
            <Flex align="flex-start" gap={4} flex="1">
              <Box
                bg="orange.500"
                color="white"
                borderRadius="full"
                p={3}
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                <Icon as={FiKey} boxSize={5} />
              </Box>
              <Box flex="1">
                <Text fontSize="lg" fontWeight="semibold" color={textColor} mb={0}>
                  {intl.formatMessage({ id: 'text.set_credential' })}
                  {intl.formatMessage(
                    { id: 'text.set_credential_for_asset' },
                    { assetName: credential.asset?.name || intl.formatMessage({ id: 'text.unknown_asset' }) }
                  )}
                </Text>
                <Text fontSize="sm" color={textSecondary} mt={1} mb={0}>
                  {intl.formatMessage({ id: 'text.new_asset_is_assigned' })}
                </Text>
              </Box>
            </Flex>
            <Button
              size="md"
              colorScheme="orange"
              onClick={() => handleOpenCredentialDialog(credential)}
              leftIcon={<FiKey />}
              fontWeight="medium"
              flexShrink={0}
            >
              {intl.formatMessage({ id: 'text.set_credential' })}
            </Button>
          </Flex>
        </Box>
      ))}

      {/* Pending Approvals Alerts - One per request */}
      {pendingApprovals.map((approval) => (
        <Box
          key={approval.id}
          bg={infoBg}
          border="1px solid"
          borderColor={infoBorder}
          borderRadius="xl"
          p={5}
          boxShadow="lg"
          transition="all 0.2s"
          _hover={{
            boxShadow: 'xl',
            transform: 'translateY(-2px)',
          }}
        >
          <Flex align="center" gap={4} justify="space-between">
            <Flex align="flex-start" gap={4} flex="1">
              <Box
                bg="blue.500"
                color="white"
                borderRadius="full"
                p={3}
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                <Icon as={FiShield} boxSize={5} />
              </Box>
              <Box flex="1">
                <Text fontSize="lg" fontWeight="semibold" color={textColor} mb={0}>
                  <FormattedMessage id="text.pending_approval_requests_found" />
                </Text>
                <VStack align="stretch" spacing={2} mt={2} mb={0}>
                  <HStack>
                    <Text fontSize="sm" fontWeight="medium" color={textSecondary} minW="100px">
                      <FormattedMessage id="text.asset_name" />:
                    </Text>
                    <Text fontSize="sm" color={textColor}>
                      {approval.assetApprovalsDTO?.name || intl.formatMessage({ id: 'text.unknown_asset' })}
                    </Text>
                  </HStack>
                  <HStack>
                    <Text fontSize="sm" fontWeight="medium" color={textSecondary} minW="100px">
                      <FormattedMessage id="text.requestor" />:
                    </Text>
                    <Text fontSize="sm" color={textColor}>
                      {`${approval.requestor?.firstName || ''} ${approval.requestor?.lastName || ''}`.trim() || intl.formatMessage({ id: 'text.unknown' })}
                    </Text>
                  </HStack>
                  {approval.requestReason && (
                    <Box mt={2} p={2} bg={cardBg} borderRadius="md" border="1px solid" borderColor={borderColor}>
                      <Text fontSize="xs" color={textSecondary} fontStyle="italic">
                        "{approval.requestReason}"
                      </Text>
                    </Box>
                  )}
                </VStack>
              </Box>
            </Flex>
            <Button
              size="md"
              colorScheme="green"
              onClick={() => navigate(`/asset_owner/access_request_details?accessRequestId=${approval.id}&assetId=${approval.assetApprovalsDTO?.id}`)}
              leftIcon={<FiCheckCircle />}
              fontWeight="medium"
              flexShrink={0}
            >
              <FormattedMessage id="text.approve" />
            </Button>
          </Flex>
        </Box>
      ))}

      {/* Assets with Credentials - Setup Masking Policy Alerts */}
      {assetsWithCredentials.map((credential) => (
        <Box
          key={credential.id}
          bg={purpleBg}
          border="1px solid"
          borderColor={purpleBorder}
          borderRadius="xl"
          p={5}
          boxShadow="lg"
          transition="all 0.2s"
          _hover={{
            boxShadow: 'xl',
            transform: 'translateY(-2px)',
          }}
        >
          <Flex align="center" gap={4} justify="space-between">
            <Flex align="flex-start" gap={4} flex="1">
              <Box
                bg="purple.500"
                color="white"
                borderRadius="full"
                p={3}
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                <Icon as={FiDatabase} boxSize={5} />
              </Box>
              <Box flex="1">
                <Text fontSize="lg" fontWeight="semibold" color={textColor} mb={0}>
                  {intl.formatMessage(
                    { id: 'text.setup_data_masking_policy_for_asset' },
                    { assetName: credential.asset?.name || intl.formatMessage({ id: 'text.unknown_asset' }) }
                  )}
                </Text>
                <Text fontSize="sm" color={textSecondary} mt={1} mb={0}>
                  {intl.formatMessage({ id: 'text.create_first_policy' })}
                </Text>
              </Box>
            </Flex>
            <Button
              size="md"
              colorScheme="purple"
              onClick={() => {
                setSelectedAssetForMasking(credential);
                openMaskingModal();
              }}
              leftIcon={<FiDatabase />}
              fontWeight="medium"
              flexShrink={0}
            >
              {intl.formatMessage({ id: 'text.add_masking_policy' })}
            </Button>
          </Flex>
        </Box>
      ))}

      {/* Approved Access Assets - Query Database Alerts (for ACCESSOR) */}
      {approvedAccessAssets.map((asset) => (
        <Box
          key={asset.id}
          bg={successBg}
          border="1px solid"
          borderColor={successBorder}
          borderRadius="xl"
          p={5}
          boxShadow="lg"
          transition="all 0.2s"
          _hover={{
            boxShadow: 'xl',
            transform: 'translateY(-2px)',
          }}
        >
          <Flex align="center" gap={4} justify="space-between">
            <Flex align="flex-start" gap={4} flex="1">
              <Box
                bg="green.500"
                color="white"
                borderRadius="full"
                p={3}
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                <Icon as={FiDatabase} boxSize={5} />
              </Box>
              <Box flex="1">
                <Text fontSize="lg" fontWeight="semibold" color={textColor} mb={0}>
                  {intl.formatMessage({ id: 'text.query_database' })} - {asset.name || intl.formatMessage({ id: 'text.unknown_asset' })}
                </Text>
                <Text fontSize="sm" color={textSecondary} mt={1} mb={0}>
                  {intl.formatMessage({ id: 'text.access_request_approved' })}
                </Text>
              </Box>
            </Flex>
            <Button
              size="md"
              colorScheme="green"
              onClick={() => {
                if (asset.id && asset.accessRequest?.id) {
                  navigate(`/accessor/assets/query_asset?assetId=${asset.id}&accessRequestId=${asset.accessRequest.id}`);
                }
              }}
              leftIcon={<FiDatabase />}
              fontWeight="medium"
              flexShrink={0}
              isDisabled={!asset.id || !asset.accessRequest?.id || asset.locked}
            >
              {intl.formatMessage({ id: 'text.query_database' })}
            </Button>
          </Flex>
        </Box>
      ))}

      {/* Credential Dialogs */}
      {selectedCredential && (
        <>
          <SetCredentialDialog
            isOpen={isCredentialDialogOpen}
            onClose={() => {
              setIsCredentialDialogOpen(false);
              setSelectedCredential(null);
            }}
            onSubmit={handleSetCredential}
            showPasswordWarning={true}
            assetName={selectedCredential.asset?.name}
            usernamePlaceholder={intl.formatMessage({ id: 'text.enter_db_username' })}
            passwordPlaceholder={intl.formatMessage({ id: 'text.enter_db_password' })}
            confirmPasswordPlaceholder={intl.formatMessage({ id: 'text.re_enter_db_password' })}
            titleId="text.set_credential"
            saveButtonTextId="text.save"
          />

          <SetSSHCredentialDialog
            isOpen={isSSHCredentialDialogOpen}
            onClose={() => {
              setIsSSHCredentialDialogOpen(false);
              setSelectedCredential(null);
            }}
            onSubmit={handleSetSSHCredential}
            showSSHKeyWarning={true}
            titleId="text.set_credential"
            saveButtonTextId="text.save"
          />
        </>
      )}

      {/* AI Data Masking Assistant Modal */}
      <Modal isOpen={isMaskingModalOpen} onClose={closeMaskingModal} size="6xl">
        <ModalOverlay />
        <ModalContent maxW="90vw">
          <ModalHeader>AI Data Masking Assistant</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <AIMaskingChat
              credentials={assetsWithCredentials}
              initialAssetId={selectedAssetForMasking?.asset?.id}
              onPolicyCreated={() => {
                closeMaskingModal();
                setSelectedAssetForMasking(null);
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
