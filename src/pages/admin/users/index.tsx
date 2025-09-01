import {
  Box, Button, Text, Flex, Input, Table, TableContainer, Tbody, Td, Th, Thead, Tr, useColorModeValue,
  IconButton, useDisclosure, HStack, InputGroup, InputLeftElement, Badge, Tooltip, VStack
} from "@chakra-ui/react";
import { DamButton, DamCard, DamCardBody, request, stateActions, useListPage, useDamToast, userHasRole, BulkUploadModal, BulkUploadConfig } from "@common/index";
import { DamAlertDialog } from "@common/components/DamDialog/DamAlertDialog";
import { useApiRequest } from "@common/hooks/useApiRequest";
import { Role } from "@models/Role";
import { User } from "@models/User";
import { ConfigProvider } from "antd";
import { useEffect, useState, useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { MultiValue, Select } from 'chakra-react-select';
import { AUTH_PROVIDER, USER_ROLE } from "@/constants/enums";
import { CloseIcon, SearchIcon } from "@chakra-ui/icons";

import { DamBasePage } from "@common/components/DamBasePage";
import { UserApproversDlg } from "./components/user_approvers_dlg";

export type RoleOption = {
  label: string;  // The display name of the role
  value: string;  // The ID of the role
};

export const isSearchable = true;
export const displayName = 'User Management Page';

export function Component() {
  const { showError, showSuccess } = useDamToast();
  const [users, setUsers] = useState<Array<User>>([]);
  const intl = useIntl();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Array<Role>>([]);
  const [isDelDlgOpen, setIsDelDlgOpen] = useState(false);
  const [roles, setRoles] = useState<Array<Role>>([]);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [roleOptions, setRoleOptions] = useState<Array<RoleOption>>([]);
  const defauleDark = useColorModeValue("ant", "antdark");
  const selectedRowBg = useColorModeValue('gray.200', 'gray.700');
  const [approvers, setApprovers] = useState<Array<User>>([]);
  const [isApproversDlgOpen, setIsApproversDlgOpen] = useState<boolean>(false);
  const [isUnsetApproverDlgOpen, setIsUnsetApproverDlgOpen] = useState<boolean>(false);
  const [isShowEditForm, setIsShowEditForm] = useState<boolean>(false);
  
  // Validation states
  const [firstNameError, setFirstNameError] = useState<string>('');
  const [lastNameError, setLastNameError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  const { isOpen: isBulkUploadOpen, onOpen: onBulkUploadOpen, onClose: onBulkUploadClose } = useDisclosure();

  const { getData, getList } = useListPage<User>({
    baseUri: "/api/admin/users",
    defaultParams: {
      method: 'GET'
    }
  });
  const { handleRequest } = useApiRequest();

  // Bulk upload configuration for users
  const userBulkUploadConfig: BulkUploadConfig = {
    type: 'users',
    titleId: 'text.bulk_user_upload',
    instructionsId: 'text.upload_instructions',
    sampleCsvEndpoint: '/api/admin/users/download-sample-csv',
    uploadEndpoint: '/api/admin/users/bulk-upload',
    sampleFileName: 'user_bulk_upload_sample.csv',
    successMessageId: 'text.user_create_success_with_temp_password',
    errorMessageId: 'text.user_create_failed',
    createdItemsKey: 'users',
    createdItemNameKey: 'email',
    createdItemDisplayKey: 'email'
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (term: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (term.trim()) {
            setIsSearchActive(true);
            getList({ search: term.trim() });
          } else {
            setIsSearchActive(false);
            getList({});
          }
        }, 300); // 300ms delay
      };
    })(),
    [getList]
  );

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setIsSearchActive(false);
    getList({});
  };

  // Get search suggestions based on current input
  const getSearchSuggestions = () => {
    if (!searchTerm) return [];
    
    const suggestions = [];
    const term = searchTerm.toLowerCase();
    
    // Suggest status searches
    if ('active'.includes(term) || 'enabled'.includes(term)) {
      suggestions.push('active');
    }
    if ('inactive'.includes(term) || 'disabled'.includes(term)) {
      suggestions.push('inactive');
    }
    
    // Suggest role searches
    roles.forEach(role => {
      if (role.name.toLowerCase().includes(term)) {
        suggestions.push(role.name);
      }
    });
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  };

  useEffect(() => {
    const tmpUsers = Array.isArray(getData) ? getData : getData.content;
    if (tmpUsers) {
      setUsers(tmpUsers);
      setApprovers(tmpUsers.filter(user => userHasRole(user, USER_ROLE.APPROVER)));
    }
  }, [getData]);
  useEffect(() => {
    stateActions.addLoading();
    request(`/api/admin/roles`, {
      method: 'GET',
      data: {}
    }).then((res: any) => {
      if (res) {
        stateActions.subLoading();
        setRoles(res);
        setRoleOptions(res.map((role: Role) => ({ label: role.name, value: role.id.toString() })));
      } else {
        setRoleOptions([]);
        setRoles([]);
      }
    }).catch((e) => {
      setRoleOptions([]);
      setRoles([]);
      showError({
        description: e?.response?.data?.error ?? intl.formatMessage({ id: 'text.failed_getting_roles' })
      });
    });
  }, []);

  const clearForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setSelectedRoles([]);
    setSelectedUser(null);
    setIsEdit(false);
    // Clear validation errors
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
  }

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setSelectedRoles(user.roles || []);
    setIsEdit(true);
    setIsShowEditForm(true);
  };
  const handleUpdate = async () => {
    if (!selectedUser) return;

    // Validate uniqueness before updating (exclude current user from check)
    if (!validateUserUniqueness(firstName, lastName, email, selectedUser.id)) {
      return;
    }

    handleRequest(`/api/admin/users/${selectedUser.id}`, 'PUT',
      { firstName, lastName, email, roles: selectedRoles },
      {
        onSuccess: () => {
          getList({});
          clearForm();
        },
        successTitleId: 'text.user_updated',
        successDescriptionId: 'text.user_update_success',
        errorDescriptionId: 'text.user_update_failed'
      }
    );
  };
  // Validation function to check for duplicate names and emails
  const validateUserUniqueness = (firstName: string, lastName: string, email: string, excludeUserId?: number) => {
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    
    // Clear previous errors
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    
    let hasErrors = false;
    
    // Basic field validation
    if (!trimmedFirstName) {
      setFirstNameError(intl.formatMessage({ id: 'text.first_name_required' }));
      hasErrors = true;
    }
    
    if (!trimmedLastName) {
      setLastNameError(intl.formatMessage({ id: 'text.last_name_required' }));
      hasErrors = true;
    }
    
    if (!trimmedEmail) {
      setEmailError(intl.formatMessage({ id: 'text.email_required' }));
      hasErrors = true;
    } else {
      // Basic email format validation using string operations to prevent ReDoS
      const isValidEmail = (email: string): boolean => {
        const trimmedEmail = email.trim();
        const atIndex = trimmedEmail.indexOf('@');
        const dotIndex = trimmedEmail.lastIndexOf('.');
        
        return atIndex > 0 && 
               dotIndex > atIndex + 1 && 
               dotIndex < trimmedEmail.length - 1 &&
               !trimmedEmail.includes(' ') &&
               !trimmedEmail.includes('\t') &&
               !trimmedEmail.includes('\n');
      };
      
      if (!isValidEmail(trimmedEmail)) {
        setEmailError(intl.formatMessage({ id: 'text.please_enter_valid_email' }));
        hasErrors = true;
      }
    }
    
    // If there are basic validation errors, don't check for duplicates
    if (hasErrors) {
      return false;
    }
    
    // Check for duplicate email
    const existingUserWithEmail = users.find(user => 
      user.email.toLowerCase() === trimmedEmail && 
      (!excludeUserId || user.id !== excludeUserId)
    );
    
    if (existingUserWithEmail) {
      setEmailError(intl.formatMessage({ id: 'text.email_already_exists' }));
      hasErrors = true;
    }
    
    // Check for duplicate name combination (firstName + lastName)
    const existingUserWithName = users.find(user => 
      user.firstName.trim().toLowerCase() === trimmedFirstName.toLowerCase() &&
      user.lastName.trim().toLowerCase() === trimmedLastName.toLowerCase() &&
      (!excludeUserId || user.id !== excludeUserId)
    );
    
    if (existingUserWithName) {
      setFirstNameError(intl.formatMessage({ id: 'text.name_already_exists' }));
      setLastNameError(intl.formatMessage({ id: 'text.name_already_exists' }));
      hasErrors = true;
    }
    
    return !hasErrors;
  };

  const handleCreate = async () => {
    if (selectedUser) return;
    
    // Validate uniqueness before creating
    if (!validateUserUniqueness(firstName, lastName, email)) {
      return;
    }
    
    const auth_provider = import.meta.env.VITE_AUTH_PROVIDER || AUTH_PROVIDER.GOOGLE;

    // Always use the invite endpoint for new user creation
    const postUri = '/api/admin/users/createUserAndSendInvite';
    const postData = {
      user: { firstName, lastName, email, roles: selectedRoles, isInitialPassword: true },
      authProvider: auth_provider.toUpperCase()
    };

    handleRequest(postUri, 'POST', postData, {
      onSuccess: () => {
        getList({});
        // Show success message with temporary password
        showSuccess({
          title: intl.formatMessage({ id: 'text.user_created' }),
          description: intl.formatMessage({ id: 'text.user_create_success_with_temp_password' })
        });
        clearForm();
      },
      successTitleId: undefined, // We're handling the success message manually
      successDescriptionId: undefined,
      errorDescriptionId: 'text.user_create_failed'
    });
  };

  const handleRoleChange = (selectedOptions: MultiValue<RoleOption>) => {
    const selectedRoles: Array<Role> = selectedOptions
      .map(roleOption => {
        // Find the role object by id
        const role = roles.find(role => role.id === parseInt(roleOption.value.toString()));
        return role || null;  // If role not found, return null
      })
      .filter((role): role is Role => role !== null);  // Filter out any null values

    // Update the state with the selected roles
    setSelectedRoles(selectedRoles);
  };

  const handleDelete = () => {
    if (!deleteUserId) return;

    handleRequest(`/api/admin/users/${deleteUserId}`, 'DELETE', {}, {
      onSuccess: () => {
        getList({});
        if (deleteUserId === selectedUser?.id) {
          setIsEdit(false);
          clearForm();
        }
        setDeleteUserId(null);
        closeAskDialog();
      },
      successTitleId: 'text.user_deleted',
      successDescriptionId: 'text.user_delete_success',
      errorDescriptionId: 'text.user_delete_failed'
    });
  };
  const askDelete = (id: number) => {
    setDeleteUserId(id);
    setIsDelDlgOpen(true);
  }
  const closeAskDialog = () => {
    setDeleteUserId(null);
    setIsDelDlgOpen(false);
  };

  const onSaveApprover = (approver: User | null) => {
    setIsApproversDlgOpen(false);
    if (approver == null || selectedUser == null) return;

    handleRequest(`/api/admin/users/setApprover/${selectedUser?.id}/${approver.id}`, 'PUT', {}, {
      onSuccess: () => {
        getList({});
      },
      successTitleId: 'text.approver_set_success',
      successDescriptionId: 'text.approver_has_been_set',
      errorDescriptionId: 'text.approver_set_failed'
    });
  }

  const closeUnsetApproverDialog = () => {
    setIsUnsetApproverDlgOpen(false);
  }

  const handleUnsetApprover = () => {
    closeUnsetApproverDialog();
    if (!selectedUser) return;

    handleRequest(`/api/admin/users/unsetApprover/${selectedUser.id}`, 'PUT', {}, {
      onSuccess: () => {
        getList({});
      },
      successTitleId: 'text.approver_unset_success',
      successDescriptionId: 'text.approver_has_been_unset',
      errorDescriptionId: 'text.approver_unset_failed'
    });
  }

  const handleActivateUser = (user: User) => {
    handleRequest(`/api/admin/users/activate/${user.id}`, 'PUT', {}, {
      onSuccess: () => {
        getList({});
      },
      successTitleId: 'text.user_activated',
      successDescriptionId: 'text.user_activation_success',
      errorDescriptionId: 'text.user_activation_failed'
    });
  }

  const handleDeactivateUser = (user: User) => {
    handleRequest(`/api/admin/users/deactivate/${user.id}`, 'PUT', {}, {
      onSuccess: () => {
        getList({});
      },
      successTitleId: 'text.user_deactivated',
      successDescriptionId: 'text.user_deactivation_success',
      errorDescriptionId: 'text.user_deactivation_failed'
    });
  }

  const canSetApprover = (user: User) => {
    return !(approvers.length == 1 && approvers[0].id === user.id);
  }

  

  return (
    <DamBasePage
      title={intl.formatMessage({ id: 'text.user_management' })}
    >
      <Flex flexDir="column" w="100%" maxW="100%">
        {isShowEditForm && <Flex w="100%">
          <Flex pt={5} w="100%">
            <Flex id="flexUserForm" direction={'column'} w='full' pr={4}>
              <Flex gap={4}>
                <Flex w='full' direction="column">
                  <Input
                    id="inputFirstName"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      setFirstNameError(''); // Clear error when user types
                    }}
                    placeholder={intl.formatMessage({ id: 'text.first_name' })}
                    isInvalid={!!firstNameError}
                    borderColor={firstNameError ? 'red.300' : undefined}
                  />
                  {firstNameError && (
                    <Text fontSize="xs" color="red.500" mt={1}>
                      {firstNameError}
                    </Text>
                  )}
                </Flex>
                <Flex w='full' direction="column">
                  <Input
                    id="inputLastName"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      setLastNameError(''); // Clear error when user types
                    }}
                    placeholder={intl.formatMessage({ id: 'text.last_name' })}
                    isInvalid={!!lastNameError}
                    borderColor={lastNameError ? 'red.300' : undefined}
                  />
                  {lastNameError && (
                    <Text fontSize="xs" color="red.500" mt={1}>
                      {lastNameError}
                    </Text>
                  )}
                </Flex>
                <Flex w='full' direction="column">
                  <Input
                    id="inputEmail"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError(''); // Clear error when user types
                    }}
                    placeholder={intl.formatMessage({ id: 'text.email' })}
                    isInvalid={!!emailError}
                    borderColor={emailError ? 'red.300' : undefined}
                  />
                  {emailError && (
                    <Text fontSize="xs" color="red.500" mt={1}>
                      {emailError}
                    </Text>
                  )}
                </Flex>
              </Flex>
              <Flex gap={4} mt={4}>
                <Flex w={'full'}>
                  <Box w="100%" minW="100%">
                    <Select
                      id="selectRoles"
                      isMulti
                      value={selectedRoles.map(role => ({ label: role.name, value: role.id.toString() }))}
                      options={roleOptions}
                      onChange={handleRoleChange}
                      placeholder="Select Roles"
                      closeMenuOnSelect={false} // Allow multi-selection without closing the menu
                      isSearchable={false} // Disable search functionality
                      size="md"
                      chakraStyles={{
                        container: (provided) => ({
                          ...provided,
                          width: "100%"
                        })
                      }}
                    />
                  </Box>
                </Flex>
              </Flex>
              {!isEdit && (
                <Flex mt={2}>
                  <Text fontSize="sm" color="gray.600">
                    <FormattedMessage id="text.user_will_receive_email" />
                  </Text>
                </Flex>
              )}
              <Flex mt={2}>
                <Text fontSize="xs" color="gray.500">
                  <FormattedMessage id="text.user_validation_rules" />
                </Text>
              </Flex>
            </Flex>
            <Flex direction={'column'} gap={4} alignItems={'center'} w='110px'>
              <Button
                id="btnSaveUser"
                colorScheme={isEdit ? "green" : "blue"}
                w='full'
                onClick={isEdit ? handleUpdate : handleCreate}
                disabled={!firstName || !lastName || !email}
                pr="30px"
                pl="30px"
                borderRadius="5px"
                data-testid="submit-button"
              >
                <FormattedMessage id="text.save" />
              </Button>
              {isEdit && (
                <DamButton
                  borderRadius="5px" pr="30px" pl="30px"
                  w='full'
                  colorScheme="red"
                  onClick={() => {
                    clearForm();
                    setIsEdit(false);
                    setIsShowEditForm(false);
                  }}>
                  <FormattedMessage id='text.cancel' />
                </DamButton>
              )}
            </Flex>
          </Flex>
        </Flex>}
        <Flex flexWrap="wrap" w="100%">
          <Flex pt={5} flexDir="column" w="100%">
            <DamCard mt="4" w="100%" overflow="hidden">
              <DamCardBody p={6}>
                <Flex
                  justify="space-between"
                  align={{ base: "flex-start", md: "center" }}
                  mb={4}
                  wrap="wrap"
                  gap={3}
                  direction={{ base: "column", md: "row" }}
                  w="100%"
                >
                  <Text fontSize="lg" fontWeight="bold" flexShrink={0} minW="fit-content" mb={{ base: 2, md: 0 }}>
                    <FormattedMessage id="text.users" />
                  </Text>
                  
                  {/* Search Section */}
                  <Flex flex="1" justify="center" maxW={{ base: "100%", md: "400px" }} mx={4}>
                    <VStack w="100%" spacing={2}>
                      <InputGroup size="md" w="100%">
                        <InputLeftElement pointerEvents="none">
                          <SearchIcon color="gray.400" />
                        </InputLeftElement>
                        <Input
                          placeholder={intl.formatMessage({ id: 'text.search_users_placeholder' })}
                          value={searchTerm}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          bg={useColorModeValue('white', 'gray.700')}
                          border="1px solid"
                          borderColor={isSearchActive ? 'blue.400' : 'gray.300'}
                          _hover={{ borderColor: 'gray.400' }}
                          _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px #3182ce' }}
                          pr={searchTerm ? "40px" : "12px"}
                        />
                        {searchTerm && (
                          <Tooltip label={intl.formatMessage({ id: 'text.search_clear' })} fontSize="xs">
                            <IconButton
                              aria-label={intl.formatMessage({ id: 'text.search_clear' })}
                              icon={<CloseIcon />}
                              size="xs"
                              variant="ghost"
                              position="absolute"
                              right="8px"
                              top="50%"
                              transform="translateY(-50%)"
                              onClick={clearSearch}
                              zIndex={2}
                            />
                          </Tooltip>
                        )}
                      </InputGroup>
                      
                      {/* Search Suggestions */}
                      {searchTerm && getSearchSuggestions().length > 0 && (
                        <HStack spacing={2} w="100%" justify="flex-start" flexWrap="wrap">
                          <Text fontSize="xs" color="gray.500">
                            <FormattedMessage id="text.search_suggestions_try" />
                          </Text>
                          {getSearchSuggestions().map((suggestion, index) => (
                            <Badge
                              key={suggestion}
                              variant="outline"
                              colorScheme="blue"
                              cursor="pointer"
                              fontSize="xs"
                              onClick={() => handleSearchChange(suggestion)}
                              _hover={{ bg: 'blue.50' }}
                            >
                              {suggestion}
                            </Badge>
                          ))}
                        </HStack>
                      )}
                      
                      {/* Search Status */}
                      {isSearchActive && (
                        <Text fontSize="xs" color="blue.600" w="100%" textAlign="center">
                          {users.length} {users.length === 1 
                            ? intl.formatMessage({ id: 'text.search_results_count' })
                            : intl.formatMessage({ id: 'text.search_results_count_plural' })
                          } for "{searchTerm}"
                        </Text>
                      )}
                    </VStack>
                  </Flex>
                  
                  <Flex
                    justify="flex-end"
                    flexShrink={0}
                    flex={{ base: "none", md: "0" }}
                    w={{ base: "100%", md: "auto" }}
                  >
                    <HStack spacing={3}>
                      <DamButton
                        size="sm"
                        colorScheme="blue"
                        onClick={onBulkUploadOpen}
                        whiteSpace="nowrap"
                        minW="fit-content"
                      >
                        <FormattedMessage id="text.bulk_upload" />
                      </DamButton>
                      <DamButton
                        size="sm"
                        colorScheme="blue"
                        onClick={() => {
                          setIsShowEditForm(true);
                          setIsEdit(false);
                          clearForm();
                        }}
                        whiteSpace="nowrap"
                        minW="fit-content"
                      >
                        <FormattedMessage id="text.new_user" />
                      </DamButton>
                    </HStack>
                  </Flex>
                </Flex>
                <ConfigProvider prefixCls={defauleDark}>
                  <TableContainer w='100%' sx={{ overflowX: 'scroll' }}>
                    <Table variant='simple' size='md' w='100%'>
                      <Thead>
                        <Tr>
                          <Th><FormattedMessage id='text.id' /></Th>
                          <Th><FormattedMessage id='text.first_name' /></Th>
                          <Th><FormattedMessage id='text.last_name' /></Th>
                          <Th><FormattedMessage id='text.email' /></Th>
                          <Th><FormattedMessage id='text.status' /></Th>
                          <Th><FormattedMessage id='text.approver' /></Th>
                          <Th><FormattedMessage id='text.role' /></Th>
                          <Th><FormattedMessage id='text.actions' /></Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {users && users.length > 0 ? (
                          users.map((user) => (
                            <Tr key={user.id}
                              onClick={() => handleSelectUser(user)}
                              cursor={'pointer'}
                              backgroundColor={user.id === selectedUser?.id ? selectedRowBg : 'transparent'}>
                              <Td>{user.id}</Td>
                              <Td>{user.firstName}</Td>
                              <Td>{user.lastName}</Td>
                              <Td>{user.email}</Td>
                              <Td>
                                <Text
                                  color={user.isActive ? 'green.500' : 'red.500'}
                                  fontWeight="bold"
                                  fontSize="sm"
                                >
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </Text>
                              </Td>
                              <Td>
                                {user.approver ?
                                  <Flex
                                    alignItems={'center'}
                                    gap={2}
                                  >
                                    <Text
                                      textDecoration={'underline'}
                                      mb={0}
                                      onClick={() => setIsApproversDlgOpen(true)}>
                                      {user.approver.email}
                                    </Text>
                                    <IconButton
                                      colorScheme="red"
                                      aria-label="unset"
                                      size="sm"
                                      icon={<CloseIcon />}
                                      onClick={() => {
                                        setIsUnsetApproverDlgOpen(true);
                                      }}
                                    />
                                  </Flex>
                                  :
                                  <Button
                                    disabled={!canSetApprover(user)}
                                    colorScheme="green"
                                    onClick={() => setIsApproversDlgOpen(true)}>
                                    <FormattedMessage id='text.set_approver' />
                                  </Button>
                                }
                              </Td>
                              <Td>
                                {user.roles?.map(role => role.name).join(', ') ?? 'NONE'}
                              </Td>
                              <Td>
                                <Flex gap={2}>
                                  {user.isActive ? (
                                    <Button 
                                      size="sm" 
                                      colorScheme="orange" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeactivateUser(user);
                                      }}
                                    >
                                      <FormattedMessage id="text.deactivate" />
                                    </Button>
                                  ) : (
                                    <Button 
                                      size="sm" 
                                      colorScheme="green" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleActivateUser(user);
                                      }}
                                    >
                                      <FormattedMessage id="text.activate" />
                                    </Button>
                                  )}
                                  <Button 
                                    size="sm" 
                                    colorScheme="red" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      askDelete(user.id);
                                    }}
                                  >
                                    <FormattedMessage id="text.delete" />
                                  </Button>
                                </Flex>
                              </Td>
                            </Tr>
                          ))
                        ) : (
                          <Tr>
                            <Td colSpan={8} textAlign="center">
                              <FormattedMessage id="text.noUsers" defaultMessage="No users are registered" />
                            </Td>
                          </Tr>
                        )}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </ConfigProvider>
              </DamCardBody>
            </DamCard>
          </Flex>
        </Flex>
      </Flex>

      <DamAlertDialog
        isOpen={isDelDlgOpen}
        onClose={closeAskDialog}
        onConfirm={handleDelete}
        title="text.delete_user"
        message="text.are_you_sure_del_user"
        confirmButtonId="btnConfirmDeleteUser"
      />

      <DamAlertDialog
        isOpen={isUnsetApproverDlgOpen}
        onClose={() => setIsUnsetApproverDlgOpen(false)}
        onConfirm={handleUnsetApprover}
        title="text.unset_approver"
        message="text.are_you_sure_unset_approver"
        confirmButtonId="btnConfirmUnsetApprover"
      />


      <UserApproversDlg
        approvers={approvers}
        selectedUser={selectedUser}
        isOpen={isApproversDlgOpen}
        onSaveApprover={onSaveApprover}
        confirmButtonId="btnConfirmSaveApprover"
      />

      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={onBulkUploadClose}
        onUploadSuccess={() => getList({})}
        config={userBulkUploadConfig}
      />
    </DamBasePage>
  );
}