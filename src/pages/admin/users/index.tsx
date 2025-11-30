import {
  Text, Flex, useDisclosure, HStack, useBreakpointValue
} from "@chakra-ui/react";
import { DamButton, DamCard, DamCardBody, request, useListPage, useDamToast, userHasRole, BulkUploadModal, BulkUploadConfig, ActionMenu, ActionMenuItem } from "@common/index";
import { handleRowClick, handleCheckboxClick } from "@common/libs/utils/tableSelection";
import { DamAlertDialog } from "@common/components/DamDialog/DamAlertDialog";
import { useApiRequest } from "@common/hooks/useApiRequest";
import { Role } from "@models/Role";
import { User } from "@models/User";
import { useEffect, useState, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { MultiValue } from 'chakra-react-select';
import { AUTH_PROVIDER, USER_ROLE, FEATURE_FLAGS } from "@/constants/enums";

import { DamBasePage } from "@common/components/DamBasePage";
import { UserApproversDlg } from "./components/user_approvers_dlg";
import { useRoles } from "./hooks/useRoles";
import { UserForm } from "./components/UserForm";
import { UserSearchSection } from "./components/UserSearchSection";
import { UsersTable } from "./components/UsersTable";

export type RoleOption = {
  label: string;  // The display name of the role
  value: string;  // The ID of the role
};

export const isSearchable = true;
export const displayName = 'User Management Page';

// Helper function to build edit action menu item
const buildEditMenuItem = (selectedUser: User, handleSelectUser: (user: User) => void): ActionMenuItem => ({
  label: 'Edit',
  onClick: () => handleSelectUser(selectedUser),
  colorScheme: 'blue',
  variant: 'outline',
});

// Helper function to build approver action menu items
const buildApproverMenuItems = (
  selectedUser: User,
  canSetApprover: (user: User) => boolean,
  setIsApproversDlgOpen: (open: boolean) => void,
  setIsUnsetApproverDlgOpen: (open: boolean) => void
): ActionMenuItem[] => {
  // Only build approver menu items if feature flag is enabled
  if (!FEATURE_FLAGS.ENABLE_APPROVER_ROLE) {
    return [];
  }
  
  const items: ActionMenuItem[] = [];
  
  if (!selectedUser.approver && canSetApprover(selectedUser)) {
    items.push({
      label: 'Set Approver',
      onClick: () => setIsApproversDlgOpen(true),
      colorScheme: 'green',
      variant: 'outline',
    });
  }
  
  if (selectedUser.approver) {
    items.push({
      label: 'Unset Approver',
      onClick: () => setIsUnsetApproverDlgOpen(true),
      colorScheme: 'orange',
      variant: 'outline',
    });
  }
  
  return items;
};

// Helper function to build status action menu items
const buildStatusMenuItems = (
  selectedUser: User,
  selectedRows: User[],
  handleUserOperation: (promise: Promise<any>, successTitle: string, successDescription: string, errorMessageId: string) => void,
  handleActivateUser: (user: User) => Promise<any>,
  handleDeactivateUser: (user: User) => Promise<any>
): ActionMenuItem[] => {
  const items: ActionMenuItem[] = [];
  const inactiveUsers = selectedRows.filter(user => !user.isActive);
  const activeUsers = selectedRows.filter(user => user.isActive);
  
  if (inactiveUsers.length > 0) {
    items.push({
      label: 'Activate',
      onClick: () => {
        handleUserOperation(
          handleActivateUser(selectedUser),
          'text.user_activated',
          'text.user_activation_success',
          'text.user_activation_failed'
        );
      },
      colorScheme: 'green',
      variant: 'outline',
    });
  }
  
  if (activeUsers.length > 0) {
    items.push({
      label: 'Deactivate',
      onClick: () => {
        handleUserOperation(
          handleDeactivateUser(selectedUser),
          'text.user_deactivated',
          'text.user_deactivation_success',
          'text.user_deactivation_failed'
        );
      },
      colorScheme: 'orange',
      variant: 'outline',
    });
  }
  
  return items;
};

// Helper function to build delete action menu item
const buildDeleteMenuItem = (selectedUser: User, askDelete: (id: number) => void): ActionMenuItem => ({
  label: 'Delete',
  onClick: () => {
    askDelete(selectedUser.id);
  },
  colorScheme: 'red',
  variant: 'outline',
});

// Helper function to validate email format
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

// Helper function to validate basic fields
const validateBasicFields = (
  firstName: string,
  lastName: string,
  email: string,
  setFirstNameError: (error: string) => void,
  setLastNameError: (error: string) => void,
  setEmailError: (error: string) => void,
  intl: any
): boolean => {
  const trimmedFirstName = firstName.trim();
  const trimmedLastName = lastName.trim();
  const trimmedEmail = email.trim().toLowerCase();
  
  let hasErrors = false;
  
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
  } else if (!isValidEmail(trimmedEmail)) {
    setEmailError(intl.formatMessage({ id: 'text.please_enter_valid_email' }));
    hasErrors = true;
  }
  
  return hasErrors;
};

