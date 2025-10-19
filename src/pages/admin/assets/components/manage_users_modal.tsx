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
  Divider
} from "@chakra-ui/react";
import { CloseIcon, SearchIcon, ChevronRightIcon, ChevronLeftIcon } from "@chakra-ui/icons";
import { FormattedMessage, useIntl } from "react-intl";
import { User } from "@models/User";
import { Asset } from "@models/assets/Asset";
import { DamButton } from "@common/index";
import { useState, useEffect } from "react";

interface ManageUsersModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly asset: Asset | null;
  readonly users: User[];
  readonly assignedUsers: User[];
  readonly userType: 'owners' | 'approvers';
  readonly onAddUser: (user: User) => void;
  readonly onRemoveUser: (user: User) => void;
  readonly isLoading?: boolean;
}

export function ManageUsersModal({
  isOpen,
  onClose,
  asset,
  users,
  assignedUsers,
  userType,
  onAddUser,
  onRemoveUser,
  isLoading = false
}: ManageUsersModalProps) {
  const intl = useIntl();
  const [searchCriteria, setSearchCriteria] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [localAssignedUsers, setLocalAssignedUsers] = useState<User[]>([]);
  const [selectedAvailableIds, setSelectedAvailableIds] = useState<number[]>([]);
  const [selectedAssignedIds, setSelectedAssignedIds] = useState<number[]>([]);

  // Update local state when assignedUsers prop changes
  useEffect(() => {
    setLocalAssignedUsers(assignedUsers);
  }, [assignedUsers]);

  const isUserAssigned = (user: User) => {
    return localAssignedUsers.some(assignedUser => assignedUser.id === user.id);
  };

  const getAvailableUsers = () => {
    return users.filter(user => !isUserAssigned(user));
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

  const getFilteredAssignedUsers = () => {
    if (!searchCriteria) return localAssignedUsers;
    
    return localAssignedUsers.filter(user => 
      user.firstName.toLowerCase().includes(searchCriteria.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchCriteria.toLowerCase()) ||
      user.email.toLowerCase().includes(searchCriteria.toLowerCase())
    );
  };

  const handleClose = () => {
    setSearchCriteria('');
    setShowSearch(false);
    setLocalAssignedUsers([]);
    onClose();
  };

  const handleAddUser = (user: User) => {
    // Update local state immediately for better UX
    setLocalAssignedUsers(prev => [...prev, user]);
    // Call the parent's onAddUser function
    onAddUser(user);
  };

  const handleRemoveUser = (user: User) => {
    // Update local state immediately for better UX
    setLocalAssignedUsers(prev => prev.filter(u => u.id !== user.id));
    // Call the parent's onRemoveUser function
    onRemoveUser(user);
  };

  const toggleAvailableSelection = (userId: number) => {
    setSelectedAvailableIds(prev => prev.includes(userId)
      ? prev.filter(id => id !== userId)
      : [...prev, userId]);
  };

  const toggleAssignedSelection = (userId: number) => {
    setSelectedAssignedIds(prev => prev.includes(userId)
      ? prev.filter(id => id !== userId)
      : [...prev, userId]);
  };

  const moveSelectedRight = () => {
    const toAdd = getAvailableUsers().filter(u => selectedAvailableIds.includes(u.id));
    for (const user of toAdd) {
      handleAddUser(user);
    }
    setSelectedAvailableIds([]);
  };

  const moveSelectedLeft = () => {
    const toRemove = localAssignedUsers.filter(u => selectedAssignedIds.includes(u.id));
    for (const user of toRemove) {
      handleRemoveUser(user);
    }
    setSelectedAssignedIds([]);
  };

  const titleId = userType === 'owners' ? 'text.manage_asset_owners' : 'text.manage_asset_approvers';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="4xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <FormattedMessage id={titleId} />
          {asset && (
            <Text fontSize="sm" color="gray.600" fontWeight="normal" mt={1}>
              {asset.name}
            </Text>
          )}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Search Bar */}
            <Flex justifyContent="space-between" alignItems="center">
              {!showSearch && (
                <Text fontWeight="medium">
                  <FormattedMessage id="text.manage_users" />
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

            {/* Two-column layout: Available (left) and Assigned (right) */}
            <Flex direction={{ base: 'column', md: 'row' }} gap={6} align="stretch">
              {/* Available Users Section */}
              <Box flex={1}>
                <Text fontWeight="medium" mb={3}>
                  <FormattedMessage id="text.available_users" />
                  <Badge ml={2} colorScheme="blue">
                    {getAvailableUsers().length}
                  </Badge>
                </Text>
                <TableContainer maxH={{ base: '35vh', md: '50vh' }} overflowY="auto">
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th><FormattedMessage id="text.name" /></Th>
                        <Th><FormattedMessage id="text.email" /></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {getFilteredAvailableUsers().length > 0 ? (
                        getFilteredAvailableUsers().map((user) => (
                          <Tr key={user.id}
                            sx={{
                              _light: {
                                backgroundColor: selectedAvailableIds.includes(user.id) ? 'blue.50' : 'transparent',
                                _hover: { backgroundColor: selectedAvailableIds.includes(user.id) ? 'blue.100' : 'gray.100' }
                              },
                              _dark: {
                                backgroundColor: selectedAvailableIds.includes(user.id) ? 'blue.900' : 'transparent',
                                _hover: { backgroundColor: selectedAvailableIds.includes(user.id) ? 'blue.800' : 'gray.700' }
                              },
                            }}
                            cursor="pointer"
                            onClick={() => toggleAvailableSelection(user.id)}
                          >
                            <Td>{user.firstName} {user.lastName}</Td>
                            <Td>{user.email}</Td>
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

              {/* Middle transfer controls */}
              <Flex direction={{ base: 'row', md: 'column' }} justify="center" align="center" gap={2}>
                <IconButton aria-label="Move right" icon={<ChevronRightIcon />} onClick={moveSelectedRight} isDisabled={selectedAvailableIds.length === 0 || isLoading} />
                <IconButton aria-label="Move left" icon={<ChevronLeftIcon />} onClick={moveSelectedLeft} isDisabled={selectedAssignedIds.length === 0 || isLoading} />
              </Flex>

              {/* Assigned Users Section */}
              <Box flex={1}>
                <Text fontWeight="medium" mb={3}>
                  <FormattedMessage id="text.assigned_users" />
                  <Badge ml={2} colorScheme="green">
                    {localAssignedUsers.length}
                  </Badge>
                </Text>
                <TableContainer maxH={{ base: '35vh', md: '50vh' }} overflowY="auto">
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th><FormattedMessage id="text.name" /></Th>
                        <Th><FormattedMessage id="text.email" /></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {getFilteredAssignedUsers().length > 0 ? (
                        getFilteredAssignedUsers().map((user) => (
                          <Tr key={user.id}
                            sx={{
                              _light: {
                                backgroundColor: selectedAssignedIds.includes(user.id) ? 'blue.50' : 'transparent',
                                _hover: { backgroundColor: selectedAssignedIds.includes(user.id) ? 'blue.100' : 'gray.100' }
                              },
                              _dark: {
                                backgroundColor: selectedAssignedIds.includes(user.id) ? 'blue.900' : 'transparent',
                                _hover: { backgroundColor: selectedAssignedIds.includes(user.id) ? 'blue.800' : 'gray.700' }
                              },
                            }}
                            cursor="pointer"
                            onClick={() => toggleAssignedSelection(user.id)}
                          >
                            <Td>{user.firstName} {user.lastName}</Td>
                            <Td>{user.email}</Td>
                          </Tr>
                        ))
                      ) : (
                        <Tr>
                          <Td colSpan={3} textAlign="center" color="gray.500">
                            <FormattedMessage id="text.no_assigned_users" />
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            </Flex>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <DamButton variant="outline" onClick={handleClose}>
            <FormattedMessage id="text.close" />
          </DamButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
