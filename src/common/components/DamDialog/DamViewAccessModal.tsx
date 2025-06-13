import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Badge,
  Spinner,
  VStack,
  HStack,
  Divider,
  Alert,
  AlertIcon,
  Box,
  Text,
  Button,
  Flex
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { Asset } from "@models/assets/Asset";
import { AssetCredential } from "@models/assets/AssetCredential";
import { AssetAccessDTO } from "@models/assets/AssetAccess";

interface DamViewAccessModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly asset: Asset | AssetCredential | null;
  readonly assetAccessData: AssetAccessDTO | null;
  readonly isLoading: boolean;
  readonly error: string | null;
}

export const DamViewAccessModal: React.FC<DamViewAccessModalProps> = ({
  isOpen,
  onClose,
  asset,
  assetAccessData,
  isLoading,
  error
}) => {
  // Helper function to get asset name
  const getAssetName = () => {
    if (!asset) return '';
    if ('name' in asset) return asset.name;
    if ('asset' in asset && asset.asset) return asset.asset.name;
    return '';
  };

  // Helper function to get asset details
  const getAssetDetails = () => {
    if (!asset) return null;
    if ('name' in asset) return asset;
    if ('asset' in asset && asset.asset) return asset.asset;
    return null;
  };

  const assetDetails = getAssetDetails();

  // Function to render modal body content based on state
  const renderModalBodyContent = () => {
    if (isLoading) {
      return (
        <Flex justify="center" align="center" minH="200px">
          <VStack spacing={4}>
            <Spinner size="xl" />
            <Text>Loading {getAssetName()} access information...</Text>
          </VStack>
        </Flex>
      );
    }

    if (error) {
      return (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      );
    }

    if (assetAccessData) {
      return (
        <VStack spacing={6} align="stretch">
          {/* Asset Information */}
          <Box>
            <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.900">
              Asset Information
            </Text>
            <VStack align="start" spacing={3} bg="gray.50" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
              <Text color="gray.800">
                <Text as="span" fontWeight="semibold">Name:</Text>{' '}
                {assetAccessData.assetName}
              </Text>
              <Text color="gray.800">
                <Text as="span" fontWeight="semibold">Database Type:</Text>{' '}
                {assetAccessData.databaseType}
              </Text>
              <Text color="gray.800">
                <Text as="span" fontWeight="semibold">Host:</Text>{' '}
                {assetDetails?.hostAddress}:{assetDetails?.portNumber}
              </Text>
              <Text color="gray.800">
                <Text as="span" fontWeight="semibold">Database:</Text>{' '}
                {assetDetails?.databaseName}
              </Text>
            </VStack>
          </Box>

          <Divider />

          {/* Current Database Users & Permissions */}
          <Box>
            <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.900">
              Current Database Users & Permissions
            </Text>
            {assetAccessData.users.length > 0 ? (
              <VStack spacing={4} align="stretch">
                {assetAccessData.users.map((user) => (
                  <Box key={`${user.username}-${user.grantee}`} bg="gray.50" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
                    <HStack justify="space-between" mb={3}>
                      <Text fontWeight="semibold" fontSize="md" color="gray.800">
                        {user.username}
                      </Text>
                      <Badge colorScheme="gray" variant="solid">
                        {user.permissions.length} permission{user.permissions.length !== 1 ? 's' : ''}
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="gray.600" mb={2}>
                      <strong>Grantee:</strong> {user.grantee}
                    </Text>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.700">Permissions:</Text>
                      <Flex gap={2} flexWrap="wrap">
                                                 {user.permissions.map((permission) => (
                           <VStack key={`${permission.type}-${permission.objectType}-${permission.scope}`} spacing={1} align="start">
                            <HStack>
                              <Badge colorScheme="blue" size="sm">
                                {permission.type}
                              </Badge>
                              <Badge colorScheme="gray" variant="outline" size="sm">
                                {permission.objectType}
                              </Badge>
                              {permission.grantable && (
                                <Badge colorScheme="orange" variant="outline" size="sm">
                                  GRANTABLE
                                </Badge>
                              )}
                            </HStack>
                            <Text fontSize="xs" color="gray.600">
                              {permission.scope}
                            </Text>
                          </VStack>
                        ))}
                      </Flex>
                    </Box>
                  </Box>
                ))}
              </VStack>
            ) : (
              <Box bg="gray.50" p={6} borderRadius="md" textAlign="center">
                <Text color="gray.600">
                  No database permissions found. The user may not have access to this asset or permissions may not be configured.
                </Text>
              </Box>
            )}
          </Box>
        </VStack>
      );
    }

    return (
      <Box bg="gray.50" p={6} borderRadius="md" textAlign="center">
        <Text color="gray.600">No access data available</Text>
      </Box>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <FormattedMessage id="text.view_access" />
          {asset && ` - ${getAssetName()}`}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {renderModalBodyContent()}
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onClose}>
            <FormattedMessage id="text.ok" />
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 