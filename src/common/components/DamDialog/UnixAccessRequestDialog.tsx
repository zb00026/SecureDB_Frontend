import { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, VStack, Text, useColorModeValue, Divider, FormControl,
  FormLabel, Input, Textarea, Checkbox, CheckboxGroup, Stack, Alert,
  AlertIcon, AlertDescription,
  Flex
} from '@chakra-ui/react';
import { FormattedMessage } from 'react-intl';
import { Asset } from '@models/assets/Asset';
import { UnixGroup } from '@models/assets/AccessRequest';
import { UnixAccessRequestDTO } from '@models/assets/UnixAccessRequest';
import { request, useDamToast } from '@common/index';
import { ExpirationInput } from '@common/components/DamExpirationInput';

interface UnixAccessRequestDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly asset: Asset;
  readonly onSuccess?: () => void;
}

export function UnixAccessRequestDialog({
  isOpen,
  onClose,
  asset,
  onSuccess
}: UnixAccessRequestDialogProps) {
  const { showError, showSuccess } = useDamToast();
  const [isLoading, setIsLoading] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<UnixGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [requestData, setRequestData] = useState<UnixAccessRequestDTO>({
    assetId: asset.id || 0,
    requestReason: '',
    requestedUsername: '',
    requestedGroupIds: [],
    expirationHours: 180 * 24
  });
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [expirationDays, setExpirationDays] = useState<number>(180);
  const [expirationHours, setExpirationHours] = useState<number>(0);

  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  
  // Color values for consistent theming
  const gray600 = useColorModeValue('gray.600', 'gray.300');
  const gray400 = useColorModeValue('gray.400', 'gray.500');

  // Fetch available groups for this asset
  useEffect(() => {
    if (isOpen && asset.id) {
      fetchAvailableGroups();
    }
  }, [isOpen, asset.id]);

  const fetchAvailableGroups = async () => {
    try {
      setIsLoading(true);
      const groups = await request(`/api/accessor/unix-access/assets/${asset.id}/groups`, {});
      setAvailableGroups(groups);
    } catch (error: any) {
      showError({
        description: error.data?.error || 'Failed to load available groups'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateUsername = (username: string): string | null => {
    if (!username.trim()) {
      return 'Username is required';
    }
    
    // Unix username rules: 3-32 characters, lowercase letters, numbers, and underscores only
    const usernameRegex = /^[a-z0-9_]{3,32}$/;
    if (!usernameRegex.test(username)) {
      return 'Username must be 3-32 characters, lowercase letters, numbers, and underscores only';
    }
    
    // Cannot start with a number
    if (/^\d/.test(username)) {
      return 'Username cannot start with a number';
    }
    
    return null;
  };

  const handleSubmit = async () => {
    if (!requestData.requestReason.trim()) {
      showError({
        description: 'Request reason is required'
      });
      return;
    }

    const usernameError = validateUsername(requestData.requestedUsername);
    if (usernameError) {
      showError({
        description: usernameError
      });
      return;
    }

    if (selectedGroupIds.length === 0) {
      showError({
        description: 'At least one group must be selected'
      });
      return;
    }

    try {
      setIsLoading(true);
      const expHrs = expirationHours + (expirationDays * 24);
      const submitData = {
        ...requestData,
        requestedGroupIds: selectedGroupIds.map(Number),
        expirationHours: expHrs
      };

      await request('/api/accessor/unix-access/requests', {
        method: 'POST',
        data: submitData
      });

      showSuccess({
        description: 'Unix access request submitted successfully'
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      showError({
        description: error.data?.error || 'Failed to submit Unix access request'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setRequestData({
      assetId: asset.id || 0,
      requestReason: '',
      requestedUsername: '',
      requestedGroupIds: [],
      expirationHours: 180 * 24
    });
    setSelectedGroupIds([]);
    setUsernameError(null);
    setExpirationDays(180);
    setExpirationHours(0);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent bg={bgColor} maxH="90vh">
        <ModalHeader color={textColor}>
          <VStack align="start" spacing={2}>
            <Text fontSize="lg" fontWeight="bold" mb={0}>
              <FormattedMessage id="text.request_unix_access" />
            </Text>
            <Text fontSize="sm" color={gray600} mb={0}>
              Asset: {asset.name} ({asset.hostAddress})
            </Text>
          </VStack>
        </ModalHeader>
        <Divider />
        <ModalBody overflowY="auto">
          <VStack spacing={4} align="stretch">
            <Alert status="info">
              <AlertIcon />
              <AlertDescription>
                <FormattedMessage id="text.unix_access_request_info" />
              </AlertDescription>
            </Alert>

            <FormControl isRequired>
              <FormLabel>
                <FormattedMessage id="text.requested_username" />
              </FormLabel>
              <Input
                value={requestData.requestedUsername}
                onChange={(e) => {
                  // Convert to lowercase and remove invalid characters
                  const value = e.target.value.toLowerCase().replaceAll(/[^a-z0-9_]/g, '');
                  setRequestData(prev => ({ ...prev, requestedUsername: value }));
                  
                  // Real-time validation
                  const error = validateUsername(value);
                  setUsernameError(error);
                }}
                maxLength={32}
              />
              {usernameError ? (
                <Text fontSize="xs" color="red.500" mt={1}>
                  {usernameError}
                </Text>
              ) : (
                <Text fontSize="xs" color={gray600} mt={1}>
                  Username must be 3-32 characters, lowercase letters, numbers, and underscores only. Cannot start with a number.
                </Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>
                <FormattedMessage id="text.access_expiration" />
              </FormLabel>
              <ExpirationInput
                days={expirationDays}
                hours={expirationHours}
                onDaysChange={setExpirationDays}
                onHoursChange={setExpirationHours}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>
                <FormattedMessage id="text.request_reason" />
              </FormLabel>
              <Textarea
                value={requestData.requestReason}
                onChange={(e) => setRequestData(prev => ({ ...prev, requestReason: e.target.value }))}
                rows={3}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>
                <FormattedMessage id="text.requested_groups" />
              </FormLabel>
              <Text fontSize="sm" color={gray600} mb={2}>
                Select the Unix groups you need access to:
              </Text>
              <CheckboxGroup
                value={selectedGroupIds}
                onChange={(values) => setSelectedGroupIds(values as string[])}
              >
                <Stack spacing={2}>
                  {availableGroups.map((group) => (
                    <Checkbox key={group.id} value={String(group.id)}>
                      <Flex gap={2} alignItems="center">
                        <Text fontWeight="medium" mb={0} lineHeight="1.5">{group.groupName}</Text>
                        {group.description ? (
                          <Text fontSize="sm" color={gray600} mb={0} lineHeight="1.5">
                            {'(' + group.description + ')'}
                          </Text>
                        ) : (
                          <Text fontSize="sm" color={gray400} mb={0} lineHeight="1.5">
                            (No description available)
                          </Text>
                        )}
                      </Flex>
                    </Checkbox>
                  ))}
                </Stack>
              </CheckboxGroup>
              {availableGroups.length === 0 && !isLoading && (
                <Text fontSize="sm" color="orange.500" mb={0}>
                  No groups available for this asset
                </Text>
              )}
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={handleClose} mr={3}>
            <FormattedMessage id="text.cancel" />
          </Button>
          <Button
            onClick={handleSubmit}
            colorScheme="blue"
            isLoading={isLoading}
            loadingText="Submitting..."
            isDisabled={!requestData.requestReason.trim() || !requestData.requestedUsername.trim() || selectedGroupIds.length === 0 || usernameError !== null}
          >
            <FormattedMessage id="text.submit_request" />
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
