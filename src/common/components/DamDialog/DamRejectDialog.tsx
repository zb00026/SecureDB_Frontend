import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  FormControl,
  FormLabel,
  Textarea,
} from "@chakra-ui/react";
import { useRef, useState, useEffect } from "react";
import { FormattedMessage, useIntl } from "react-intl";

interface DamRejectDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (reason: string) => void;
  readonly title: string;
  readonly message: string;
  readonly confirmButtonId?: string;
  readonly isLoading?: boolean;
  readonly reasonPlaceholder?: string;
}

export function DamRejectDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonId,
  isLoading = false,
  reasonPlaceholder = "text.enter_reject_reason"
}: DamRejectDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [rejectReason, setRejectReason] = useState("");
  const intl = useIntl();

  // Reset reason when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setRejectReason("");
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (rejectReason.trim()) {
      onConfirm(rejectReason.trim());
    }
  };

  const handleClose = () => {
    setRejectReason("");
    onClose();
  };

  return (
    <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={handleClose}>
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            <FormattedMessage id={title} />
          </AlertDialogHeader>
          <AlertDialogBody>
            <FormattedMessage id={message} />
            <FormControl mt={4}>
              <FormLabel>
                <FormattedMessage id="text.reject_reason" />
              </FormLabel>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={intl.formatMessage({ id: reasonPlaceholder })}
                rows={4}
                resize="vertical"
              />
            </FormControl>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={handleClose}>
              <FormattedMessage id="text.cancel" />
            </Button>
            <Button
              id={confirmButtonId}
              colorScheme="red"
              onClick={handleConfirm}
              ml={3}
              isLoading={isLoading}
              isDisabled={!rejectReason.trim()}
            >
              <FormattedMessage id="text.reject" />
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
} 