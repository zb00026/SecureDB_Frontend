import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  HStack,
  Box,
  Text,
  Input,
  Select,
  Flex
} from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { Asset } from "@models/assets/Asset";
import { AssetDTO } from "@models/assets/AssetDTO";
import { AssetType, DatabaseType } from "@/constants/enums";
import { DamButton } from "@common/index";
import { useState, useEffect } from "react";

interface EditAssetModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly asset: Asset | null;
  readonly onSave: (assetData: Partial<AssetDTO>) => void;
  readonly isLoading?: boolean;
}

export function EditAssetModal({
  isOpen,
  onClose,
  asset,
  onSave,
  isLoading = false
}: EditAssetModalProps) {
  const intl = useIntl();
  const [formState, setFormState] = useState<Partial<AssetDTO>>({
    name: '',
    type: '' as AssetType | '',
    databaseType: '' as DatabaseType | '',
    description: '',
    hostAddress: '',
    portNumber: '',
    databaseName: ''
  });

  // Update form state when asset changes
  useEffect(() => {
    if (asset) {
      setFormState({
        name: asset.name,
        type: asset.type,
        databaseType: asset.databaseType ?? '',
        description: asset.description,
        hostAddress: asset.hostAddress,
        portNumber: asset.portNumber,
        databaseName: asset.databaseName
      });
    }
  }, [asset]);

  const handleClose = () => {
    setFormState({
      name: '',
      type: '' as AssetType | '',
      databaseType: '' as DatabaseType | '',
      description: '',
      hostAddress: '',
      portNumber: '',
      databaseName: ''
    });
    onClose();
  };

  const handleSave = () => {
    onSave(formState);
  };

  const isFormValid = formState.name && formState.type && formState.databaseType;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <FormattedMessage id="text.edit_asset" />
          {asset && (
            <Text fontSize="sm" color="gray.600" fontWeight="normal" mt={1}>
              {asset.name}
            </Text>
          )}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Asset Type */}
            <Box>
              <Text mb={2} fontWeight="medium">
                <FormattedMessage id="text.asset_type" />
              </Text>
              <Select
                value={formState.type}
                onChange={(e) => setFormState(prev => ({ ...prev, type: e.target.value as AssetType }))}
                placeholder={intl.formatMessage({ id: 'text.select_asset_type' })}
              >
                <option value={AssetType.DATABASE}>{AssetType.DATABASE}</option>
              </Select>
            </Box>

            {/* Database Type */}
            {formState.type === AssetType.DATABASE && (
              <Box>
                <Text mb={2} fontWeight="medium">
                  <FormattedMessage id="text.database_type" />
                </Text>
                <Select
                  value={formState.databaseType}
                  onChange={(e) => setFormState(prev => ({ ...prev, databaseType: e.target.value as DatabaseType }))}
                  placeholder={intl.formatMessage({ id: 'text.select_db_type' })}
                >
                  {Object.values(DatabaseType).map((type: DatabaseType) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Select>
              </Box>
            )}

            {/* Asset Details */}
            <Flex gap={4}>
              <Box flex={1}>
                <Text mb={2} fontWeight="medium">
                  <FormattedMessage id="text.asset_name" />
                </Text>
                <Input
                  value={formState.name}
                  onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={intl.formatMessage({ id: 'text.asset_name' })}
                />
              </Box>
              <Box flex={1}>
                <Text mb={2} fontWeight="medium">
                  <FormattedMessage id="text.host_address" />
                </Text>
                <Input
                  value={formState.hostAddress}
                  onChange={(e) => setFormState(prev => ({ ...prev, hostAddress: e.target.value }))}
                  placeholder={intl.formatMessage({ id: 'text.host_address' })}
                />
              </Box>
            </Flex>

            <Flex gap={4}>
              <Box flex={1}>
                <Text mb={2} fontWeight="medium">
                  <FormattedMessage id="text.port_number" />
                </Text>
                <Input
                  value={formState.portNumber}
                  onChange={(e) => setFormState(prev => ({ ...prev, portNumber: e.target.value }))}
                  placeholder={intl.formatMessage({ id: 'text.port_number' })}
                />
              </Box>
              <Box flex={1}>
                <Text mb={2} fontWeight="medium">
                  <FormattedMessage id="text.database_name" />
                </Text>
                <Input
                  value={formState.databaseName}
                  onChange={(e) => setFormState(prev => ({ ...prev, databaseName: e.target.value }))}
                  placeholder={intl.formatMessage({ id: 'text.database_name' })}
                />
              </Box>
            </Flex>

            {/* Description */}
            <Box>
              <Text mb={2} fontWeight="medium">
                <FormattedMessage id="text.description" />
              </Text>
              <Input
                value={formState.description}
                onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                placeholder={intl.formatMessage({ id: 'text.description' })}
              />
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={3}>
            <DamButton variant="outline" onClick={handleClose}>
              <FormattedMessage id="text.cancel" />
            </DamButton>
            <DamButton 
              colorScheme="blue" 
              onClick={handleSave}
              isDisabled={!isFormValid}
              isLoading={isLoading}
            >
              <FormattedMessage id="text.save" />
            </DamButton>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 