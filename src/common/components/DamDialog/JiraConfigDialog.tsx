import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Select,
  Textarea,
  Input,
  Text,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  Box,
} from '@chakra-ui/react';
import { FormattedMessage, useIntl } from 'react-intl';
import { jiraApi } from '@/services/jiraApi';
import { JiraAsset, JiraAccessConfigRequest, JiraAccessLevel } from '@models/JiraModels';
import { useDamToast } from '@common/index';

interface JiraConfigDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly issueKey: string;
  readonly issueId: string;
  readonly userEmail: string;
  readonly onSuccess?: (damRequestId: number) => void;
  readonly existingConfig?: {
    readonly assetId: number;
    readonly tables: string;
    readonly accessLevel: JiraAccessLevel;
    readonly durationDays: number;
    readonly businessJustification: string;
    readonly isLocked: boolean;
  };
}

export function JiraConfigDialog({
  isOpen,
  onClose,
  issueKey,
  issueId,
  userEmail,
  onSuccess,
  existingConfig,
}: JiraConfigDialogProps) {
  const intl = useIntl();
  const { showError, showSuccess } = useDamToast();

  const [assets, setAssets] = useState<JiraAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(
    existingConfig?.assetId || null
  );
  const [tables, setTables] = useState<string>(
    existingConfig?.tables || ''
  );
  const [accessLevel, setAccessLevel] = useState<JiraAccessLevel>(
    existingConfig?.accessLevel || 'READ_ONLY'
  );
  const [durationDays, setDurationDays] = useState<number>(
    existingConfig?.durationDays || 90
  );
  const [businessJustification, setBusinessJustification] = useState<string>(
    existingConfig?.businessJustification || ''
  );

  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isLocked = existingConfig?.isLocked || false;

  // Load assets when dialog opens
  useEffect(() => {
    if (isOpen && assets.length === 0) {
      loadAssets();
    }
  }, [isOpen]);

  const loadAssets = async () => {
    try {
      setIsLoadingAssets(true);
      const assetsData = await jiraApi.getAssets();
      setAssets(assetsData);
    } catch (error: any) {
      console.error('Failed to load assets:', error);
      showError({
        description:
          error?.response?.data?.error ||
          error?.message ||
          intl.formatMessage({ id: 'text.failed_to_load_assets' }),
      });
    } finally {
      setIsLoadingAssets(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!selectedAssetId) {
      showError({
        description: intl.formatMessage({ id: 'text.select_database_asset' }),
      });
      return;
    }

    if (!tables.trim()) {
      showError({
        description: intl.formatMessage({ id: 'text.select_tables' }),
      });
      return;
    }

    if (!businessJustification.trim()) {
      showError({
        description: intl.formatMessage({
          id: 'text.business_justification',
        }),
      });
      return;
    }

    try {
      setIsSaving(true);
      const config: JiraAccessConfigRequest = {
        issueKey,
        issueId,
        userEmail,
        assetId: selectedAssetId,
        tables: tables.trim(),
        accessLevel,
        durationDays,
        businessJustification: businessJustification.trim(),
      };

      const response = await jiraApi.saveAccessConfig(config);

      showSuccess({
        description:
          response.message ||
          intl.formatMessage({ id: 'text.access_config_saved' }),
      });

      onSuccess?.(response.damRequestId);
      onClose();
    } catch (error: any) {
      console.error('Failed to save configuration:', error);
      showError({
        description:
          error?.response?.data?.error ||
          error?.message ||
          intl.formatMessage({ id: 'text.failed_to_save_configuration' }),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" closeOnOverlayClick={!isLocked}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <FormattedMessage id="text.configure_access" />
        </ModalHeader>
        <ModalCloseButton isDisabled={isLocked || isSaving} />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {isLocked && (
              <Alert status="warning">
                <AlertIcon />
                <AlertDescription>
                  <FormattedMessage id="text.configuration_locked" />
                </AlertDescription>
              </Alert>
            )}

            {/* Asset Selection */}
            <FormControl isRequired isDisabled={isLocked}>
              <FormLabel>
                <FormattedMessage id="text.select_database_asset" />
              </FormLabel>
              {isLoadingAssets ? (
                <Box>
                  <Spinner size="sm" mr={2} />
                  <Text as="span" fontSize="sm">
                    Loading assets...
                  </Text>
                </Box>
              ) : (
                <Select
                  placeholder={intl.formatMessage({
                    id: 'text.select_database_asset',
                  })}
                  value={selectedAssetId || ''}
                  onChange={(e) =>
                    setSelectedAssetId(Number(e.target.value) || null)
                  }
                  isDisabled={isLocked}
                >
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} ({asset.type})
                      {asset.description && ` - ${asset.description}`}
                    </option>
                  ))}
                </Select>
              )}
            </FormControl>

            {/* Tables Input */}
            <FormControl isRequired isDisabled={isLocked}>
              <FormLabel>
                <FormattedMessage id="text.select_tables" />
              </FormLabel>
              <Input
                placeholder={intl.formatMessage({
                  id: 'text.tables_placeholder',
                })}
                value={tables}
                onChange={(e) => setTables(e.target.value)}
                isDisabled={isLocked}
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                <FormattedMessage id="text.tables_placeholder" />
              </Text>
            </FormControl>

            {/* Access Level */}
            <FormControl isRequired isDisabled={isLocked}>
              <FormLabel>
                <FormattedMessage id="text.access_level" />
              </FormLabel>
              <Select
                value={accessLevel}
                onChange={(e) =>
                  setAccessLevel(
                    e.target.value as
                      | 'READ_ONLY'
                      | 'READ_WRITE'
                      | 'FULL_ACCESS'
                  )
                }
                isDisabled={isLocked}
              >
                <option value="READ_ONLY">
                  <FormattedMessage id="text.read_only" />
                </option>
                <option value="READ_WRITE">
                  <FormattedMessage id="text.read_write" />
                </option>
                <option value="FULL_ACCESS">
                  <FormattedMessage id="text.full_access" />
                </option>
              </Select>
            </FormControl>

            {/* Duration */}
            <FormControl isRequired isDisabled={isLocked}>
              <FormLabel>
                <FormattedMessage id="text.duration_days" />
              </FormLabel>
              <Select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                isDisabled={isLocked}
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
                <option value={365}>365 days</option>
              </Select>
            </FormControl>

            {/* Business Justification */}
            <FormControl isRequired isDisabled={isLocked}>
              <FormLabel>
                <FormattedMessage id="text.business_justification" />
              </FormLabel>
              <Textarea
                placeholder={intl.formatMessage({
                  id: 'text.business_justification_placeholder',
                })}
                value={businessJustification}
                onChange={(e) => setBusinessJustification(e.target.value)}
                rows={4}
                isDisabled={isLocked}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={handleClose}
            isDisabled={isSaving || isLocked}
          >
            <FormattedMessage id="text.Cancel" />
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            isLoading={isSaving}
            isDisabled={isLocked}
          >
            <FormattedMessage id="text.save_access_config" />
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
