import {
  AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay,
  Box, Button, Flex, Input, Table, TableContainer, Tbody, Td, Th, Thead, Tr, useColorModeValue
} from "@chakra-ui/react";
import { MyButton, MyCard, MyCardBody, MyCardDivider, MyContent, PrimaryButton, request, stateActions, TextCardHeader, useListPage, useMyToast } from "@common/index";
import { Role } from "@models/Role";
import { User } from "@models/User";
import { ConfigProvider } from "antd";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Link } from "react-router-dom";
import { MultiValue, Select } from 'chakra-react-select';

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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Array<Role>>([]);
  const [isDelDlgOpen, setIsDelDlgOpen] = useState(false);
  const [roles, setRoles] = useState<Array<Role>>([]);
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
    setName('');
    setEmail('');
    setSelectedRoles([]);
    setPassword('');
    setSelectedUser(null);
    setIsEdit(false);
  }

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setName(user.name);
    setEmail(user.email);
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
    stateActions.addLoading();
    request(`/api/admin/users`, {
      method: 'POST',
      data: { name, email, password, roles: selectedRoles }
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
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={intl.formatMessage({ id: 'text.name' })}
              mr="4"
            />
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={intl.formatMessage({ id: 'text.email' })}
              mr="4"
            />
            <Box w="250px" minW="250px" mr={4}>
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
                    width: "250px"
                  })
                }}
              />
            </Box>

            <Input
              visibility={!isEdit ? 'visible' : 'hidden'}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={intl.formatMessage({ id: 'text.password' })}
              mr="4"
            />
            <Button
              colorScheme={isEdit ? "green" : "blue"}
              onClick={isEdit ? handleUpdate : handleCreate} disabled={!name || !email} pr="30px" pl="30px" borderRadius="5px">
              {isEdit ? intl.formatMessage({ id: 'text.update' }) : intl.formatMessage({ id: 'text.create' })}
            </Button>
            {isEdit && (
              <PrimaryButton ml="2"
                borderRadius="5px" pr="30px" pl="30px"
                onClick={clearForm}>
                <FormattedMessage id='text.new' />
              </PrimaryButton>
            )}
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
                            <Th><FormattedMessage id='text.name' /></Th>
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
                                <Td onClick={() => handleSelectUser(user)}>{user.name}</Td>
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