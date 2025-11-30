import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Badge,
  Box,
  useColorModeValue,
  Checkbox
} from '@chakra-ui/react';
import { FormattedMessage, useIntl } from 'react-intl';
import { FiLock, FiUnlock, FiAlertTriangle } from 'react-icons/fi';
import { Asset } from '@models/assets/Asset';

export enum LockAction {
  LOCK = 'lock',
  UNLOCK = 'unlock'
}

interface AssetLockDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly asset: Asset | null;
  readonly action: LockAction;
  readonly onConfirm: (asset: Asset, lockAction: LockAction) => void;
  readonly isLoading?: boolean;
}

// Extract asset information component
const AssetInformation = ({ asset, cardBg, borderColor }: { 
  asset: Asset; 
  cardBg: string; 
  borderColor: string; 
}) => (
  <Box p={4} bg={cardBg} borderRadius="md" border="1px solid" borderColor={borderColor}>
    <VStack align="stretch" spacing={2}>
      <Text mb={0} fontWeight="bold">
        <FormattedMessage id="text.asset_details" />:
      </Text>
      <HStack justify="space-between">
        <Text mb={0} fontSize="sm">
          <FormattedMessage id="text.name" />:
        </Text>
        <Text mb={0} fontSize="sm" fontFamily="mono">{asset.name}</Text>
      </HStack>
      <HStack justify="space-between">
        <Text mb={0} fontSize="sm">
          <FormattedMessage id="text.type" />:
        </Text>
        <Text mb={0} fontSize="sm">{asset.databaseType}</Text>
      </HStack>
      <HStack justify="space-between">
        <Text mb={0} fontSize="sm">
          <FormattedMessage id="text.host" />:
        </Text>
        <Text mb={0} fontSize="sm" fontFamily="mono">{asset.hostAddress}:{asset.portNumber}</Text>
      </HStack>
    </VStack>
  </Box>
);

