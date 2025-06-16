import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stat,
  StatLabel,
  StatNumber,
  Badge,
  Spinner,
  FormControl,
  FormLabel,
  Textarea,
  IconButton,
  Tooltip,

  Progress,
  useColorModeValue
} from '@chakra-ui/react';
import { FiUpload, FiTrash2, FiRefreshCw, FiCopy, FiInfo } from 'react-icons/fi';
import { DamBasePage } from '@common/components/DamBasePage';
import { request } from '@common/libs/request';
import { useApiRequest } from '@common/hooks/useApiRequest';
import { useLicenseStatus } from '@common/hooks/useLicenseStatus';
import { useDamToast } from '@common/index';

export const isSearchable = true;
export const displayName = 'License Management';

interface LicenseInfo {
  readonly id: number;
  readonly filename: string;
  readonly fileSize: number;
  readonly uploadedBy: string;
  readonly uploadedAt: string;
  readonly description: string;
}

interface LicenseData {
  readonly hasLicense: boolean;
  readonly usingDatabaseLicense: boolean;
  readonly license?: LicenseInfo;
  readonly message?: string;
}

interface LicenseFeatures {
  readonly isValid: boolean;
  readonly usingDatabaseLicense: boolean;
  readonly expiryDate: string;
  readonly features: Record<string, string>;
  readonly systemIdentifierMismatch?: boolean;
  readonly licenseSystemIdentifier?: string;
  readonly currentSystemIdentifier?: string;
  readonly errorMessage?: string;
}

interface SystemInfo {
  readonly systemIdentifier: string;
  readonly systemInfo: Record<string, string>;
}

interface UploadProgress {
  readonly loaded: number;
  readonly total: number;
  readonly percentage: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.bin', '.license'];
const REFRESH_DEBOUNCE_MS = 1000;

export function Component() {
  const [licenseData, setLicenseData] = useState<LicenseData | null>(null);
  const [licenseFeatures, setLicenseFeatures] = useState<LicenseFeatures | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { showSuccess, showError } = useDamToast();
  const { handleRequest } = useApiRequest();
  const { refetch: refreshLicenseStatus } = useLicenseStatus();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const isValidFile = useMemo(() => {
    if (!selectedFile) return false;
    
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => 
      selectedFile.name.toLowerCase().endsWith(ext.toLowerCase())
    );
    const isValidSize = selectedFile.size <= MAX_FILE_SIZE && selectedFile.size > 0;
    
    return hasValidExtension && isValidSize;
  }, [selectedFile]);

  const uploadButtonDisabled = useMemo(() => {
    return !selectedFile || !isValidFile || isUploading;
  }, [selectedFile, isValidFile, isUploading]);

