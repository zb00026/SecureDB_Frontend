import React, { useState } from 'react';
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
  Radio,
  RadioGroup,
  Stack,
  Divider,
  Badge,
  Box,
  useColorModeValue,
  Checkbox
} from '@chakra-ui/react';
import { FormattedMessage, useIntl } from 'react-intl';
import { FiLock, FiUnlock, FiAlertTriangle, FiShield } from 'react-icons/fi';
import { Asset } from '@models/assets/Asset';

export enum LockType {
  LOCK_HAGRID_ONLY = 'lock_hagrid_only',
  LOCK_ALL_DB_USERS = 'lock_all_db_users'
}

export enum LockAction {
  LOCK = 'lock',
  UNLOCK = 'unlock'
}

interface AssetLockDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly asset: Asset | null;
  readonly action: LockAction;
  readonly onConfirm: (asset: Asset, lockAction: LockAction, lockType: LockType) => void;
  readonly isLoading?: boolean;
}

// Extract lock type description logic to reduce complexity
const useLockTypeDescription = (isLockAction: boolean) => {
  const intl = useIntl();
  
  return (lockType: LockType) => {
    const messageKeys = {
      [LockType.LOCK_HAGRID_ONLY]: isLockAction ? 'text.hagrid_lock_description' : 'text.hagrid_unlock_description',
      [LockType.LOCK_ALL_DB_USERS]: isLockAction ? 'text.database_all_lock_description' : 'text.database_all_unlock_description'
    };
    
    return intl.formatMessage({ id: messageKeys[lockType] || '' });
  };
};

// Extract confirmation message logic
const getConfirmationMessageId = (isLockAction: boolean, selectedLockType: LockType) => {
  if (isLockAction && selectedLockType === LockType.LOCK_ALL_DB_USERS) {
    return 'text.confirm_lock_all_users';
  }
  return isLockAction ? 'text.confirm_lock_action' : 'text.confirm_unlock_action';
};

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

// Extract lock type option component
const LockTypeOption = ({ 
  lockType, 
  selectedLockType, 
  setSelectedLockType, 
  textSecondary, 
  getLockTypeDescription 
}: {
  lockType: LockType;
  selectedLockType: LockType;
  setSelectedLockType: (type: LockType) => void;
  textSecondary: string;
  getLockTypeDescription: (type: LockType) => string;
}) => {
  const isHagridOnly = lockType === LockType.LOCK_HAGRID_ONLY;
  const isSelected = selectedLockType === lockType;
  
  const bgColor = isHagridOnly ? 'orange.50' : 'red.50';
  const bgColorDark = isHagridOnly ? 'orange.900' : 'red.900';
  const borderColorSelected = isHagridOnly ? 'orange.400' : 'red.400';
  const borderColorDefault = isHagridOnly ? 'orange.200' : 'red.200';
  const colorScheme = isHagridOnly ? 'orange' : 'red';
  
  const bg = useColorModeValue(bgColor, bgColorDark);
  const borderColor = isSelected ? borderColorSelected : borderColorDefault;
  
  return (
    <Box 
      p={4} 
      bg={bg} 
      borderRadius="md" 
      border="2px solid" 
      borderColor={borderColor}
      cursor="pointer"
      onClick={() => setSelectedLockType(lockType)}
    >
      <Radio value={lockType} colorScheme={colorScheme}>
        <VStack align="start" spacing={2} ml={2}>
          <HStack>
            {isHagridOnly ? <FiShield /> : <FiAlertTriangle />}
            <Text mb={0} fontWeight="bold">
              <FormattedMessage id={isHagridOnly ? 'text.hagrid_application_only' : 'text.all_database_users'} />
            </Text>
            <Badge colorScheme={colorScheme}>
              <FormattedMessage id={isHagridOnly ? 'text.recommended' : 'text.critical'} />
            </Badge>
          </HStack>
          <Text mb={0} fontSize="sm" color={textSecondary}>
            {getLockTypeDescription(lockType)}
          </Text>
        </VStack>
      </Radio>
    </Box>
  );
};

export function AssetLockDialog({
  isOpen,
  onClose,
  asset,
  action,
  onConfirm,
  isLoading = false
}: AssetLockDialogProps) {
  const intl = useIntl();
  const [selectedLockType, setSelectedLockType] = useState<LockType>(LockType.LOCK_HAGRID_ONLY);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textSecondary = useColorModeValue('gray.600', 'gray.300');
  const textSuccess = useColorModeValue('green.600', 'green.300');
  const textSuccessStrong = useColorModeValue('green.700', 'green.200');
  const successBg = useColorModeValue('green.50', 'green.900');
  const successBorder = useColorModeValue('green.200', 'green.600');
  const confirmationBg = useColorModeValue('gray.50', 'gray.700');
  const codeBg = useColorModeValue('white', 'gray.800');

  const isLockAction = action === LockAction.LOCK;
  const canConfirm = confirmationChecked && !isLoading;
  const getLockTypeDescription = useLockTypeDescription(isLockAction);

  const handleClose = () => {
    if (!isLoading) {
      setSelectedLockType(LockType.LOCK_HAGRID_ONLY);
      setConfirmationChecked(false);
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!asset || !confirmationChecked || isLoading) return;
    onConfirm(asset, action, selectedLockType);
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

  const confirmationMessageId = getConfirmationMessageId(isLockAction, selectedLockType);

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

            {/* Lock Type Selection */}
            {isLockAction && (
              <>
                <Text fontWeight="bold" fontSize="lg" mb={0}>
                  <FormattedMessage id="text.select_lock_type" />
                </Text>
                
                <RadioGroup value={selectedLockType} onChange={(value) => setSelectedLockType(value as LockType)}>
                  <Stack spacing={4}>
                    <LockTypeOption 
                      lockType={LockType.LOCK_HAGRID_ONLY}
                      selectedLockType={selectedLockType}
                      setSelectedLockType={setSelectedLockType}
                      textSecondary={textSecondary}
                      getLockTypeDescription={getLockTypeDescription}
                    />
                    <LockTypeOption 
                      lockType={LockType.LOCK_ALL_DB_USERS}
                      selectedLockType={selectedLockType}
                      setSelectedLockType={setSelectedLockType}
                      textSecondary={textSecondary}
                      getLockTypeDescription={getLockTypeDescription}
                    />
                  </Stack>
                </RadioGroup>
              </>
            )}

            {/* Unlock Information */}
            {!isLockAction && (
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