import {
  Checkbox,
  Flex,
  IconButton,
  Input,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr
} from "@chakra-ui/react";
import { CloseIcon, SearchIcon } from "@chakra-ui/icons";
import { FormattedMessage } from "react-intl";
import { User } from "@models/User";
import { Asset } from "@models/Asset";
import { DamCard, DamCardBody, DamCardDivider, TextCardHeader } from "@common/index";
import { useState } from "react";

interface FilteredUsersProps {
  readonly users: User[];
  readonly selectedAsset: Asset | null;
  readonly isFormShow: boolean;

  readonly checkAvailability: (user: User) => boolean | undefined;
  readonly updateAvailability: (user: User, checked: boolean, key: string) => void;
  readonly titleMessageId: string;
  readonly noDataMessageId: string;
  readonly filterKey?: string;
}

export function FilteredUsers({
  users,
  selectedAsset,
  isFormShow,
  checkAvailability,
  updateAvailability,
  filterKey,
  titleMessageId,
  noDataMessageId
}: FilteredUsersProps) {
  const [isSearchShow, setIsSearchShow] = useState(false);
  const [userSearchCriteria, setUserSearchCriteria] = useState('');

  const checkUserCriteria = (user: User) => {
    if (!userSearchCriteria) return true;
    return user.firstName.toLowerCase().indexOf(userSearchCriteria.toLowerCase()) !== -1 ||
      user.lastName.toLowerCase().indexOf(userSearchCriteria.toLowerCase()) !== -1 ||
      user.email.toLowerCase().indexOf(userSearchCriteria.toLowerCase()) !== -1;
  };

  return (
    <DamCard mt={4} flex={1}>
      <DamCardBody>
        <Flex justifyContent={'space-between'} alignItems={'center'} w='full'>
          {!isSearchShow && <TextCardHeader mb={0}>
            <FormattedMessage id={titleMessageId} />
          </TextCardHeader>}
          {isSearchShow && <Input
            m={1}
            flex={1}
            onChange={(e) => setUserSearchCriteria(e.target.value)}
            placeholder="Search User..."
          />}
          <IconButton
            aria-label="Search"
            icon={isSearchShow ? <CloseIcon /> : <SearchIcon />}
            onClick={() => {
              setUserSearchCriteria('');
              setIsSearchShow(!isSearchShow);
            }}
            size="sm"
            mr={2}
          />
        </Flex>

        <DamCardDivider />

        <TableContainer width='100%'>
          <Table variant='simple' id="tblAssetOwners">
            <Thead>
              <Tr>
                <Th><FormattedMessage id='text.status' /></Th>
                <Th><FormattedMessage id='text.first_name' /></Th>
                <Th><FormattedMessage id='text.last_name' /></Th>
                <Th><FormattedMessage id='text.email' /></Th>
              </Tr>
            </Thead>
            <Tbody maxHeight={500}>
              {users.length > 0 ? (
                <>
                  {users.map((user: User) => (
                    checkUserCriteria(user) && <Tr key={user.id}>
                      <Td>
                        <Flex gap={2}>
                          <Checkbox
                            disabled={selectedAsset == null || !isFormShow}
                            isChecked={checkAvailability(user)}
                            onChange={(e) => { updateAvailability(user, e.target.checked, filterKey ?? '') }}
                          />
                        </Flex>
                      </Td>
                      <Td>{user.firstName}</Td>
                      <Td>{user.lastName}</Td>
                      <Td>{user.email}</Td>
                    </Tr>
                  ))}
                </>
              ) : (
                <Tr>
                  <Td colSpan={6} textAlign={'center'}>
                    <FormattedMessage id={noDataMessageId} />
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </DamCardBody>
    </DamCard>
  );
} 