export function AssetLockDialog({
  isOpen,
  onClose,
  asset,
  action,
  onConfirm,
  isLoading = false
}: AssetLockDialogProps) {
  const intl = useIntl();
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  
  // Reset checkbox state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setConfirmationChecked(false);
    }
  }, [isOpen]);
  
  // All hooks must be called before any early returns
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textSecondary = useColorModeValue('gray.600', 'gray.300');
  const textSuccess = useColorModeValue('green.600', 'green.300');
  const textSuccessStrong = useColorModeValue('green.700', 'green.200');
  const successBg = useColorModeValue('green.50', 'green.900');
  const successBorder = useColorModeValue('green.200', 'green.600');
  const confirmationBg = useColorModeValue('gray.50', 'gray.700');
  const orangeBg = useColorModeValue('orange.50', 'orange.900');
  const orangeBorder = useColorModeValue('orange.200', 'orange.600');
  const orangeText = useColorModeValue('orange.700', 'orange.200');
  const orangeTextSecondary = useColorModeValue('orange.600', 'orange.300');
  const codeBg = useColorModeValue('white', 'gray.800');

  const isLockAction = action === LockAction.LOCK;
  const canConfirm = confirmationChecked && !isLoading;

  const handleClose = () => {
    if (!isLoading) {
      setConfirmationChecked(false);
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!asset || !confirmationChecked || isLoading) return;
    onConfirm(asset, action);
  };

  if (!asset) return null;

  // Simplified UI configuration objects
  const headerConfig = {
    icon: isLockAction ? <FiLock color="red" /> : <FiUnlock color="green" />,
    messageId: isLockAction ? 'text.lock_asset_access' : 'text.unlock_asset_access',
    badgeScheme: isLockAction ? 'red' : 'green'
  };

  const warningConfig = {
    actionMessageId: isLockAction ? 'text.lock_out_users_from' : 'text.unlock_users_for'
  };

  const confirmationMessageId = isLockAction ? 'text.confirm_lock_action' : 'text.confirm_unlock_action';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" closeOnOverlayClick={!isLoading}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack spacing={3}>
            {headerConfig.icon}
            <Text mb={0}>
              <FormattedMessage id={headerConfig.messageId} />
            </Text>
            <Badge colorScheme={headerConfig.badgeScheme} fontSize="sm">
              {asset.name}
            </Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton isDisabled={isLoading} />
        
        <ModalBody>
          <VStack spacing={2} align="stretch">
            {/* Critical Warning */}
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>
                  <FiAlertTriangle style={{ display: 'inline', marginRight: '8px' }} />
                  <FormattedMessage id="text.critical_operation" />
                </AlertTitle>
                <AlertDescription>
                  <FormattedMessage 
                    id="text.critical_operation_warning"
                    values={{
                      action: intl.formatMessage({ id: warningConfig.actionMessageId }),
                      assetName: <strong>{asset.name}</strong>
                    }}
                  />
                </AlertDescription>
              </Box>
            </Alert>

            {/* Asset Information */}
            <AssetInformation asset={asset} cardBg={cardBg} borderColor={borderColor} />

            {/* Lock/Unlock Information */}
            {isLockAction ? (
              <Box p={4} bg={orangeBg} borderRadius="md" border="1px solid" borderColor={orangeBorder}>
                <VStack align="stretch" spacing={2}>
                  <HStack>
                    <FiLock color="orange" />
                    <Text mb={0} fontWeight="bold" color={orangeText}>
                      <FormattedMessage id="text.lock_operation" />
                    </Text>
                  </HStack>
                  <Text mb={0} fontSize="sm" color={orangeTextSecondary}>
                    <FormattedMessage id="text.lock_description" />
                  </Text>
                </VStack>
              </Box>
            ) : (
              <Box p={4} bg={successBg} borderRadius="md" border="1px solid" borderColor={successBorder}>
                <VStack align="stretch" spacing={2}>
                  <HStack>
                    <FiUnlock color="green" />
                    <Text mb={0} fontWeight="bold" color={textSuccessStrong}>
                      <FormattedMessage id="text.unlock_operation" />
                    </Text>
                  </HStack>
                  <Text mb={0} fontSize="sm" color={textSuccess}>
                    <FormattedMessage id="text.unlock_restore_description" />
                  </Text>
                  <Text mb={0} fontSize="xs" fontFamily="mono" bg={codeBg} p={2} borderRadius="md">
                    <FormattedMessage
                      id="text.unlock_statements_description"
                      values={{ databaseType: asset.databaseType }}
                    />
                  </Text>
                </VStack>
              </Box>
            )}

            <Divider />

            {/* Confirmation Checkbox */}
            <Box p={4} bg={confirmationBg} borderRadius="md">
              <Checkbox
                isChecked={confirmationChecked}
                onChange={(e) => setConfirmationChecked(e.target.checked)}
                colorScheme={isLockAction ? 'red' : 'green'}
                size="lg"
              >
                <VStack align="start" ml={2} gap={0}>
                  <Text mb={0} fontWeight="bold">
                    <FormattedMessage id="text.understand_implications" />
                  </Text>
                  <Text mb={0} fontSize="sm" color={textSecondary}>
                    <FormattedMessage 
                      id={confirmationMessageId}
                      values={{ assetName: asset.name }}
                    />
                  </Text>
                </VStack>
              </Checkbox>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button 
              variant="outline" 
              onClick={handleClose}
              isDisabled={isLoading}
            >
              <FormattedMessage id="text.cancel" />
            </Button>
            <Button
              colorScheme={isLockAction ? 'red' : 'green'}
              onClick={handleConfirm}
              isLoading={isLoading}
              loadingText={intl.formatMessage({ id: isLockAction ? 'text.locking' : 'text.unlocking' })}
              isDisabled={!canConfirm}
              leftIcon={isLockAction ? <FiLock /> : <FiUnlock />}
            >
              <FormattedMessage id={isLockAction ? 'text.lock_access' : 'text.unlock_access'} />
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

