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
  Text,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { DamPasswordInput } from '../DamPasswordInput';

interface SetCredentialDialogProps {
  readonly isOpen: boolean;
  readonly titleId?: string;
  readonly onClose: () => void;
  readonly onSubmit: (username: string, password: string) => void;
  readonly isTemporaryPassword?: boolean;
  readonly saveButtonTextId?: string;
  readonly showPasswordRequirements?: boolean;
  readonly showPasswordWarning?: boolean;
  readonly showConfirmPassword?: boolean;
}

export function SetCredentialDialog({ isOpen, titleId, onClose, onSubmit, showPasswordRequirements = false, showPasswordWarning = false, isTemporaryPassword = false, saveButtonTextId, showConfirmPassword = false }: SetCredentialDialogProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isPasswordWeak, setIsPasswordWeak] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const cancelRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!showPasswordRequirements && password.length > 1) {
      setIsPasswordValid(true);
    }
  }, [password, showPasswordRequirements]);

  useEffect(() => {
    if (showPasswordWarning && password.length > 0) {
      // Check if password meets basic security requirements
      const hasMinLength = password.length >= 8;
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasDigit = /\d/.test(password);
      
      setIsPasswordWeak(!(hasMinLength && hasUppercase && hasLowercase && hasDigit));
    }
  }, [password, showPasswordWarning]);

  useEffect(() => {
    if (showConfirmPassword) {
      setPasswordsMatch(password === confirmPassword && password.length > 0);
    }
  }, [password, confirmPassword, showConfirmPassword]);

  const handleSubmit = () => {
    onSubmit(username, password);
    onClose();
  };

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      closeOnOverlayClick={false}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            <FormattedMessage id={titleId ?? "text.set_credential"} />
          </AlertDialogHeader>
          <AlertDialogBody id='credentialDialogBody'>
            {!isTemporaryPassword && (
              <Input
                placeholder="Username"
                id="inputCredentialUsername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                mb={3}
              />)}
            <DamPasswordInput
              placeholder={showConfirmPassword ? "New Password" : "Password"}
              id="inputCredentialPassword"
              value={password}
              onChange={setPassword}
              showRequirements={showPasswordRequirements}
              onValidationChange={(isValid) => setIsPasswordValid(isValid)}
            />
            {showConfirmPassword && (
              <DamPasswordInput
                placeholder="Confirm Password"
                id="inputCredentialConfirmPassword"
                value={confirmPassword}
                onChange={setConfirmPassword}
                showRequirements={false}
                onValidationChange={() => {}} // Not needed for confirm password
                mt={3}
              />
            )}
            {showPasswordWarning && isPasswordWeak && password.length > 0 && (
              <Text fontSize="sm" color="orange.500" mt={2} mb={0}>
                <FormattedMessage id="text.weak_password_warning" />
              </Text>
            )}
            {showConfirmPassword && confirmPassword.length > 0 && !passwordsMatch && (
              <Text fontSize="sm" color="red.500" mt={2} mb={0}>
                <FormattedMessage id="text.passwords_do_not_match" />
              </Text>
            )}
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button onClick={onClose} id="btnCancelCredential">
              <FormattedMessage id='text.cancel' />
            </Button>
            <Button id="btnSaveCredential"
              colorScheme="blue"
              onClick={handleSubmit}
              disabled={
                (showPasswordRequirements && !isPasswordValid) ||
                (showConfirmPassword && !passwordsMatch)
              }
              ml={3}>
              <FormattedMessage id={saveButtonTextId ?? 'text.save'} />
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
} 