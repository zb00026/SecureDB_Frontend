import {
  AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay,
  Box, Button, Checkbox, Flex, Input, Table, TableContainer, Tbody, Td, Th, Thead, Tr, useColorModeValue
} from "@chakra-ui/react";
import { MyButton, MyCard, MyCardBody, MyCardDivider, MyContent, PrimaryButton, request, stateActions, TextCardHeader, useListPage, useMyToast } from "@common/index";
import { Role } from "@models/Role";
import { User } from "@models/User";
import { ConfigProvider } from "antd";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Link } from "react-router-dom";
import { MultiValue, Select } from 'chakra-react-select';
import { AUTH_PROVIDER } from "@/constants/enums";

type Option = {
  label: string;  // The display name of the role
  value: string;  // The ID of the role
};


export const isSearchable = true;
export const displayName = 'User Management Page';

export function Component() {
  const { showSuccess, showError } = useMyToast();
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
  const cancelRef = useRef(null);
  const defauleDark = useColorModeValue("ant", "antdark");

  const { getData, getList } = useListPage({
    baseUri: "/api/admin/users",
    defaultParams: {
      method: 'GET'
    }
  });
  useEffect(() => {
    setUsers(getData);
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
      showError({ description: e?.response?.data?.error ?? intl.formatMessage({ id: 'text.failed_getting_roles' }) });
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
    stateActions.addLoading();
    request(`/api/admin/users/${selectedUser.id}`, {
      method: 'PUT',
      data: { name, email, roles: selectedRoles }
    }).then(() => {
      getList({});
      showSuccess({
        title: intl.formatMessage({ id: 'text.user_updated' }),
        description: intl.formatMessage({ id: 'text.user_update_success' })
      });
      clearForm();
    }).catch((e) => {
      showError({ description: e?.response?.data?.error ?? intl.formatMessage({ id: 'text.user_update_failed' }) });
    });
  };
  const handleCreate = async () => {
    if (selectedUser) return;
    const auth_provider = import.meta.env.VITE_AUTH_PROVIDER || AUTH_PROVIDER.GOOGLE;
    stateActions.addLoading();
    let postUri = `/api/admin/users`;
    let postData: any = { firstName, lastName, email, password, roles: selectedRoles };
    if (chkInvitation) {
      postUri = `/api/admin/users/createUserAndSendInvite`;
      postData = {
        user: { firstName, lastName, email, password, roles: selectedRoles },
        authProvider: auth_provider.toUpperCase()
      };
    }
    request(postUri, {
      method: 'POST',
      data: postData
    }).then(() => {
      getList({});
      showSuccess({
        title: intl.formatMessage({ id: 'text.user_created' }),
        description: intl.formatMessage({ id: 'text.user_create_success' })
      });
      clearForm();

    }).catch((e) => {
      showError({ description: e?.response?.data?.error ?? intl.formatMessage({ id: 'text.user_create_failed' }) });
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
    stateActions.addLoading();
    request(`/api/admin/users/${deleteUserId}`, {
      method: 'DELETE',
      data: {}
    }).then(() => {
      getList({});
      setIsDelDlgOpen(false);
      if (deleteUserId == selectedUser?.id) {
        setIsEdit(false);
        clearForm();
      }
      setDeleteUserId(null);
      showSuccess({
        title: intl.formatMessage({ id: 'text.user_deleted' }),
        description: intl.formatMessage({ id: 'text.user_delete_success' })
      });
    }).catch((e) => {
      setIsDelDlgOpen(false);
      showError({ description: e?.response?.data?.error ?? intl.formatMessage({ id: 'text.user_delete_failed' }) });
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
  return (
    <MyContent w="98%">
      <Flex flexDir="column">
        <Flex w="100%">
          <Flex pt={5} w="100%">
            <Link to="/admin">
              <MyButton colorScheme="green" mr={4}>
                <FormattedMessage id="text.home" />
              </MyButton>
            </Link>
            <Flex direction={'column'} w='full' pr={4}>
              <Flex gap={4}>
                <Flex w='full'>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={intl.formatMessage({ id: 'text.first_name' })}
                  />
                </Flex>
                <Flex w='full'>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={intl.formatMessage({ id: 'text.last_name' })}
                  />
                </Flex>

              </Flex>
              <Flex gap={4} mt={4}>
                <Flex w='full'>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={intl.formatMessage({ id: 'text.email' })}
                  />
                </Flex>

                <Flex w={'full'}>
                  <Box w="100%" minW="100%">
                    <Select
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
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={intl.formatMessage({ id: 'text.password' })}
                  />
                </Flex>

                <Flex w='full'>
                  <Checkbox
                    disabled={isEdit}
                    checked={chkInvitation}
                    onChange={(e) => { setChkInvitation(e.target.checked) }}
                  >
                    <FormattedMessage id="text.invite_email" />
                  </Checkbox>
                </Flex>

              </Flex>
            </Flex>
            <Flex direction={'column'} gap={4} alignItems={'center'} w='110px'>
              <Button
                colorScheme={isEdit ? "green" : "blue"}
                w='full'
                onClick={isEdit ? handleUpdate : handleCreate} disabled={!firstName || !lastName || !email} pr="30px" pl="30px" borderRadius="5px">
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
            <MyCard mt="4">
              <MyCardBody>
                <TextCardHeader>
                  <FormattedMessage id="text.users" />
                </TextCardHeader>
                <Flex flexDir="column" w="full" px={6}>
                  <MyCardDivider></MyCardDivider>
                  <ConfigProvider prefixCls={defauleDark}>
                    <TableContainer w='100%' sx={{ overflowX: 'scroll' }}>
                      <Table variant='simple' size='md' w='100%'>
                        <Thead>
                          <Tr>
                            <Th><FormattedMessage id='text.id' /></Th>
                            <Th><FormattedMessage id='text.first_name' /></Th>
                            <Th><FormattedMessage id='text.last_name' /></Th>
                            <Th><FormattedMessage id='text.email' /></Th>
                            <Th><FormattedMessage id='text.role' /></Th>
                            <Th></Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {users && users.length > 0 ? (
                            users.map((user) => (
                              <Tr key={user.id}>
                                <Td onClick={() => handleSelectUser(user)}>{user.id}</Td>
                                <Td onClick={() => handleSelectUser(user)}>{user.firstName}</Td>
                                <Td onClick={() => handleSelectUser(user)}>{user.lastName}</Td>
                                <Td onClick={() => handleSelectUser(user)}>{user.email}</Td>
                                <Td onClick={() => handleSelectUser(user)}>
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
              </MyCardBody>
            </MyCard>
          </Flex>
        </Flex>
      </Flex>

      <AlertDialog
        isOpen={isDelDlgOpen}
        leastDestructiveRef={cancelRef}
        onClose={closeAskDialog}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              <FormattedMessage id='text.delete_user' />
            </AlertDialogHeader>
            <AlertDialogBody>
              <FormattedMessage id='text.are_you_sure_del_user' />
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={closeAskDialog}>
                <FormattedMessage id='text.cancel' />
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                <FormattedMessage id='text.delete' />
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </MyContent>
  );
}