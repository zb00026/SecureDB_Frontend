import React, { useState, useRef, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Flex,
  Input,
  Text,
  FormControl,
  FormLabel,
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
  readonly assetName?: string;
  readonly usernamePlaceholder?: string;
  readonly passwordPlaceholder?: string;
  readonly confirmPasswordPlaceholder?: string;
}

export function SetCredentialDialog({ 
  isOpen, 
  titleId, 
  onClose, 
  onSubmit, 
  showPasswordRequirements = false, 
  showPasswordWarning = false, 
  isTemporaryPassword = false, 
  saveButtonTextId, 
  showConfirmPassword = false, 
  assetName,
  usernamePlaceholder = "Enter Username",
  passwordPlaceholder = "Enter Password",
  confirmPasswordPlaceholder = "Re-enter Password"
}: SetCredentialDialogProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isPasswordWeak, setIsPasswordWeak] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const [isReadonly, setIsReadonly] = useState(true);
  const cancelRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setIsReadonly(true);

      // Remove readonly after a brief delay to trick browsers
      const timer = setTimeout(() => {
        setIsReadonly(false);
      }, 100);

      return () => clearTimeout(timer);
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
            {assetName && (
              <Text fontSize="md" fontWeight="normal" color="gray.600" mt={1}>
                <FormattedMessage id="text.asset_name_title"/> {assetName}
              </Text>
            )}
          </AlertDialogHeader>
          <AlertDialogBody id='credentialDialogBody'>
            <div data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-browser-ignore="true">
              {!isTemporaryPassword && (
                <FormControl mb={3}>
                  <FormLabel mb={1}>
                    <FormattedMessage id="text.username" defaultMessage="Username" />
                  </FormLabel>
                  <Input
                    id="userField"
                    name="user_field"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={(e) => {
                      if (isReadonly) {
                        e.target.removeAttribute('readonly');
                        setIsReadonly(false);
                      }
                    }}
                    autoComplete="off"
                    readOnly={isReadonly}
                    data-form-type="other"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-save="false"
                    data-browser-ignore="true"
                    data-no-autofill="true"
                  />
                </FormControl>
              )}
              <FormControl mb={showConfirmPassword ? 3 : 0}>
                <FormLabel mb={1}>
                  <FormattedMessage id="text.password" />
                </FormLabel>
                <DamPasswordInput
                  placeholder=""
                  id="keyField"
                  name="key_field"
                  value={password}
                  onChange={setPassword}
                  showRequirements={showPasswordRequirements}
                  onValidationChange={(isValid) => setIsPasswordValid(isValid)}
                  autoComplete="off"
                  readOnly={isReadonly}
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-save="false"
                  data-browser-ignore="true"
                  data-no-autofill="true"
                />
              </FormControl>
              {showConfirmPassword && (
                <FormControl pt={2}>
                  <FormLabel mb={1}>
                    <FormattedMessage id="text.confirm_password" defaultMessage="Confirm Password" />
                  </FormLabel>
                  <DamPasswordInput
                    placeholder=""
                    id="confirmKeyField"
                    name="confirm_key_field"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    showRequirements={false}
                    onValidationChange={() => { }} // Not needed for confirm password
                    autoComplete="off"
                    readOnly={isReadonly}
                    data-form-type="other"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-save="false"
                    data-browser-ignore="true"
                    data-no-autofill="true"
                  />
                </FormControl>
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
            </div>
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