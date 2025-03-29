import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Flex,
  IconButton,
  Input,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useColorModeValue
} from "@chakra-ui/react";
import { CloseIcon, SearchIcon } from "@chakra-ui/icons";
import { FormattedMessage } from "react-intl";
import { User } from "@models/User";
import { DamCardDivider, TextCardHeader } from "@common/index";
import { useEffect, useRef, useState } from "react";

interface UserApproversDlgProps {
  readonly approvers: User[];
  readonly isOpen: boolean;
  readonly selectedUser: User | null;
  readonly onSaveApprover: (user: User | null) => void;
  readonly confirmButtonId: string;
}

export function UserApproversDlg({
  approvers,
  selectedUser,
  isOpen,
  onSaveApprover,
  confirmButtonId
}: UserApproversDlgProps) {
  const [isSearchShow, setIsSearchShow] = useState(false);
  const [userSearchCriteria, setUserSearchCriteria] = useState('');
  const [selectedApprover, setSelectedApprover] = useState<User | null>(null);
  const cancelRef = useRef(null);
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const tableBg = useColorModeValue('white', 'gray.800');

  const checkUserCriteria = (user: User) => {
    if (selectedUser?.id == user.id) return false;
    if (!userSearchCriteria) return true;
    
    return user.firstName.toLowerCase().indexOf(userSearchCriteria.toLowerCase()) !== -1 ||
      user.lastName.toLowerCase().indexOf(userSearchCriteria.toLowerCase()) !== -1 ||
      user.email.toLowerCase().indexOf(userSearchCriteria.toLowerCase()) !== -1;
  };

  useEffect(() => {
    if (isOpen) {
      setUserSearchCriteria('');
      setIsSearchShow(false);
      setSelectedApprover(null);
    }
    if (selectedUser?.approver) {
      setSelectedApprover(selectedUser.approver);
    }
  }, [isOpen, selectedUser]);


  return (
    <AlertDialog
      isOpen={isOpen}
      size={'2xl'}
      leastDestructiveRef={cancelRef}
      onClose={() => onSaveApprover(null)}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold" textAlign={'center'}>
            <FormattedMessage id='text.set_user_approver' />
          </AlertDialogHeader>
          <AlertDialogBody>
            <Flex justifyContent={'space-between'} alignItems={'center'} w='full'>
              {!isSearchShow && <TextCardHeader mb={0} p={3}>
                <FormattedMessage id='text.user_approvers' />
              </TextCardHeader>}
              {isSearchShow && <Input
                m={1}
                flex={1}
                onChange={(e) => setUserSearchCriteria(e.target.value)}
                placeholder="Search Approver..."
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

            <TableContainer width='100%' maxH={500}>
              <Table variant='simple'
                sx={{
                  'th, td': {
                    borderColor: borderColor,
                  },
                  'th': {
                    backgroundColor: tableBg,
                  }
                }}>
                <Thead>
                  <Tr>
                    <Th><FormattedMessage id='text.first_name' /></Th>
                    <Th><FormattedMessage id='text.last_name' /></Th>
                    <Th><FormattedMessage id='text.email' /></Th>
                  </Tr>
                </Thead>
                <Tbody maxHeight={500}>
                  {approvers.length > 0 ? (
                    <>
                      {approvers.map((approver: User) => (
                        checkUserCriteria(approver) &&
                        <Tr key={approver.id}
                          cursor={'pointer'}
                          backgroundColor={approver.id === selectedApprover?.id ? 'gray.80' : 'transparent'}
                          onClick={() => setSelectedApprover(approver)}>
                          <Td>{approver.firstName}</Td>
                          <Td>{approver.lastName}</Td>
                          <Td>{approver.email}</Td>
                        </Tr>
                      ))}
                    </>
                  ) : (
                    <Tr>
                      <Td colSpan={6} textAlign={'center'}>
                        <FormattedMessage id='text.no_approvers' />
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={() => onSaveApprover(null)}>
              <FormattedMessage id='text.cancel' />
            </Button>
            <Button
              id={confirmButtonId}
              colorScheme="red"
              disabled={selectedApprover == null || selectedApprover.id === selectedUser?.approver?.id}
              onClick={() => onSaveApprover(selectedApprover)}
              ml={3}
            >
              <FormattedMessage id='text.ok' />
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
} 