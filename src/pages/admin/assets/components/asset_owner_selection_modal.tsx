import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  Box,
  Text,
  Input,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  IconButton,
  Badge,
  Flex,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  useColorModeValue
} from "@chakra-ui/react";
import { AddIcon, CloseIcon, SearchIcon } from "@chakra-ui/icons";
import { FormattedMessage, useIntl } from "react-intl";
import { User } from "@models/User";
import { DamButton } from "@common/index";
import { useState } from "react";

interface AssetOwnerSelectionModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (selectedOwners: User[]) => void;
  readonly users: User[];
  readonly isLoading?: boolean;
  readonly assetName?: string;
}

export function AssetOwnerSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  users,
  isLoading = false,
  assetName
}: AssetOwnerSelectionModalProps) {
  const intl = useIntl();
  const [searchCriteria, setSearchCriteria] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedOwners, setSelectedOwners] = useState<User[]>([]);

  const alertBg = useColorModeValue('blue.50', 'blue.900');
  const alertBorder = useColorModeValue('blue.200', 'blue.700');

  const isUserSelected = (user: User) => {
    return selectedOwners.some(selectedUser => selectedUser.id === user.id);
  };

  const getAvailableUsers = () => {
    return users.filter(user => !isUserSelected(user));
  };

  const getFilteredAvailableUsers = () => {
    const availableUsers = getAvailableUsers();
    if (!searchCriteria) return availableUsers;
    
    return availableUsers.filter(user => 
      user.firstName.toLowerCase().includes(searchCriteria.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchCriteria.toLowerCase()) ||
      user.email.toLowerCase().includes(searchCriteria.toLowerCase())
    );
  };

  const getFilteredSelectedOwners = () => {
    if (!searchCriteria) return selectedOwners;
    
    return selectedOwners.filter(user => 
      user.firstName.toLowerCase().includes(searchCriteria.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchCriteria.toLowerCase()) ||
      user.email.toLowerCase().includes(searchCriteria.toLowerCase())
    );
  };

  const handleClose = () => {
    if (isLoading) {
      return; // Prevent closing while loading
    }
    setSearchCriteria('');
    setShowSearch(false);
    setSelectedOwners([]);
    onClose();
  };

  const handleAddOwner = (user: User) => {
    setSelectedOwners(prev => [...prev, user]);
  };

  const handleRemoveOwner = (user: User) => {
    setSelectedOwners(prev => prev.filter(u => u.id !== user.id));
  };

  const handleConfirm = () => {
    if (selectedOwners.length === 0) {
      return; // Should not happen due to button disabled state
    }
    onConfirm(selectedOwners);
    handleClose();
  };

  const isConfirmDisabled = selectedOwners.length === 0 || isLoading;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" closeOnOverlayClick={!isLoading}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <FormattedMessage id="text.select_asset_owners" />
          {assetName && (
            <Text fontSize="sm" color="gray.600" fontWeight="normal" mt={1}>
              <FormattedMessage id="text.for_asset" values={{ assetName }} />
            </Text>
          )}
        </ModalHeader>
        <ModalCloseButton isDisabled={isLoading} />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Important Notice */}
            <Alert status="info" bg={alertBg} borderColor={alertBorder} borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="sm">
                  <FormattedMessage id="text.asset_owner_selection_required" />
                </AlertTitle>
                <AlertDescription fontSize="sm">
                  <FormattedMessage id="text.asset_owner_selection_description" />
                </AlertDescription>
              </Box>
            </Alert>

            {/* Search Bar */}
            <Flex justifyContent="space-between" alignItems="center">
              {!showSearch && (
                <Text fontWeight="medium">
                  <FormattedMessage id="text.select_owners" />
                </Text>
              )}
              {showSearch && (
                <Input
                  flex={1}
                  mr={2}
                  value={searchCriteria}
                  onChange={(e) => setSearchCriteria(e.target.value)}
                  placeholder={intl.formatMessage({ id: 'text.search_users' })}
                />
              )}
              <IconButton
                aria-label="Search"
                icon={showSearch ? <CloseIcon /> : <SearchIcon />}
                onClick={() => {
                  setSearchCriteria('');
                  setShowSearch(!showSearch);
                }}
                size="sm"
              />
            </Flex>

            <Divider />

            {/* Available Users Section */}
            <Box>
              <Text fontWeight="medium" mb={3}>
                <FormattedMessage id="text.available_users" />
                <Badge ml={2} colorScheme="blue">
                  {getAvailableUsers().length}
                </Badge>
              </Text>
              
              <TableContainer maxH="200px" overflowY="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th><FormattedMessage id="text.name" /></Th>
                      <Th><FormattedMessage id="text.email" /></Th>
                      <Th width="100px"><FormattedMessage id="text.action" /></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {getFilteredAvailableUsers().length > 0 ? (
                      getFilteredAvailableUsers().map((user) => (
                        <Tr key={user.id}
                          sx={{
                            _light: {
                              backgroundColor: 'transparent',
                              _hover: { backgroundColor: 'gray.100' }
                            },
                            _dark: {
                              backgroundColor: 'transparent',
                              _hover: { backgroundColor: 'gray.700' }
                            },
                          }}>
                          <Td>{user.firstName} {user.lastName}</Td>
                          <Td>{user.email}</Td>
                          <Td>
                            <IconButton
                              aria-label="Add owner"
                              icon={<AddIcon />}
                              size="xs"
                              colorScheme="green"
                              variant="outline"
                              onClick={() => handleAddOwner(user)}
                              isDisabled={isLoading}
                            />
                          </Td>
                        </Tr>
                      ))
                    ) : (
                      <Tr>
                        <Td colSpan={3} textAlign="center" color="gray.500">
                          <FormattedMessage id="text.no_available_users" />
                        </Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>

            <Divider />

            {/* Selected Owners Section */}
            <Box>
              <Text fontWeight="medium" mb={3}>
                <FormattedMessage id="text.selected_owners" />
                <Badge ml={2} colorScheme="green">
                  {selectedOwners.length}
                </Badge>
              </Text>
              
              <TableContainer maxH="200px" overflowY="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th><FormattedMessage id="text.name" /></Th>
                      <Th><FormattedMessage id="text.email" /></Th>
                      <Th width="100px"><FormattedMessage id="text.action" /></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {getFilteredSelectedOwners().length > 0 ? (
                      getFilteredSelectedOwners().map((user) => (
                        <Tr key={user.id}
                          sx={{
                            _light: {
                              backgroundColor: 'transparent',
                              _hover: { backgroundColor: 'gray.100' }
                            },
                            _dark: {
                              backgroundColor: 'transparent',
                              _hover: { backgroundColor: 'gray.700' }
                            },
                          }}>
                          <Td>{user.firstName} {user.lastName}</Td>
                          <Td>{user.email}</Td>
                          <Td>
                            <IconButton
                              aria-label="Remove owner"
                              icon={<CloseIcon />}
                              size="xs"
                              colorScheme="red"
                              variant="outline"
                              onClick={() => handleRemoveOwner(user)}
                              isDisabled={isLoading}
                            />
                          </Td>
                        </Tr>
                      ))
                    ) : (
                      <Tr>
                        <Td colSpan={3} textAlign="center" color="gray.500">
                          <FormattedMessage id="text.no_selected_owners" />
                        </Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={handleClose} mr={3}>
            <FormattedMessage id="text.cancel" />
          </Button>
          <DamButton 
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            isLoading={isLoading}
            loadingText={intl.formatMessage({ id: 'text.creating_asset' })}
          >
            <FormattedMessage id="text.create_asset_with_owners" />
          </DamButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
