import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Text,
  Input,
  Progress,
  List,
  ListItem
} from "@chakra-ui/react";
import { DamButton, useDamToast, request, stateActions } from "@common/index";
import { useState, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const BulkUploadModal = ({ isOpen, onClose, onUploadSuccess }: BulkUploadModalProps) => {
  const { showError, showSuccess } = useDamToast();
  const intl = useIntl();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadSampleCSV = () => {
    stateActions.addLoading();
    request('/api/admin/users/download-sample-csv', {
      method: 'GET',
      data: {},
    }, false).then(async (response: Response) => {
      stateActions.subLoading();
      
      // Get the text content from the response
      const csvContent = await response.text();
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'user_bulk_upload_sample.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showSuccess({
        title: intl.formatMessage({ id: 'text.download_complete' }),
        description: intl.formatMessage({ id: 'text.sample_csv_downloaded' })
      });
    }).catch((error: any) => {
      stateActions.subLoading();
      console.error('CSV download error:', error);
      showError({
        title: intl.formatMessage({ id: 'text.download_failed' }),
        description: error?.response?.data?.message ?? error.message ?? intl.formatMessage({ id: 'text.download_failed' })
      });
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        showError({
          title: intl.formatMessage({ id: 'text.invalid_file' }),
          description: intl.formatMessage({ id: 'text.file_must_be_csv' })
        });
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleBulkUpload = () => {
    if (!selectedFile) {
      showError({
        title: intl.formatMessage({ id: 'text.no_file_selected' }),
        description: intl.formatMessage({ id: 'text.please_select_file' })
      });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    request('/api/admin/users/bulk-upload', {
      method: 'POST',
      body: formData,
    }, false, 900000).then((result: any) => {
      setIsUploading(false);
      setUploadResult(result);
      
      if (result.success) {
        showSuccess({
          title: intl.formatMessage({ id: 'text.upload_success' }),
          description: `${result.successfulUsers} ${intl.formatMessage({ id: 'text.users_created' })}. ${intl.formatMessage({ id: 'text.email_invites_sent' })}`
        });
        onUploadSuccess(); // Refresh the user list in parent component
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        showError({
          title: intl.formatMessage({ id: 'text.upload_failed' }),
          description: result.message
        });
      }
    }).catch((error: any) => {
      setIsUploading(false);
      const errorResult = {
        success: false,
        message: error?.response?.data?.message ?? error.message ?? 'Unknown error occurred',
        errors: error?.response?.data?.errors ?? [error.message ?? 'Unknown error occurred']
      };
      
      setUploadResult(errorResult);
      showError({
        title: intl.formatMessage({ id: 'text.upload_failed' }),
        description: error?.response?.data?.message ?? error.message ?? 'Unknown error occurred'
      });
    });
  };

  const renderUploadResult = () => {
    if (!uploadResult) return null;

    if (uploadResult.success) {
      return (
        <Alert status="success" mt={4}>
          <AlertIcon />
          <Box>
            <AlertTitle>{intl.formatMessage({ id: 'text.upload_success' })}</AlertTitle>
            <AlertDescription>
              {uploadResult.successfulUsers} {intl.formatMessage({ id: 'text.users_created' })}.
              {uploadResult.users && (
                <VStack align="start" mt={2}>
                  <Text fontWeight="bold">Created users:</Text>
                  <List spacing={1} fontSize="sm">
                    {uploadResult.users.slice(0, 5).map((user: any) => (
                      <ListItem key={user.email}>• {user.firstName} {user.lastName} ({user.email})</ListItem>
                    ))}
                    {uploadResult.users.length > 5 && (
                      <ListItem key="more-users">... and {uploadResult.users.length - 5} more</ListItem>
                    )}
                  </List>
                </VStack>
              )}
            </AlertDescription>
          </Box>
        </Alert>
      );
    } else {
      return (
        <Alert status="error" mt={4}>
          <AlertIcon />
          <Box>
            <AlertTitle>{intl.formatMessage({ id: 'text.upload_failed' })}</AlertTitle>
            <AlertDescription>
              {uploadResult.message}
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <VStack align="start" mt={2}>
                  <Text fontWeight="bold">{intl.formatMessage({ id: 'text.validation_errors' })}:</Text>
                  <List spacing={1} fontSize="sm" maxH="200px" overflowY="auto">
                    {uploadResult.errors.map((error: string, index: number) => (
                      <ListItem key={`error-${index}-${error.slice(0, 20)}`} color="red.600">• {error}</ListItem>
                    ))}
                  </List>
                </VStack>
              )}
            </AlertDescription>
          </Box>
        </Alert>
      );
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <FormattedMessage id="text.bulk_user_upload" />
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Alert status="info">
              <AlertIcon />
              <Box>
                <AlertTitle>Instructions</AlertTitle>
                <AlertDescription>
                  <FormattedMessage id="text.upload_instructions" />
                </AlertDescription>
              </Box>
            </Alert>

            <Box>
              <Text mb={2} fontWeight="medium">
                <FormattedMessage id="text.sample_csv_instructions" />
              </Text>
              <DamButton 
                size="sm" 
                variant="outline" 
                onClick={handleDownloadSampleCSV}
                mb={4}
              >
                <FormattedMessage id="text.download_sample_csv" />
              </DamButton>
            </Box>

            <Box>
              <Text mb={2} fontWeight="medium">
                <FormattedMessage id="text.choose_csv_file" />
              </Text>
              <Box position="relative">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  position="absolute"
                  opacity={0}
                  width="100%"
                  height="100%"
                  cursor="pointer"
                  zIndex={1}
                />
                <DamButton
                  variant="outline"
                  colorScheme="blue"
                  width="100%"
                  height="40px"
                  leftIcon={<Text mb={0}>📁</Text>}
                  justifyContent="flex-start"
                  position="relative"
                  bg="gray.50"
                  _hover={{ bg: "gray.100" }}
                  _dark={{ bg: "gray.700", _hover: { bg: "gray.600" } }}
                >
                  {selectedFile ? selectedFile.name : <FormattedMessage id="text.choose_csv_file" />}
                </DamButton>
              </Box>
              {selectedFile && (
                <Text mt={2} fontSize="sm" color="green.600">
                  File size: {(selectedFile.size / 1024).toFixed(1)} KB
                </Text>
              )}
            </Box>

            {isUploading && (
              <Box>
                <Text mb={2}>
                  <FormattedMessage id="text.processing_upload" />
                </Text>
                <Progress isIndeterminate colorScheme="blue" />
              </Box>
            )}

            {renderUploadResult()}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={3}>
            <DamButton 
              variant="outline" 
              onClick={handleClose}
            >
              <FormattedMessage id="text.cancel" />
            </DamButton>
            <DamButton 
              colorScheme="blue" 
              onClick={handleBulkUpload}
              isDisabled={!selectedFile || isUploading}
              isLoading={isUploading}
            >
              <FormattedMessage id="text.upload_csv" />
            </DamButton>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 