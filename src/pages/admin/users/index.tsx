import {
  Box, Button, Checkbox, Text, Flex, Input, Table, TableContainer, Tbody, Td, Th, Thead, Tr, useColorModeValue,
  IconButton
} from "@chakra-ui/react";
import { DamButton, DamCard, DamCardBody, DamCardDivider, DamContent, PrimaryButton, request, stateActions, TextCardHeader, useListPage, useDamToast, userHasRole } from "@common/index";
import { DamAlertDialog } from "@common/components/DamAlert/DamAlertDialog";
import { useApiRequest } from "@common/hooks/useApiRequest";
import { Role } from "@models/Role";
import { User } from "@models/User";
import { ConfigProvider } from "antd";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Link } from "react-router-dom";
import { MultiValue, Select } from 'chakra-react-select';
import { AUTH_PROVIDER, USER_ROLE } from "@/constants/enums";
import { CloseIcon } from "@chakra-ui/icons";
import { UserApproversDlg } from "./components/user_approvers_dlg";
type Option = {
  label: string;  // The display name of the role
  value: string;  // The ID of the role
};


export const isSearchable = true;
export const displayName = 'User Management Page';

export function Component() {
  const { showError } = useDamToast();
  const [users, setUsers] = useState<Array<User>>([]);
  const intl = useIntl();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Array<Role>>([]);
  const [isDelDlgOpen, setIsDelDlgOpen] = useState(false);
  const [roles, setRoles] = useState<Array<Role>>([]);
  const [chkInvitation, setChkInvitation] = useState<boolean>(false);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [roleOptions, setRoleOptions] = useState<Array<Option>>([]);
  const defauleDark = useColorModeValue("ant", "antdark");
  const [approvers, setApprovers] = useState<Array<User>>([]);
  const [isApproversDlgOpen, setIsApproversDlgOpen] = useState<boolean>(false);
  const [isUnsetApproverDlgOpen, setIsUnsetApproverDlgOpen] = useState<boolean>(false);

  const { getData, getList } = useListPage<User>({
    baseUri: "/api/admin/users",
    defaultParams: {
      method: 'GET'
    }
  });
  const { handleRequest } = useApiRequest();

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
      showError({ id: 'toastError', description: e?.response?.data?.error ?? intl.formatMessage({ id: 'text.failed_getting_roles' }) });
    });
  }, []);

  const clearForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setChkInvitation(false);
    setSelectedRoles([]);
    setPassword('');
    setSelectedUser(null);
    setIsEdit(false);
  }

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setChkInvitation(false);
    setSelectedRoles(user.roles || []);
    setIsEdit(true);
  };
  const handleUpdate = async () => {
    if (!selectedUser) return;

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
  const handleCreate = async () => {
    if (selectedUser) return;
    const auth_provider = import.meta.env.VITE_AUTH_PROVIDER || AUTH_PROVIDER.GOOGLE;

    const postUri = chkInvitation ? '/api/admin/users/createUserAndSendInvite' : '/api/admin/users';
    const postData = chkInvitation ? {
      user: { firstName, lastName, email, password, roles: selectedRoles },
      authProvider: auth_provider.toUpperCase()
    } : { firstName, lastName, email, password, roles: selectedRoles };

    handleRequest(postUri, 'POST', postData, {
      onSuccess: () => {
        getList({});
        clearForm();
      },
      successTitleId: 'text.user_created',
      successDescriptionId: 'text.user_create_success',
      errorDescriptionId: 'text.user_create_failed'
    });
  };

  const handleRoleChange = (selectedOptions: MultiValue<Option>) => {
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

  const canSetApprover = (user: User) => {
    return !(approvers.length == 1 && approvers[0].id === user.id);
  }

  return (
    <DamContent w="98%">
      <Flex flexDir="column">
        <Flex w="100%">
          <Flex pt={5} w="100%">
            <Link to="/admin">
              <DamButton colorScheme="green" mr={4}>
                <FormattedMessage id="text.home" />
              </DamButton>
            </Link>
            <Flex id="flexUserForm" direction={'column'} w='full' pr={4}>
              <Flex gap={4}>
                <Flex w='full'>
                  <Input
                    id="inputFirstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={intl.formatMessage({ id: 'text.first_name' })}
                  />
                </Flex>
                <Flex w='full'>
                  <Input
                    id="inputLastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={intl.formatMessage({ id: 'text.last_name' })}
                  />
                </Flex>

              </Flex>
              <Flex gap={4} mt={4}>
                <Flex w='full'>
                  <Input
                    id="inputEmail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={intl.formatMessage({ id: 'text.email' })}
                  />
                </Flex>

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
              <Flex mt={4} gap={4}>
                <Flex w='full'>
                  <Input
                    disabled={isEdit}
                    type="password"
                    value={password}
                    id="inputPassword"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={intl.formatMessage({ id: 'text.password' })}
                  />
                </Flex>

                <Flex w='full'>
                  <Checkbox
                    disabled={isEdit}
                    checked={chkInvitation}
                    id="chkInvitation"
                    onChange={(e) => { setChkInvitation(e.target.checked) }}
                  >
                    <FormattedMessage id="text.invite_email" />
                  </Checkbox>
                </Flex>

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
                {isEdit ? intl.formatMessage({ id: 'text.update' }) : intl.formatMessage({ id: 'text.create' })}
              </Button>
              {isEdit && (
                <PrimaryButton
                  borderRadius="5px" pr="30px" pl="30px"
                  w='full'
                  onClick={clearForm}>
                  <FormattedMessage id='text.clear' />
                </PrimaryButton>
              )}
            </Flex>
          </Flex>
        </Flex>
        <Flex flexWrap="wrap" w="100%">
          <Flex pt={5} flexDir="column" w="100%">
            <DamCard mt="4">
              <DamCardBody>
                <TextCardHeader id="txtUsersTitle">
                  <FormattedMessage id="text.users" />
                </TextCardHeader>
                <Flex flexDir="column" w="full" px={6}>
                  <DamCardDivider></DamCardDivider>
                  <ConfigProvider prefixCls={defauleDark}>
                    <TableContainer w='100%' sx={{ overflowX: 'scroll' }}>
                      <Table variant='simple' size='md' w='100%'>
                        <Thead>
                          <Tr>
                            <Th><FormattedMessage id='text.id' /></Th>
                            <Th><FormattedMessage id='text.first_name' /></Th>
                            <Th><FormattedMessage id='text.last_name' /></Th>
                            <Th><FormattedMessage id='text.email' /></Th>
                            <Th><FormattedMessage id='text.approver' /></Th>
                            <Th><FormattedMessage id='text.role' /></Th>
                            <Th></Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {users && users.length > 0 ? (
                            users.map((user) => (
                              <Tr key={user.id}
                                onClick={() => handleSelectUser(user)}
                                cursor={'pointer'}
                                backgroundColor={user.id === selectedUser?.id ? 'gray.80' : 'transparent'}>
                                <Td>{user.id}</Td>
                                <Td>{user.firstName}</Td>
                                <Td>{user.lastName}</Td>
                                <Td>{user.email}</Td>
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
                                  {user.roles?.map(role => role.name).join(', ') || '-'}
                                </Td>
                                <Td>
                                  <Button colorScheme="red" onClick={() => askDelete(user.id)}>
                                    <FormattedMessage id="text.delete" />
                                  </Button>
                                </Td>
                              </Tr>
                            ))
                          ) : (
                            <Tr>
                              <Td colSpan={4} textAlign="center">
                                <FormattedMessage id="text.noUsers" defaultMessage="No users are registered" />
                              </Td>
                            </Tr>
                          )}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </ConfigProvider>
                </Flex>
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
        onClose={closeUnsetApproverDialog}
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
    </DamContent>
  );
}