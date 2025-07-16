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
import { AddIcon, CloseIcon, SearchIcon } from "@chakra-ui/icons";
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

  const titleId = userType === 'owners' ? 'text.manage_asset_owners' : 'text.manage_asset_approvers';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
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
                              aria-label="Add user"
                              icon={<AddIcon />}
                              size="xs"
                              colorScheme="green"
                              variant="outline"
                              onClick={() => handleAddUser(user)}
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

            {/* Assigned Users Section */}
            <Box>
              <Text fontWeight="medium" mb={3}>
                <FormattedMessage id="text.assigned_users" />
                <Badge ml={2} colorScheme="green">
                  {localAssignedUsers.length}
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
                    {getFilteredAssignedUsers().length > 0 ? (
                      getFilteredAssignedUsers().map((user) => (
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
                              aria-label="Remove user"
                              icon={<CloseIcon />}
                              size="xs"
                              colorScheme="red"
                              variant="outline"
                              onClick={() => handleRemoveUser(user)}
                              isDisabled={isLoading}
                            />
                          </Td>
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
