import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { useRef } from "react";

interface DamAlertDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly title: string;
  readonly message: string;
  readonly confirmButtonId?: string;
}

export function DamAlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonId
}: DamAlertDialogProps) {
  const cancelRef = useRef(null);

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            <FormattedMessage id={title} />
          </AlertDialogHeader>
          <AlertDialogBody>
            <FormattedMessage id={message} />
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              <FormattedMessage id='text.cancel' />
            </Button>
            <Button
              id={confirmButtonId}
              colorScheme="red"
              onClick={onConfirm}
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