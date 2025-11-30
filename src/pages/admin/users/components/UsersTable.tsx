import {
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, Checkbox, Text, useColorModeValue
} from "@chakra-ui/react";
import { ConfigProvider } from "antd";
import { FormattedMessage } from "react-intl";
import { User } from "@models/User";
import { FEATURE_FLAGS } from "@/constants/enums";

// Helper function to calculate row background style
const getRowBackgroundStyle = (isRowSelected: boolean, isSelectedUser: boolean) => {
  if (isRowSelected) {
    return {
      backgroundColor: 'blue.50 !important',
      _dark: {
        backgroundColor: 'blue.900 !important'
      }
    };
  }
  if (isSelectedUser) {
    return {
      _light: {
        backgroundColor: 'gray.200'
      },
      _dark: {
        backgroundColor: 'gray.600'
      }
    };
  }
  return {};
};

interface UsersTableProps {
  readonly users: readonly User[];
  readonly selectedRowKeys: readonly string[];
  readonly selectedUser: User | null;
  readonly onUserRowClick: (userId: number) => void;
  readonly onUserCheckboxClick: (userId: number, checked: boolean) => void;
  readonly onSelectUser: (user: User) => void;
  readonly isAllSelected: boolean;
  readonly isIndeterminate: boolean;
  readonly onSelectAll: () => void;
  readonly onDeselectAll: () => void;
  readonly onApproverClick: () => void;
}

export function UsersTable({
  users,
  selectedRowKeys,
  selectedUser,
  onUserRowClick,
  onUserCheckboxClick,
  onSelectUser,
  isAllSelected,
  isIndeterminate,
  onSelectAll,
  onDeselectAll,
  onApproverClick
}: UsersTableProps) {
  const defaultDark = useColorModeValue("ant", "antdark");

  return (
    <ConfigProvider prefixCls={defaultDark}>
      <TableContainer w='100%' sx={{ overflowX: 'scroll' }}>
        <Table variant='simple' size='md' w='100%'>
          <Thead>
            <Tr>
              <Th width="40px">
                <Checkbox
                  isChecked={isAllSelected}
                  isIndeterminate={isIndeterminate}
                  onChange={(e) => e.target.checked ? onSelectAll() : onDeselectAll()}
                />
              </Th>
              <Th><FormattedMessage id='text.id' /></Th>
              <Th><FormattedMessage id='text.first_name' /></Th>
              <Th><FormattedMessage id='text.last_name' /></Th>
              <Th><FormattedMessage id='text.email' /></Th>
              <Th><FormattedMessage id='text.status' /></Th>
              {FEATURE_FLAGS.ENABLE_APPROVER_ROLE && <Th><FormattedMessage id='text.approver' /></Th>}
              <Th><FormattedMessage id='text.role' /></Th>
            </Tr>
          </Thead>
          <Tbody>
            {users && users.length > 0 ? (
              users.map((user) => {
                if (!user.id) return null;
                const isRowSelected = selectedRowKeys.includes(String(user.id));
                const isSelectedUser = user.id === selectedUser?.id;
                const rowBackgroundStyle = getRowBackgroundStyle(isRowSelected, isSelectedUser);

                return (
                  <Tr key={user.id}
                    onClick={() => {
                      onUserRowClick(user.id);
                      onSelectUser(user);
                    }}
                    cursor={'pointer'}
                    sx={{
                      _hover: {
                        backgroundColor: 'gray.100',
                        _dark: {
                          backgroundColor: 'gray.700'
                        }
                      },
                      ...rowBackgroundStyle
                    }}>
                    <Td onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        isChecked={isRowSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          user.id && onUserCheckboxClick(user.id, e.target.checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Td>
                    <Td>{user.id}</Td>
                    <Td>{user.firstName}</Td>
                    <Td>{user.lastName}</Td>
                    <Td>{user.email}</Td>
                    <Td>
                      <Text
                        color={user.isActive ? 'green.500' : 'red.500'}
                        fontWeight="bold"
                        fontSize="sm"
                        mb={0}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </Td>
                    {FEATURE_FLAGS.ENABLE_APPROVER_ROLE && (
                      <Td>
                        {user.approver ? (
                          <Text
                            textDecoration={'underline'}
                            mb={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              onApproverClick();
                            }}
                            cursor="pointer">
                            {user.approver.email}
                          </Text>
                        ) : (
                          <Text mb={0}>-</Text>
                        )}
                      </Td>
                    )}
                    <Td>
                      <Text mb={0}>
                        {user.roles?.map(role => role.name).join(', ') ?? 'NONE'}
                      </Text>
                    </Td>
                  </Tr>
                );
              })
            ) : (
              <Tr>
                <Td colSpan={FEATURE_FLAGS.ENABLE_APPROVER_ROLE ? 9 : 8} textAlign="center">
                  <FormattedMessage id="text.noUsers" defaultMessage="No users are registered" />
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </TableContainer>
    </ConfigProvider>
  );
}

