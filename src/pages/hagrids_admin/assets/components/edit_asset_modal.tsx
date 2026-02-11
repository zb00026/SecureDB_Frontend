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
import { FormattedMessage } from "react-intl";
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
  const [formState, setFormState] = useState<Partial<AssetDTO>>({
    name: '',
    type: '' as AssetType | '',
    databaseType: null,
    description: '',
    hostAddress: '',
    portNumber: '',
    databaseName: '',
    hostUrl: ''
  });

  // Update form state when asset changes
  useEffect(() => {
    if (asset) {
      let hostAddress = asset.hostAddress;
      let portNumber = asset.portNumber;
      
      // For MongoDB, parse connection string to extract host and port
      if (asset.databaseType === DatabaseType.MONGODB && asset.hostUrl) {
        try {
          // Parse MongoDB connection string: mongodb://host:port or mongodb://host:port/database
          const url = new URL(asset.hostUrl);
          hostAddress = url.hostname || asset.hostAddress || '';
          portNumber = url.port || asset.portNumber || '27017';
        } catch (urlError) {
          console.error('Error parsing MongoDB connection string:', urlError);
        }
      }
      
      setFormState({
        name: asset.name,
        type: asset.type,
        databaseType: asset.databaseType ?? null,
        description: asset.description,
        hostAddress: hostAddress,
        portNumber: portNumber,
        databaseName: asset.databaseName,
        hostUrl: asset.hostUrl || asset.hostAddress
      });
    }
  }, [asset]);

  const handleClose = () => {
    setFormState({
      name: '',
      type: '' as AssetType | '',
      databaseType: null,
      description: '',
      hostAddress: '',
      portNumber: '',
      databaseName: '',
      hostUrl: ''
    });
    onClose();
  };

  const handleSave = () => {
    // For MongoDB, construct connection string from hostAddress and portNumber
    const saveData: any = { ...formState };
    if (formState.databaseType === DatabaseType.MONGODB) {
      // Construct MongoDB connection string from host and port
      const host = formState.hostAddress?.trim() || 'localhost';
      const port = formState.portNumber?.trim() || '27017';
      saveData.hostUrl = `mongodb://${host}:${port}`;
      // Keep hostAddress and portNumber for display, but backend will use hostUrl
    } else {
      delete saveData.hostUrl;
    }
    onSave(saveData);
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
              >
                <option value={AssetType.DATABASE}>{AssetType.DATABASE}</option>
                <option value={AssetType.UNIX_SERVER}>{AssetType.UNIX_SERVER}</option>
              </Select>
            </Box>

            {/* Database Type */}
            {formState.type === AssetType.DATABASE && (
              <Box>
                <Text mb={2} fontWeight="medium">
                  <FormattedMessage id="text.database_type" />
                </Text>
                <Select
                  value={formState.databaseType || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, databaseType: e.target.value as DatabaseType || null }))}
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
                />
              </Box>
              <Box flex={1}>
                <Text mb={2} fontWeight="medium">
                  <FormattedMessage id="text.host_address" />
                </Text>
                <Input
                  value={formState.hostAddress}
                  onChange={(e) => setFormState(prev => ({ ...prev, hostAddress: e.target.value }))}
                  placeholder={formState.databaseType === DatabaseType.MONGODB ? "localhost" : ""}
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
                  placeholder={formState.databaseType === DatabaseType.MONGODB ? "27017" : ""}
                />
              </Box>
              {formState.type === AssetType.DATABASE && (
                <Box flex={1}>
                  <Text mb={2} fontWeight="medium">
                    <FormattedMessage id="text.database_name" />
                  </Text>
                  <Input
                    value={formState.databaseName}
                    onChange={(e) => setFormState(prev => ({ ...prev, databaseName: e.target.value }))}
                    isReadOnly={formState.databaseType !== DatabaseType.MONGODB}
                    bg={formState.databaseType === DatabaseType.MONGODB ? undefined : "gray.50"}
                    _dark={formState.databaseType === DatabaseType.MONGODB ? undefined : { bg: "gray.700" }}
                    cursor={formState.databaseType === DatabaseType.MONGODB ? undefined : "not-allowed"}
                    placeholder={formState.databaseType === DatabaseType.MONGODB ? "Optional: default database name" : ""}
                  />
                </Box>
              )}
            </Flex>

            {/* Description */}
            <Box>
              <Text mb={2} fontWeight="medium">
                <FormattedMessage id="text.description" />
              </Text>
              <Input
                value={formState.description}
                onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
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