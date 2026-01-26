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
  Textarea,
  VStack,
  FormControl,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
} from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { useAwsSecretsManager } from '@common/index';

interface SetSSHCredentialDialogProps {
  readonly isOpen: boolean;
  readonly titleId?: string;
  readonly onClose: () => void;
  readonly onSubmit: (username: string, sshPrivateKey: string, awsSecretsManagerKey?: string) => void;
  readonly saveButtonTextId?: string;
  readonly showSSHKeyWarning?: boolean;
}

export function SetSSHCredentialDialog({ 
  isOpen, 
  titleId, 
  onClose, 
  onSubmit, 
  showSSHKeyWarning = true, 
  saveButtonTextId 
}: SetSSHCredentialDialogProps) {
  const [username, setUsername] = useState('');
  const [sshPrivateKey, setSshPrivateKey] = useState('');
  const [awsSecretsManagerKey, setAwsSecretsManagerKey] = useState('');
  const [isSSHKeyValid, setIsSSHKeyValid] = useState(false);
  const [sshKeyError, setSshKeyError] = useState('');
  const cancelRef = useRef(null);
  const { isEnabled: isAwsSecretsManagerEnabled } = useAwsSecretsManager();
  const intl = useIntl();

  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setSshPrivateKey('');
      setAwsSecretsManagerKey('');
      setSshKeyError('');
      setIsSSHKeyValid(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (sshPrivateKey.length > 0) {
      validateSSHKey(sshPrivateKey);
    } else {
      setIsSSHKeyValid(false);
      setSshKeyError('');
    }
  }, [sshPrivateKey]);

  const validateSSHKey = (key: string) => {
    // Basic SSH key validation
    const trimmedKey = key.trim();
    
    if (trimmedKey.length === 0) {
      setIsSSHKeyValid(false);
      setSshKeyError('');
      return;
    }

    // Check for common SSH key headers
    const validHeaders = [
      '-----BEGIN OPENSSH PRIVATE KEY-----',
      '-----BEGIN RSA PRIVATE KEY-----',
      '-----BEGIN DSA PRIVATE KEY-----',
      '-----BEGIN EC PRIVATE KEY-----',
      '-----BEGIN ED25519 PRIVATE KEY-----',
      '-----BEGIN PRIVATE KEY-----'
    ];

    const hasValidHeader = validHeaders.some(header => trimmedKey.startsWith(header));
    
    if (!hasValidHeader) {
      setIsSSHKeyValid(false);
      setSshKeyError('Invalid SSH private key format. Key should start with a valid header.');
      return;
    }

    // Check for footer
    const validFooters = [
      '-----END OPENSSH PRIVATE KEY-----',
      '-----END RSA PRIVATE KEY-----',
      '-----END DSA PRIVATE KEY-----',
      '-----END EC PRIVATE KEY-----',
      '-----END ED25519 PRIVATE KEY-----',
      '-----END PRIVATE KEY-----'
    ];

    const hasValidFooter = validFooters.some(footer => trimmedKey.endsWith(footer));
    
    if (!hasValidFooter) {
      setIsSSHKeyValid(false);
      setSshKeyError('Invalid SSH private key format. Key should end with a valid footer.');
      return;
    }

    // Basic length check (SSH keys are typically much longer)
    if (trimmedKey.length < 100) {
      setIsSSHKeyValid(false);
      setSshKeyError('SSH private key appears to be too short.');
      return;
    }

    setIsSSHKeyValid(true);
    setSshKeyError('');
  };

  const handleSubmit = () => {
    if (isAwsSecretsManagerEnabled) {
      if (awsSecretsManagerKey.trim()) {
        onSubmit(username.trim(), '', awsSecretsManagerKey.trim());
        onClose();
      }
    } else {
      if (isSSHKeyValid && username.trim()) {
        onSubmit(username.trim(), sshPrivateKey.trim());
        onClose();
      }
    }
  };

  const isFormValid = isAwsSecretsManagerEnabled
    ? awsSecretsManagerKey.trim().length > 0
    : isSSHKeyValid && username.trim().length > 0;

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      size="xl"
    >
      <AlertDialogOverlay>
        <AlertDialogContent maxW="600px">
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            <FormattedMessage id={titleId ?? "text.set_ssh_credential"} />
          </AlertDialogHeader>
          <AlertDialogBody id='sshCredentialDialogBody'>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired={!isAwsSecretsManagerEnabled}>
                <FormLabel>
                  <FormattedMessage id="text.username" />
                  {isAwsSecretsManagerEnabled && (
                    <Text as="span" fontSize="xs" color="gray.500" fontWeight="normal" ml={1}>
                      (Optional)
                    </Text>
                  )}
                </FormLabel>
                <Input
                  id="inputSSHCredentialUsername"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <FormHelperText>
                  {isAwsSecretsManagerEnabled ? (
                    <FormattedMessage id="text.aws_secrets_manager_ssh_username_help" />
                  ) : (
                    <FormattedMessage id="text.ssh_username_help" />
                  )}
                </FormHelperText>
              </FormControl>

              {isAwsSecretsManagerEnabled ? (
                <FormControl isRequired isInvalid={!awsSecretsManagerKey.trim()}>
                  <FormLabel>
                    <FormattedMessage id="text.aws_secrets_manager_key" />
                  </FormLabel>
                  <Input
                    id="inputSSHCredentialAwsSecretsManagerKey"
                    value={awsSecretsManagerKey}
                    onChange={(e) => setAwsSecretsManagerKey(e.target.value)}
                    placeholder={intl.formatMessage({ id: 'text.aws_secrets_manager_key_placeholder' })}
                  />
                  <FormHelperText>
                    <FormattedMessage id="text.aws_secrets_manager_ssh_key_help" />
                  </FormHelperText>
                </FormControl>
              ) : (
                <FormControl isRequired isInvalid={!!sshKeyError}>
                  <FormLabel>
                    <FormattedMessage id="text.ssh_private_key" />
                  </FormLabel>
                  <Textarea
                    id="inputSSHCredentialPrivateKey"
                    value={sshPrivateKey}
                    onChange={(e) => setSshPrivateKey(e.target.value)}
                    rows={8}
                    fontFamily="mono"
                    fontSize="sm"
                    resize="vertical"
                  />
                  {sshKeyError ? (
                    <FormErrorMessage>{sshKeyError}</FormErrorMessage>
                  ) : (
                    <FormHelperText>
                      <FormattedMessage id="text.ssh_private_key_help" />
                    </FormHelperText>
                  )}
                </FormControl>
              )}

              {showSSHKeyWarning && !isAwsSecretsManagerEnabled && (
                <Text fontSize="sm" color="orange.500" bg="orange.50" p={3} borderRadius="md">
                  <FormattedMessage id="text.ssh_key_security_warning" />
                </Text>
              )}
            </VStack>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button onClick={onClose} id="btnCancelSSHCredential">
              <FormattedMessage id='text.cancel' />
            </Button>
            <Button 
              id="btnSaveSSHCredential"
              colorScheme="blue"
              onClick={handleSubmit}
              disabled={!isFormValid}
              ml={3}
            >
              <FormattedMessage id={saveButtonTextId ?? 'text.save'} />
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}