// Helper function to check for duplicate email
const checkDuplicateEmail = (
  email: string,
  users: User[],
  excludeUserId?: number
): User | undefined => {
  const trimmedEmail = email.trim().toLowerCase();
  return users.find(user => 
    user.email.toLowerCase() === trimmedEmail && 
    (!excludeUserId || user.id !== excludeUserId)
  );
};

// Helper function to get search suggestions
const getSearchSuggestionsHelper = (searchTerm: string, roles: Role[]): string[] => {
  if (!searchTerm) return [];
  
  const suggestions: string[] = [];
  const term = searchTerm.toLowerCase();
  
  if ('active'.includes(term) || 'enabled'.includes(term)) {
    suggestions.push('active');
  }
  if ('inactive'.includes(term) || 'disabled'.includes(term)) {
    suggestions.push('inactive');
  }
  
  roles.forEach(role => {
    if (role.name.toLowerCase().includes(term)) {
      suggestions.push(role.name);
    }
  });
  
  return suggestions.slice(0, 3);
};

export function Component() {
  const { showError, showSuccess } = useDamToast();
  const [users, setUsers] = useState<Array<User>>([]);
  const intl = useIntl();
  
  // Responsive layout: horizontal on lg+, vertical on smaller screens
  const isHorizontal = useBreakpointValue({ base: false, lg: true });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Array<Role>>([]);
  const [isDelDlgOpen, setIsDelDlgOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const { roles, roleOptions } = useRoles();
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
  
  // Row selection state
  const [selectedRowKeys, setSelectedRowKeys] = useState<readonly string[]>([]);
    
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
  const getSearchSuggestions = useCallback(() => {
    return getSearchSuggestionsHelper(searchTerm, roles);
  }, [searchTerm, roles]);

  useEffect(() => {
    const tmpUsers = Array.isArray(getData) ? getData : getData.content;
    if (tmpUsers) {
      setUsers(tmpUsers);
      // Only set approvers if feature flag is enabled
      if (FEATURE_FLAGS.ENABLE_APPROVER_ROLE) {
        setApprovers(tmpUsers.filter(user => userHasRole(user, USER_ROLE.APPROVER)));
      } else {
        setApprovers([]);
      }
    }
  }, [getData]);

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
    // Filter out 'Approver' role from selected roles if feature flag is disabled
    const filteredRoles = FEATURE_FLAGS.ENABLE_APPROVER_ROLE 
      ? (user.roles || [])
      : (user.roles || []).filter(role => role.name !== USER_ROLE.APPROVER);
    setSelectedRoles(filteredRoles);
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
  const validateUserUniqueness = useCallback((firstName: string, lastName: string, email: string, excludeUserId?: number) => {
    // Clear previous errors
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    
    // Basic field validation
    const hasBasicErrors = validateBasicFields(
      firstName,
      lastName,
      email,
      setFirstNameError,
      setLastNameError,
      setEmailError,
      intl
    );
    
    if (hasBasicErrors) {
      return false;
    }
    
    // Check for duplicate email
    const trimmedEmail = email.trim().toLowerCase();
    const existingUserWithEmail = checkDuplicateEmail(trimmedEmail, users, excludeUserId);
    
    if (existingUserWithEmail) {
      setEmailError(intl.formatMessage({ id: 'text.email_already_exists' }));
      return false;
    }
    
    return true;
  }, [users, intl]);

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
      .filter((role): role is Role => role !== null)  // Filter out any null values
      .filter(role => FEATURE_FLAGS.ENABLE_APPROVER_ROLE || role.name !== USER_ROLE.APPROVER);  // Filter out 'Approver' role if feature flag is disabled

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
    return request(`/api/admin/users/activate/${user.id}`, { method: 'PUT' });
  }

  const handleDeactivateUser = (user: User) => {
    return request(`/api/admin/users/deactivate/${user.id}`, { method: 'PUT' });
  }

  const canSetApprover = (user: User) => {
    return !(approvers.length == 1 && approvers[0].id === user.id);
  }
  
  // Computed selected rows
  const selectedRows = useMemo(() => {
    return users.filter(user => user.id && selectedRowKeys.includes(String(user.id)));
  }, [users, selectedRowKeys]);

  const selectAll = () => {
    const allKeys = users.filter(user => user.id).map(user => String(user.id));
    setSelectedRowKeys(allKeys);
  };

  const deselectAll = () => {
    setSelectedRowKeys([]);
  };

  // Helper function to handle success/error for user operations
  const handleUserOperation = (
    promise: Promise<any>,
    successTitle: string,
    successDescription: string,
    errorMessageId: string
  ) => {
    promise
      .then(() => {
        showSuccess({
          title: intl.formatMessage({ id: successTitle }),
          description: intl.formatMessage({ id: successDescription })
        });
        setSelectedRowKeys([]);
        getList({});
      })
      .catch((error: any) => {
        showError({
          description: error?.response?.data?.error ?? intl.formatMessage({ id: errorMessageId })
        });
      });
  };

  // Wrapper functions for user IDs
  const handleUserRowClick = (userId: number) => {
    handleRowClick(String(userId), selectedRowKeys, setSelectedRowKeys);
  };

  const handleUserCheckboxClick = (userId: number, checked: boolean) => {
    handleCheckboxClick(String(userId), checked, selectedRowKeys, setSelectedRowKeys);
  };

  const isAllSelected = users.length > 0 && selectedRowKeys.length === users.filter(user => user.id).length;
  const isIndeterminate = selectedRowKeys.length > 0 && selectedRowKeys.length < users.filter(user => user.id).length;

  // Build action menu items based on selected rows
  const actionMenuItems: ActionMenuItem[] = useMemo(() => {
    const singleSelected = selectedRows.length === 1;
    const selectedUserForActions = singleSelected ? selectedRows[0] : null;

    if (!selectedUserForActions) {
      return [];
    }

    return [
      buildEditMenuItem(selectedUserForActions, handleSelectUser),
      ...buildApproverMenuItems(selectedUserForActions, canSetApprover, setIsApproversDlgOpen, setIsUnsetApproverDlgOpen),
      ...buildStatusMenuItems(selectedUserForActions, selectedRows, handleUserOperation, handleActivateUser, handleDeactivateUser),
      buildDeleteMenuItem(selectedUserForActions, askDelete)
    ];
  }, [selectedRows, handleSelectUser, canSetApprover, setIsApproversDlgOpen, setIsUnsetApproverDlgOpen, handleUserOperation, handleActivateUser, handleDeactivateUser, askDelete]);

  return (
    <DamBasePage
      title={intl.formatMessage({ id: 'text.user_management' })}
    >
      <Flex flexDir="column" w="100%" maxW="100%">
        {isShowEditForm && (
          <UserForm
            isHorizontal={isHorizontal ?? false}
            firstName={firstName}
            lastName={lastName}
            email={email}
            selectedRoles={selectedRoles}
            roleOptions={roleOptions}
            firstNameError={firstNameError}
            lastNameError={lastNameError}
            emailError={emailError}
            isEdit={isEdit}
            onFirstNameChange={(value) => {
              setFirstName(value);
              setFirstNameError('');
            }}
            onLastNameChange={(value) => {
              setLastName(value);
              setLastNameError('');
            }}
            onEmailChange={(value) => {
              setEmail(value);
              setEmailError('');
            }}
            onRoleChange={handleRoleChange}
            onSave={isEdit ? handleUpdate : handleCreate}
            onCancel={() => {
              clearForm();
              setIsEdit(false);
              setIsShowEditForm(false);
            }}
          />
        )}
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
                  minH={{ base: "auto", md: "32px" }}
                >
                  <Flex align="center" gap={2} minH="32px">
                    <Text fontSize="lg" fontWeight="bold" flexShrink={0} minW="fit-content" mb={{ base: 2, md: 0 }} lineHeight="32px">
                      <FormattedMessage id="text.users" />
                      {selectedRows.length > 0 && ` (${selectedRows.length} selected)`}
                    </Text>
                  </Flex>
                  
                  {/* Search Section */}
                  <UserSearchSection
                    searchTerm={searchTerm}
                    isSearchActive={isSearchActive}
                    usersCount={users.length}
                    suggestions={getSearchSuggestions()}
                    onSearchChange={handleSearchChange}
                    onClearSearch={clearSearch}
                  />
                  
                  <Flex
                    justify="flex-end"
                    flexShrink={0}
                    flex={{ base: "none", md: "0" }}
                    w={{ base: "100%", md: "auto" }}
                    align="center"
                    gap={3}
                    minH={{ base: "auto", md: "32px" }}
                  >
                    <ActionMenu
                      items={actionMenuItems}
                      hasSelection={selectedRows.length === 1}
                      selectedCount={selectedRows.length}
                      variant="buttons"
                    />
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
                <UsersTable
                  users={users}
                  selectedRowKeys={selectedRowKeys}
                  selectedUser={selectedUser}
                  onUserRowClick={handleUserRowClick}
                  onUserCheckboxClick={handleUserCheckboxClick}
                  onSelectUser={handleSelectUser}
                  isAllSelected={isAllSelected}
                  isIndeterminate={isIndeterminate}
                  onSelectAll={selectAll}
                  onDeselectAll={deselectAll}
                  onApproverClick={() => setIsApproversDlgOpen(true)}
                />
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

      {FEATURE_FLAGS.ENABLE_APPROVER_ROLE && (
        <>
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
            selectedUser={selectedRows.length === 1 ? selectedRows[0] : selectedUser}
            isOpen={isApproversDlgOpen}
            onSaveApprover={onSaveApprover}
            confirmButtonId="btnConfirmSaveApprover"
          />
        </>
      )}

      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={onBulkUploadClose}
        onUploadSuccess={() => getList({})}
        config={userBulkUploadConfig}
      />
    </DamBasePage>
  );
}