  const debouncedRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      fetchLicenseInfo();
      setLastRefresh(new Date());
    }, REFRESH_DEBOUNCE_MS);
  }, []);

  const fetchLicenseInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      const [licenseResponse, featuresResponse, systemInfoResponse] = await Promise.all([
        request('/api/admin/license/current', { method: 'GET' }),
        request('/api/admin/license/features', { method: 'GET' }),
        request('/api/admin/license/system-info', { method: 'GET' })
      ]);
      
      setLicenseData(licenseResponse);
      setLicenseFeatures(featuresResponse);
      setSystemInfo(systemInfoResponse);
    } catch (error: any) {
      console.error('Failed to fetch license info:', error);
      showError({
        description: error.message ?? 'Failed to fetch license information'
      });
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchLicenseInfo();
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [fetchLicenseInfo]);

  const validateFile = useCallback((file: File): string | null => {
    if (!file) return 'No file selected';
    
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => 
      file.name.toLowerCase().endsWith(ext.toLowerCase())
    );
    if (!hasValidExtension) {
      return `Invalid file type. Please select a file with one of these extensions: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }
    
    if (file.size === 0) {
      return 'File cannot be empty';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size cannot exceed ${formatFileSize(MAX_FILE_SIZE)}`;
    }
    
    return null;
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }
    
    const validationError = validateFile(file);
    if (validationError) {
      showError({
        description: validationError
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    setSelectedFile(file);
  }, [validateFile, showError]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !isValidFile) {
      showError({
        description: 'Please select a valid license file to upload'
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress({ loaded: 0, total: selectedFile.size, percentage: 0 });
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (description.trim()) {
        formData.append('description', description.trim());
      }

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (!prev) return null;
          const newPercentage = Math.min(prev.percentage + 10, 90);
          return {
            ...prev,
            percentage: newPercentage,
            loaded: (prev.total * newPercentage) / 100
          };
        });
      }, 200);

      const result = await request('/api/admin/license/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress({ loaded: selectedFile.size, total: selectedFile.size, percentage: 100 });

      if (result.success) {
        showSuccess({
          description: 'License uploaded successfully'
        });
        
        setSelectedFile(null);
        setDescription('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        await Promise.all([
          fetchLicenseInfo(),
          refreshLicenseStatus()
        ]);
      } else {
        throw new Error(result.message ?? 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      showError({
        description: error.message ?? 'Failed to upload license file'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  }, [selectedFile, isValidFile, description, showError, showSuccess, fetchLicenseInfo, refreshLicenseStatus]);

  const handleDelete = useCallback(async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete the current license? The system will fall back to the default license.'
    );
    
    if (!confirmed) return;

    handleRequest('/api/admin/license/current', 'DELETE', null, {
      onSuccess: () => {
        void Promise.all([
          fetchLicenseInfo(),
          refreshLicenseStatus()
        ]);
      },
      successTitleId: 'License Deleted',
      successDescriptionId: 'License deleted successfully. System will use default license.',
      errorDescriptionId: 'Failed to delete license'
    });
  }, [handleRequest, fetchLicenseInfo, refreshLicenseStatus]);

  const handleCopySystemId = useCallback(async () => {
    if (!systemInfo?.systemIdentifier) return;
    
    try {
      await navigator.clipboard.writeText(systemInfo.systemIdentifier);
      showSuccess({
        description: 'System identifier copied to clipboard'
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      showError({
        description: 'Unable to copy to clipboard. Please copy manually.'
      });
    }
  }, [systemInfo?.systemIdentifier, showSuccess, showError]);

  const handleRefreshSystemId = useCallback(async () => {
    try {
      const result = await request('/api/admin/license/system-info/refresh', {
        method: 'POST'
      });

      if (result.success) {
        showSuccess({
          description: result.changed 
            ? `System identifier updated: ${result.newIdentifier}`
            : 'System identifier unchanged'
        });
        
        // Refresh the system info
        await fetchLicenseInfo();
      } else {
        throw new Error(result.message ?? 'Refresh failed');
      }
    } catch (error: any) {
      console.error('System identifier refresh error:', error);
      showError({
        description: error.message ?? 'Failed to refresh system identifier'
      });
    }
  }, [showSuccess, showError, fetchLicenseInfo]);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleString();
  }, []);

  const getFileValidationMessage = useCallback((): string | null => {
    if (!selectedFile) return null;
    return validateFile(selectedFile);
  }, [selectedFile, validateFile]);

  if (isLoading) {
    return (
      <DamBasePage title="License Management">
        <Box display="flex" justifyContent="center" alignItems="center" minH="200px">
          <VStack spacing={4}>
            <Spinner size="xl" />
            <Text>Loading license information...</Text>
          </VStack>
        </Box>
      </DamBasePage>
    );
  }

  return (
    <DamBasePage title="License Management">
      <VStack spacing={6} align="stretch">
        <Card bg={cardBg} borderColor={borderColor}>
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md">Current License Status</Heading>
              <HStack>
                {lastRefresh && (
                  <Text fontSize="xs" color="gray.500">
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </Text>
                )}
                <Tooltip label="Refresh license information">
                  <IconButton
                    aria-label="Refresh"
                    icon={<FiRefreshCw />}
                    size="sm"
                    variant="ghost"
                    onClick={debouncedRefresh}
                    isLoading={isLoading}
                  />
                </Tooltip>
              </HStack>
            </HStack>
          </CardHeader>
          <CardBody>
            {licenseData?.hasLicense ? (
              <VStack align="stretch" spacing={4}>
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Database License Active</AlertTitle>
                    <AlertDescription>
                      System is using a license uploaded to the database.
                    </AlertDescription>
                  </Box>
                </Alert>
                
                {licenseData.license && (
                  <Box p={4} bg="gray.50" borderRadius="md" _dark={{ bg: 'gray.700' }}>
                    <VStack align="stretch" spacing={3}>
                      <HStack justify="space-between">
                        <Stat>
                          <StatLabel>Filename</StatLabel>
                          <StatNumber fontSize="lg">{licenseData.license.filename}</StatNumber>
                        </Stat>
                        <Stat>
                          <StatLabel>File Size</StatLabel>
                          <StatNumber fontSize="lg">{formatFileSize(licenseData.license.fileSize)}</StatNumber>
                        </Stat>
                      </HStack>
                      
                      <HStack justify="space-between">
                        <Stat>
                          <StatLabel>Uploaded By</StatLabel>
                          <StatNumber fontSize="lg">{licenseData.license.uploadedBy}</StatNumber>
                        </Stat>
                        <Stat>
                          <StatLabel>Upload Date</StatLabel>
                          <StatNumber fontSize="lg">{formatDate(licenseData.license.uploadedAt)}</StatNumber>
                        </Stat>
                      </HStack>
                      
                      {licenseData.license.description && (
                        <Box>
                          <Text fontWeight="medium" mb={2}>Description:</Text>
                          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                            {licenseData.license.description}
                          </Text>
                        </Box>
                      )}
                      
                      <HStack justify="flex-end" pt={2}>
                        <Button
                          leftIcon={<FiTrash2 />}
                          colorScheme="red"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete()}
                        >
                          Delete License
                        </Button>
                      </HStack>
                    </VStack>
                  </Box>
                )}
              </VStack>
            ) : (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Using Default License</AlertTitle>
                  <AlertDescription>
                    No custom license found in database. System is using the default license from resources.
                  </AlertDescription>
                </Box>
              </Alert>
            )}
          </CardBody>
        </Card>

        {licenseFeatures && (
          <Card bg={cardBg} borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">License Features & Details</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                {licenseFeatures.systemIdentifierMismatch && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>License System Mismatch</AlertTitle>
                      <AlertDescription>
                        <VStack align="start" spacing={2}>
                          <Text>{licenseFeatures.errorMessage}</Text>
                          <Box>
                            <Text fontSize="sm" fontWeight="medium">License System ID:</Text>
                            <Text fontSize="sm" fontFamily="mono" color="red.600" _dark={{ color: 'red.400' }}>
                              {licenseFeatures.licenseSystemIdentifier}
                            </Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" fontWeight="medium">Current System ID:</Text>
                            <Text fontSize="sm" fontFamily="mono" color="blue.600" _dark={{ color: 'blue.400' }}>
                              {licenseFeatures.currentSystemIdentifier}
                            </Text>
                          </Box>
                        </VStack>
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}
                
                <HStack justify="space-between">
                  <Stat>
                    <StatLabel>License Status</StatLabel>
                    <StatNumber fontSize="lg">
                      <Badge colorScheme={licenseFeatures.isValid ? 'green' : 'red'}>
                        {licenseFeatures.isValid ? 'Valid' : 'Invalid'}
                      </Badge>
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>License Source</StatLabel>
                    <StatNumber fontSize="lg">
                      <Badge colorScheme={licenseFeatures.usingDatabaseLicense ? 'blue' : 'gray'}>
                        {licenseFeatures.usingDatabaseLicense ? 'Database' : 'Resources'}
                      </Badge>
                    </StatNumber>
                  </Stat>
                </HStack>
                
                {licenseFeatures.expiryDate && (
                  <Stat>
                    <StatLabel>License Expiry</StatLabel>
                    <StatNumber fontSize="lg">{formatDate(licenseFeatures.expiryDate)}</StatNumber>
                  </Stat>
                )}
                
                {Object.keys(licenseFeatures.features).length > 0 && (
                  <Box>
                    <Text fontWeight="medium" mb={3}>License Features:</Text>
                    <Box p={4} bg="gray.50" borderRadius="md" _dark={{ bg: 'gray.700' }}>
                      <VStack align="stretch" spacing={2}>
                        {Object.entries(licenseFeatures.features)
                          .filter(([key]) => key !== 'signatureDigest' && key !== 'licenseSignature')
                          .map(([key, value]) => (
                          <HStack key={key} justify="space-between">
                            <Text fontWeight="medium" textTransform="capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </Text>
                            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                              {value}
                            </Text>
                          </HStack>
                        ))}
                      </VStack>
                    </Box>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}

        {systemInfo && (
          <Card bg={cardBg} borderColor={borderColor}>
            <CardHeader>
              <HStack>
                <FiInfo />
                <Heading size="md">System Information</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <Box p={4} bg="blue.50" borderRadius="md" _dark={{ bg: 'blue.900' }}>
                  <HStack justify="space-between" align="center">
                    <Text fontWeight="bold" fontSize="lg" color="blue.700" _dark={{ color: 'blue.300' }}>
                      System Identifier:
                    </Text>
                    <HStack>
                      <Text 
                        fontFamily="mono" 
                        fontSize="lg" 
                        fontWeight="bold" 
                        color="blue.800" 
                        bg="white" 
                        px={3} 
                        py={1} 
                        borderRadius="md"
                        border="1px solid"
                        borderColor="blue.200"
                        _dark={{ 
                          color: 'blue.200',
                          bg: 'gray.800',
                          borderColor: 'blue.600'
                        }}
                      >
                        {systemInfo.systemIdentifier}
                      </Text>
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="blue"
                        leftIcon={<FiCopy />}
                        onClick={() => handleCopySystemId()}
                      >
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="orange"
                        leftIcon={<FiRefreshCw />}
                        onClick={() => handleRefreshSystemId()}
                      >
                        Refresh
                      </Button>
                    </HStack>
                  </HStack>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        )}

        <Card bg={cardBg} borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Upload New License</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Important Notice</AlertTitle>
                  <AlertDescription>
                    Uploading a new license will replace the current one and immediately apply system-wide.
                    Only {ALLOWED_EXTENSIONS.join(' and ')} files are accepted (max {formatFileSize(MAX_FILE_SIZE)}).
                  </AlertDescription>
                </Box>
              </Alert>
              
              <FormControl>
                <FormLabel>Select License File</FormLabel>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_EXTENSIONS.join(',')}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <HStack align="start">
                  <Button
                    leftIcon={<FiUpload />}
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    isDisabled={isUploading}
                  >
                    Choose File
                  </Button>
                  {selectedFile && (
                    <VStack align="start" spacing={1} flex={1}>
                      <Text fontSize="sm" fontWeight="medium">{selectedFile.name}</Text>
                      <Text fontSize="xs" color="gray.500">
                        {formatFileSize(selectedFile.size)}
                      </Text>
                      {getFileValidationMessage() && (
                        <Text fontSize="xs" color="red.500">
                          {getFileValidationMessage()}
                        </Text>
                      )}
                    </VStack>
                  )}
                </HStack>
              </FormControl>
              
              <FormControl>
                <FormLabel>Description (Optional)</FormLabel>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description for this license..."
                  resize="vertical"
                  rows={3}
                  isDisabled={isUploading}
                />
              </FormControl>
              
              {uploadProgress && (
                <Box>
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="sm">Uploading...</Text>
                    <Text fontSize="sm">{uploadProgress.percentage}%</Text>
                  </HStack>
                  <Progress value={uploadProgress.percentage} colorScheme="blue" />
                </Box>
              )}
              
              <HStack justify="flex-end">
                <Button
                  leftIcon={<FiUpload />}
                  colorScheme="blue"
                  onClick={() => handleUpload()}
                  isLoading={isUploading}
                  loadingText="Uploading..."
                  isDisabled={uploadButtonDisabled}
                >
                  Upload License
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </DamBasePage>
  );
} 