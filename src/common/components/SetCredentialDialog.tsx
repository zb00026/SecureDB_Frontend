import React, { useState, useRef, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Input,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

interface SetCredentialDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (username: string, password: string) => void;
}

export function SetCredentialDialog({ isOpen, onClose, onSubmit }: SetCredentialDialogProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const cancelRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    onSubmit(username, password);
    onClose();
  };

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            <FormattedMessage id="text.set_credential" />
          </AlertDialogHeader>
          <AlertDialogBody>
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              mb={3}
            />
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button onClick={onClose}>
              <FormattedMessage id='text.cancel' />
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit} ml={3}>
              <FormattedMessage id='text.save' />
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
} 