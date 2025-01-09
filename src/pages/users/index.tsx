import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Box, Button, Flex, Input, Table, TableContainer, Tbody, Td, Th, Thead, Tr, useColorModeValue } from "@chakra-ui/react";
import { MyCard, MyCardBody, MyCardDivider, MyContent, PrimaryButton, request, stateActions, TextCardHeader, useListPage, useMyToast } from "@common/index";
import { User } from "@models/User";
import { ConfigProvider } from "antd";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export function Component() {
    const { showSuccess, showError } = useMyToast();
    const [users, setUsers] = useState<Array<User>>([]);
    const intl = useIntl();

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEdit, setIsEdit] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isDelDlgOpen, setIsDelDlgOpen] = useState(false);
    const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
    const cancelRef = useRef(null);
    const defauleDark = useColorModeValue("ant", "antdark");

    const { getData, getList, pagination, params } = useListPage({
        baseUri: "api/users",
        defaultParams: {
            method: 'GET'
        }
    });
    useEffect(() => {
        setUsers(getData);
    }, [getData]);
    useEffect(() => {
        stateActions.addLoading();
    }, []);
    const handleSelectUser = (user: User) => {
        setSelectedUser(user);
        setName(user.name);
        setEmail(user.email);
        setIsEdit(true);
    };
    const handleUpdate = async () => {
        if (!selectedUser) return;
        stateActions.addLoading();
        request(`api/users/${selectedUser.id}`, {
            method: 'PUT',
            data: { name, email }
        }).then(() => {
            getList({});
            showSuccess({
                title: intl.formatMessage({ id: 'text.user_updated' }),
                description: intl.formatMessage({ id: 'text.user_update_success' })
            });
            setIsEdit(false);
            setName('');
            setEmail('');
            setSelectedUser(null);
        }).catch((e) => {
            showError({ description: e?.response?.data?.error ?? intl.formatMessage({ id: 'text.user_update_failed' }) });
        });
    };
    const handleCreate = async () => {
        if (selectedUser) return;
        stateActions.addLoading();
        request(`api/users`, {
            method: 'POST',
            data: { name, email }
        }).then(() => {
            getList({});
            showSuccess({
                title: intl.formatMessage({ id: 'text.user_created' }),
                description: intl.formatMessage({ id: 'text.user_create_success' })
            });
            setSelectedUser(null);
            setIsEdit(false);
            setName('');
            setEmail('');

        }).catch((e) => {
            showError({ description: e?.response?.data?.error ?? intl.formatMessage({ id: 'text.user_create_failed' }) });
        });
    };
    const handleDelete = () => {
        if (!deleteUserId) return;
        stateActions.addLoading();
        request(`api/users/${deleteUserId}`, {
            method: 'DELETE',
            data: {}
        }).then(() => {
            getList({});
            setIsDelDlgOpen(false);
            if (deleteUserId == selectedUser?.id) {
                setIsEdit(false);
                setName('');
                setEmail('');
                setSelectedUser(null);
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
                        <Button
                            colorScheme={isEdit ? "green" : "blue"}
                            onClick={isEdit ? handleUpdate : handleCreate} disabled={!name || !email} pr="30px" pl="30px" borderRadius="5px">
                            {isEdit ? intl.formatMessage({ id: 'text.update' }) : intl.formatMessage({ id: 'text.create' })}
                        </Button>
                        {isEdit && (
                            <PrimaryButton ml="2"
                                borderRadius="5px" pr="30px" pl="30px"
                                onClick={() => {
                                    setIsEdit(false);
                                    setName('');
                                    setEmail('');
                                    setSelectedUser(null);
                                }}>
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