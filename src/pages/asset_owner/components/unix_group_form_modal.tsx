import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Textarea,
  Box,
  Divider,
  IconButton,
  Alert,
  AlertIcon,
  useColorModeValue,
  Badge,
  Flex,
  Checkbox,
  Spinner,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { useIntl } from 'react-intl';
import {
  UnixGroup,
  CreateUnixGroup,
  UpdateUnixGroup,
  UnixPermissions,
  UnixFolderSuggestion
} from '../../../models/unix/UnixGroup';
import { getAuthToken, stateActions } from '@common/index';
import { useDamToast } from '@common/hooks/useDamToast';

// Reusable component for suggestion items
interface SuggestionItemProps {
  suggestion: UnixFolderSuggestion | { path: string; permissions: string; type: string };
  onClick: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  isLast: boolean;
  hoverBg: string;
  borderColor: string;
}

const SuggestionItem: React.FC<SuggestionItemProps> = ({ 
  suggestion, 
  onClick, 
  onMouseDown, 
  isLast, 
  hoverBg, 
  borderColor 
}) => (
  <Box
    p={2}
    cursor="pointer"
    _hover={{ bg: hoverBg }}
    onClick={onClick}
    onMouseDown={onMouseDown}
    borderBottom={isLast ? "none" : "1px solid"}
    borderBottomColor={borderColor}
  >
    <HStack spacing={2}>
      <Text fontSize="sm" color={suggestion.type === 'directory' ? 'blue.500' : 'gray.500'} mb={0}>
        {suggestion.type === 'directory' ? '📁' : '📄'}
      </Text>
      <Text fontSize="sm" fontFamily="mono" flex={1} mb={0}>
        {suggestion.path}
      </Text>
      <Text fontSize="xs" color="gray.500" mb={0}>
        {suggestion.permissions}
      </Text>
    </HStack>
  </Box>
);

interface UnixGroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (groupData: CreateUnixGroup | UpdateUnixGroup, sessionId?: string) => Promise<void>;
  assetId: number;
  group?: UnixGroup; // For editing
  loading?: boolean;
}

export const UnixGroupFormModal: React.FC<UnixGroupFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  assetId,
  group,
  loading = false
}) => {
  const intl = useIntl();
  const isEditing = !!group;

  // Form state
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [folderAccess, setFolderAccess] = useState<Array<{
    folderPath: string;
    accessType: string;
    permissions: UnixPermissions;
  }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // WebSocket and folder suggestions state
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [suggestions, setSuggestions] = useState<{path: string, permissions: string, type: string}[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const [currentPermissions, setCurrentPermissions] = useState<UnixPermissions>({ read: true, write: false, execute: false });
  const {showSuccess, showError} = useDamToast();
  const [isSSHConnected, setIsSSHConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Helper function to convert backend permissions to form format
  const parseBackendPermissions = (permissions: string): UnixPermissions => {
    return {
      read: permissions.includes('r'),
      write: permissions.includes('w'),
      execute: permissions.includes('x')
    };
  };

  // Helper function to convert form permissions to backend format
  const formatBackendPermissions = (permissions: UnixPermissions): string => {
    let result = '';
    if (permissions.read) result += 'r';
    if (permissions.write) result += 'w';
    if (permissions.execute) result += 'x';
    return result || 'r'; // Default to read if no permissions
  };
  
  // Edit state for folder access items
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editPath, setEditPath] = useState('');
  const [editPermissions, setEditPermissions] = useState<UnixPermissions>({ read: true, write: false, execute: false });
  const [editSuggestions, setEditSuggestions] = useState<{path: string, permissions: string, type: string}[]>([]);
  const [showEditSuggestions, setShowEditSuggestions] = useState(false);
  const [loadingEditSuggestions, setLoadingEditSuggestions] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  // Debounce utility function
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const suggestionsContainer = target.closest('[data-suggestions-container]');
      const isInputClick = inputRef.current?.contains(target);
      const isEditInputClick = editInputRef.current?.contains(target);
      
      if (!suggestionsContainer && !isInputClick && !isEditInputClick) {
        setShowSuggestions(false);
        setShowEditSuggestions(false);
      }
    };

    if (showSuggestions || showEditSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions, showEditSuggestions]);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const hoverBorderColor = useColorModeValue('blue.300', 'blue.600');
  const emptyStateBg = useColorModeValue('gray.50', 'gray.700');

  const authData = getAuthToken();
  const { token, provider } = authData || {};

  useEffect(() => {
    if (isSSHConnected) {
      stateActions.subLoading();
      setIsConnecting(false);
    } else if (isConnecting) {
      stateActions.addLoading();
    }
  }, [isSSHConnected, isConnecting]);

  // WebSocket connection for folder suggestions
  useEffect(() => {
    if (isOpen && assetId) {
      const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080';
      const websocket = new WebSocket(`${wsUrl}/ws/unix-groups`);

      if (!authData) {
        return;
      }

      websocket.onopen = () => {
        console.log('WebSocket connected for folder suggestions');
        setWs(websocket);
        setIsConnecting(true);

        // Authenticate with WebSocket
        if (token) {
          websocket.send(JSON.stringify({
            action: 'authenticate',
            connectionType: 'unix-groups',
            token: token,
            assetId: assetId,
            authProvider: provider
          }));
        }
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'folder_suggestions') {
            if (editingIndex === null) {
              setSuggestions(data.suggestions || []);
              setLoadingSuggestions(false);
            } else {
              setEditSuggestions(data.suggestions || []);
              setLoadingEditSuggestions(false);
            }
          } else if (data.type === 'permission_applied') {
            console.log('Permissions applied successfully:', data);
          } else if (data.type === 'error') {
            console.error('WebSocket error:', data.message);
            setLoadingSuggestions(false);
          } else if (data.type === 'ssh_connected') {
            setIsSSHConnected(true);
            showSuccess({
              description: intl.formatMessage({ id: 'unix_groups.ssh_connected' })
            });
          } else if (data.type === 'ssh_connection_failed') {
            setIsSSHConnected(false);
            setIsConnecting(false);
            showError({
              description: intl.formatMessage({ id: 'unix_groups.ssh_connection_failed' })
            });
          } else if (data.type === 'authentication_success') {
            setSessionId(data.sessionId || null);
            console.log('WebSocket authentication successful, sessionId:', data.sessionId);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          showError({
            description: intl.formatMessage({ id: 'unix_groups.error_parsing_web_socket_message' })
          });
          stateActions.subLoading();
        }
      };

      websocket.onclose = () => {
        console.log('WebSocket disconnected');
        setWs(null);
        setIsSSHConnected(false);
        setIsConnecting(false);
        setSessionId(null);
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWs(null);
        setIsSSHConnected(false);
        setIsConnecting(false);
        setSessionId(null);
        showError({
          description: intl.formatMessage({ id: 'unix_groups.websocket_connection_error' })
        });
      };

      return () => {
        websocket.close();
      };
    }
  }, [isOpen, assetId]);

  // Initialize form with group data when editing
  useEffect(() => {
    if (isEditing && group) {
      setGroupName(group.groupName);
      setDescription(group.description || '');
      setFolderAccess(
        (group.folderAccesses || []).map(access => ({
          folderPath: access.folderPath,
          accessType: access.accessType,
          permissions: parseBackendPermissions(access.permissions)
        }))
      );
    } else {
      // Reset form for new group
      setGroupName('');
      setDescription('');
      setFolderAccess([]);
      setCurrentPath('/');
      setCurrentPermissions({ read: true, write: false, execute: false });
      setSuggestions([]);
    }
    setErrors({});
    
    // Reset edit state when modal closes
    if (!isOpen) {
      setEditingIndex(null);
      setEditPath('');
      setEditPermissions({ read: true, write: false, execute: false });
      setEditSuggestions([]);
      setShowEditSuggestions(false);
      setSessionId(null);
    }
  }, [isEditing, group, isOpen]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const trimmedName = groupName.trim();
    
    if (trimmedName.length === 0) {
      newErrors.groupName = intl.formatMessage({ id: 'unix_groups.group_name_required' });
    } else if (trimmedName.length < 1 || trimmedName.length > 32) {
      newErrors.groupName = intl.formatMessage({ id: 'unix_groups.group_name_length_invalid' });
    } else if (/[^a-zA-Z0-9._-]/.test(trimmedName)) {
      newErrors.groupName = intl.formatMessage({ id: 'unix_groups.group_name_format_invalid' });
    }

    if (folderAccess.length === 0) {
      newErrors.folderAccess = intl.formatMessage({ id: 'unix_groups.folder_access_required' });
    }

    // Check for duplicate folder paths
    const folderPaths = folderAccess.map(f => f.folderPath);
    const duplicatePaths = folderPaths.filter((path, index) => folderPaths.indexOf(path) !== index);
    if (duplicatePaths.length > 0) {
      newErrors.folderAccess = intl.formatMessage({ id: 'unix_groups.duplicate_folder_paths' });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const groupData = {
        groupName: groupName.trim(),
        description: description.trim() || undefined,
        folderAccesses: folderAccess.map(access => ({
          ...access,
          permissions: formatBackendPermissions(access.permissions)
        }))
      };

      if (isEditing) {
        await onSubmit(groupData as UpdateUnixGroup, sessionId || undefined);

        // Apply permissions via WebSocket for existing group
        if (group?.id) {
          for (const access of folderAccess) {
            applyFolderPermissions(access.folderPath, access.permissions, group.id);
          }
        }
      } else {
        await onSubmit({ ...groupData, assetId } as CreateUnixGroup, sessionId || undefined);

        // Note: For new groups, permissions will be applied after the group is created
        // The parent component should handle the WebSocket permission application
      }

      onClose();
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Form submission error:', error);
    }
  };
  // Remove folder access
  const removeFolderAccess = (index: number) => {
    setFolderAccess(folderAccess.filter((_, i) => i !== index));
  };

  // Request folder suggestions via WebSocket
  const requestFolderSuggestions = (path: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      setLoadingSuggestions(true);
      ws.send(JSON.stringify({
        action: 'get_folder_suggestions',
        path: path
      }));
    }
  };

  // Debounced suggestion request
  const debouncedRequestSuggestions = useCallback(
    debounce((inputPath: string) => {
      if (inputPath.length > 0) {
        requestFolderSuggestions(inputPath);
      }
    }, 300),
    [ws]
  );

  // Apply folder permissions via WebSocket
  const applyFolderPermissions = (folderPath: string, permissions: UnixPermissions, groupId?: number) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        action: 'apply_folder_permissions',
        folderPath: folderPath,
        readPermission: permissions.read,
        writePermission: permissions.write,
        executePermission: permissions.execute,
        recursive: false,
        groupId: groupId
      }));
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: {path: string, permissions: string, type: string}) => {
    setCurrentPath(suggestion.path);
    setShowSuggestions(false);
    debouncedRequestSuggestions(suggestion.path);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'Enter' && currentPath.trim()) {
      setShowSuggestions(false);
      handleFolderSelect(currentPath);
    }
  };

  // Handle folder selection from suggestions
  const handleFolderSelect = (folderPath: string) => {
    // Check if folder is already added
    if (folderAccess.some(f => f.folderPath === folderPath)) {
      setErrors({ ...errors, folderAccess: intl.formatMessage({ id: 'unix_groups.folder_already_added' }) });
      return;
    }

    // Add new folder access with current permissions
    const newFolderAccess = {
      folderPath,
      accessType: 'READ_ONLY', // This will be determined by permissions
      permissions: currentPermissions
    };
    setFolderAccess([...folderAccess, newFolderAccess]);
    setErrors({ ...errors, folderAccess: '' });
    
    // Clear the input and reset permissions
    setCurrentPath('/');
    setCurrentPermissions({ read: true, write: false, execute: false });
    setShowSuggestions(false);
  };

  // Handle edit folder access
  const handleEditFolderAccess = (index: number) => {
    const access = folderAccess[index];
    setEditingIndex(index);
    setEditPath(access.folderPath);
    setEditPermissions(access.permissions);
    setEditSuggestions([]);
    setShowEditSuggestions(false);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditPath('');
    setEditPermissions({ read: true, write: false, execute: false });
    setEditSuggestions([]);
    setShowEditSuggestions(false);
  };

  // Handle save edit
  const handleSaveEdit = () => {
    if (!editPath.trim()) return;

    // Check for duplicate paths (excluding current item)
    const otherPaths = folderAccess.filter((_, i) => i !== editingIndex).map(f => f.folderPath);
    if (otherPaths.includes(editPath)) {
      setErrors({ ...errors, folderAccess: intl.formatMessage({ id: 'unix_groups.folder_already_added' }) });
      return;
    }

    // Update the folder access
    const updated = [...folderAccess];
    updated[editingIndex!] = {
      folderPath: editPath,
      accessType: 'READ_ONLY', // This will be determined by permissions
      permissions: editPermissions
    };
    setFolderAccess(updated);
    setErrors({ ...errors, folderAccess: '' });
    
    // Reset edit state
    handleCancelEdit();
  };

  // Request edit suggestions
  const requestEditSuggestions = (path: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      setLoadingEditSuggestions(true);
      ws.send(JSON.stringify({
        action: 'get_folder_suggestions',
        path: path
      }));
    }
  };

  // Debounced edit suggestion request
  const debouncedRequestEditSuggestions = useCallback(
    debounce((inputPath: string) => {
      if (inputPath.length > 0) {
        requestEditSuggestions(inputPath);
      }
    }, 300),
    [ws]
  );

  // Handle edit suggestion selection
  const handleEditSuggestionClick = (suggestion: {path: string, permissions: string, type: string}) => {
    setEditPath(suggestion.path);
    setShowEditSuggestions(false);
  };

  // Handle edit keyboard navigation
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' || (e.key === 'Enter' && editPath.trim())) {
      setShowEditSuggestions(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          <Text fontSize="lg" fontWeight="semibold" mb={0}>
            {isEditing
              ? intl.formatMessage({ id: 'unix_groups.edit_group' })
              : intl.formatMessage({ id: 'unix_groups.create_group' })
            }
          </Text>
        </ModalHeader>

        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Basic Information */}
            <Box>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={0}>
                    {intl.formatMessage({ id: 'unix_groups.group_name' })} *
                  </Text>
                  <Input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder={intl.formatMessage({ id: 'unix_groups.group_name_placeholder' })}
                    isInvalid={!!errors.groupName}
                    errorBorderColor="red.300"
                  />
                  {errors.groupName && (
                    <Text fontSize="xs" color="red.500" mt={1} mb={0}>
                      {errors.groupName}
                    </Text>
                  )}
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={0}>
                    {intl.formatMessage({ id: 'unix_groups.description' })}
                  </Text>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={intl.formatMessage({ id: 'unix_groups.description_placeholder' })}
                    mb={0}
                    rows={3}
                  />
                </Box>
              </VStack>
            </Box>

            <Divider />

            {/* Add Folder Section */}
            <Box>
              <Flex justify="space-between" align="center" mb={3}>
                <Text fontSize="sm" fontWeight="medium" mb={0}>
                  {intl.formatMessage({ id: 'unix_groups.add_folder_access' })}
                </Text>
                <HStack spacing={2}>
                  {isConnecting && (
                    <HStack spacing={1}>
                      <Spinner size="xs" />
                      <Text fontSize="xs" color="blue.500" mb={0}>
                        {intl.formatMessage({ id: 'unix_groups.connecting' })}
                      </Text>
                    </HStack>
                  )}
                  {isSSHConnected && (
                    <Badge colorScheme="green" size="sm">
                      {intl.formatMessage({ id: 'unix_groups.connected' })}
                    </Badge>
                  )}
                  {!isSSHConnected && !isConnecting && (
                    <Badge colorScheme="red" size="sm">
                      {intl.formatMessage({ id: 'unix_groups.disconnected' })}
                    </Badge>
                  )}
                </HStack>
              </Flex>
              
              {!isSSHConnected && !isConnecting && (
                <Alert status="warning" size="sm" mb={4}>
                  <AlertIcon />
                  <Text fontSize="sm" mb={0}>
                    {intl.formatMessage({ id: 'unix_groups.ssh_required_message' })}
                  </Text>
                </Alert>
              )}

              <VStack spacing={4} align="stretch">
                {/* Path Input with Suggestions */}
                <Box position="relative" data-suggestions-container>
                  <Text fontSize="xs" fontWeight="medium" mb={1} color="gray.600">
                    {intl.formatMessage({ id: 'unix_groups.folder_path' })} *
                  </Text>
                  <Input
                    ref={inputRef}
                    placeholder={intl.formatMessage({ id: 'unix_groups.folder_path_placeholder' })}
                    value={currentPath}
                    onChange={(e) => {
                      const path = e.target.value;
                      setCurrentPath(path);
                      setShowSuggestions(true);
                      if (isSSHConnected) {
                        debouncedRequestSuggestions(path);
                      }
                    }}
                    onFocus={() => {
                      if (isSSHConnected) {
                        setShowSuggestions(true);
                        // Request suggestions for current path when focusing
                        if (currentPath.trim()) {
                          debouncedRequestSuggestions(currentPath);
                        }
                      }
                    }}
                    onBlur={() => {
                      // Don't hide suggestions immediately on blur
                      // Let the click outside handler manage this
                    }}
                    onKeyDown={handleKeyDown}
                    fontFamily="mono"
                    fontSize="sm"
                    mb={0}
                    isDisabled={!isSSHConnected}
                  />
                  
                  {showSuggestions && suggestions.length > 0 && (
                    <Box
                      position="absolute"
                      top="100%"
                      left={0}
                      right={0}
                      maxH="200px"
                      overflowY="auto"
                      bg={bgColor}
                      border="1px solid"
                      borderColor={borderColor}
                      borderRadius="md"
                      boxShadow="lg"
                      zIndex={1000}
                      mt={1}
                    >
                      {loadingSuggestions && (
                        <Flex p={2} align="center">
                          <Spinner size="xs" mr={2} />
                          <Text fontSize="sm" mb={0}>
                            {intl.formatMessage({ id: 'unix_groups.loading_suggestions' })}
                          </Text>
                        </Flex>
                      )}
                      
                        {suggestions.map((suggestion, index) => (
                        <SuggestionItem
                          key={`suggestion-${suggestion.path}-${index}`}
                          suggestion={suggestion}
                          onClick={(e) => {
                            e.preventDefault();
                            handleSuggestionClick(suggestion);
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent input from losing focus
                          }}
                          isLast={index === suggestions.length - 1}
                          hoverBg={hoverBg}
                          borderColor={borderColor}
                        />
                      ))}
                    </Box>
                  )}
                </Box>

                {/* Permissions Checkboxes */}
                <Box>
                  <Text fontSize="xs" fontWeight="medium" mb={2} color="gray.600">
                    {intl.formatMessage({ id: 'unix_groups.permissions' })}
                  </Text>
                  <HStack spacing={6}>
                    <Checkbox
                      isChecked={currentPermissions.read}
                      onChange={(e) => setCurrentPermissions(prev => ({ ...prev, read: e.target.checked }))}
                      isDisabled={!isSSHConnected}
                    >
                      <Text fontSize="sm" mb={0}>
                        {intl.formatMessage({ id: 'unix_groups.read' })}
                      </Text>
                    </Checkbox>
                    <Checkbox
                      isChecked={currentPermissions.write}
                      onChange={(e) => setCurrentPermissions(prev => ({ ...prev, write: e.target.checked }))}
                      isDisabled={!isSSHConnected}
                    >
                      <Text fontSize="sm" mb={0}>
                        {intl.formatMessage({ id: 'unix_groups.write' })}
                      </Text>
                    </Checkbox>
                    <Checkbox
                      isChecked={currentPermissions.execute}
                      onChange={(e) => setCurrentPermissions(prev => ({ ...prev, execute: e.target.checked }))}
                      isDisabled={!isSSHConnected}
                    >
                      <Text fontSize="sm" mb={0}>
                        {intl.formatMessage({ id: 'unix_groups.execute' })}
                      </Text>
                    </Checkbox>
                  </HStack>
                </Box>

                {/* Add Folder Button */}
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={() => handleFolderSelect(currentPath)}
                  isDisabled={!currentPath.trim() || loading || !isSSHConnected}
                  leftIcon={<AddIcon />}
                >
                  {intl.formatMessage({ id: 'unix_groups.add_folder' })}
                </Button>
              </VStack>
            </Box>

            <Divider />

            {/* Added Folders List */}
            <Box>
              <Flex justify="space-between" align="center" mb={4}>
                <Text fontSize="sm" fontWeight="medium" mb={0}>
                  {intl.formatMessage({ id: 'unix_groups.added_folders' })} ({folderAccess.length})
                </Text>
                {folderAccess.length > 0 && (
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => setFolderAccess([])}
                  >
                    {intl.formatMessage({ id: 'unix_groups.clear_all' })}
                  </Button>
                )}
              </Flex>

              {errors.folderAccess && (
                <Alert status="error" size="sm" mb={4}>
                  <AlertIcon />
                  <Text fontSize="sm" mb={0}>{errors.folderAccess}</Text>
                </Alert>
              )}

              {/* Folder Access List */}
              {folderAccess.length > 0 ? (
                <VStack spacing={3} align="stretch">
                  {folderAccess.map((access, index) => (
                    <Box
                      key={`folder-access-${access.folderPath}-${index}`}
                      p={4}
                      border="1px solid"
                      borderColor={borderColor}
                      borderRadius="md"
                      bg={bgColor}
                      _hover={{ borderColor: hoverBorderColor }}
                      transition="border-color 0.2s"
                    >
                      {editingIndex === index ? (
                        // Edit Mode
                        <VStack spacing={3} align="stretch">
                          {/* Edit Path Input with Suggestions */}
                          <Box position="relative" data-suggestions-container>
                            <Input
                              ref={editInputRef}
                              placeholder={intl.formatMessage({ id: 'unix_groups.folder_path_placeholder' })}
                              value={editPath}
                              onChange={(e) => {
                                const path = e.target.value;
                                setEditPath(path);
                                setShowEditSuggestions(true);
                                if (isSSHConnected) {
                                  debouncedRequestEditSuggestions(path);
                                }
                              }}
                              onFocus={() => {
                                if (isSSHConnected) {
                                  setShowEditSuggestions(true);
                                  if (editPath.trim()) {
                                    debouncedRequestEditSuggestions(editPath);
                                  }
                                }
                              }}
                              onKeyDown={handleEditKeyDown}
                              fontFamily="mono"
                              fontSize="sm"
                              size="sm"
                              mb={0}
                              isDisabled={!isSSHConnected}
                            />
                            
                            {showEditSuggestions && editSuggestions.length > 0 && (
                              <Box
                                position="absolute"
                                top="100%"
                                left={0}
                                right={0}
                                maxH="200px"
                                overflowY="auto"
                                bg={bgColor}
                                border="1px solid"
                                borderColor={borderColor}
                                borderRadius="md"
                                boxShadow="lg"
                                zIndex={1000}
                                mt={1}
                              >
                                {loadingEditSuggestions && (
                                  <Flex p={2} align="center">
                                    <Spinner size="xs" mr={2} />
                                    <Text fontSize="sm" mb={0}>
                                      {intl.formatMessage({ id: 'unix_groups.loading_suggestions' })}
                                    </Text>
                                  </Flex>
                                )}
                                
                                {editSuggestions.map((suggestion, suggestionIndex) => (
                                  <SuggestionItem
                                    key={`edit-suggestion-${suggestion.path}-${suggestionIndex}`}
                                    suggestion={suggestion}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleEditSuggestionClick(suggestion);
                                    }}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                    }}
                                    isLast={suggestionIndex === editSuggestions.length - 1}
                                    hoverBg={hoverBg}
                                    borderColor={borderColor}
                                  />
                                ))}
                              </Box>
                            )}
                          </Box>

                          {/* Edit Permissions Checkboxes */}
                          <HStack spacing={6}>
                            <Checkbox
                              isChecked={editPermissions.read}
                              onChange={(e) => setEditPermissions(prev => ({ ...prev, read: e.target.checked }))}
                              isDisabled={!isSSHConnected}
                              size="sm"
                            >
                              <Text fontSize="sm" mb={0}>
                                {intl.formatMessage({ id: 'unix_groups.read' })}
                              </Text>
                            </Checkbox>
                            <Checkbox
                              isChecked={editPermissions.write}
                              onChange={(e) => setEditPermissions(prev => ({ ...prev, write: e.target.checked }))}
                              isDisabled={!isSSHConnected}
                              size="sm"
                            >
                              <Text fontSize="sm" mb={0}>
                                {intl.formatMessage({ id: 'unix_groups.write' })}
                              </Text>
                            </Checkbox>
                            <Checkbox
                              isChecked={editPermissions.execute}
                              onChange={(e) => setEditPermissions(prev => ({ ...prev, execute: e.target.checked }))}
                              isDisabled={!isSSHConnected}
                              size="sm"
                            >
                              <Text fontSize="sm" mb={0}>
                                {intl.formatMessage({ id: 'unix_groups.execute' })}
                              </Text>
                            </Checkbox>
                          </HStack>

                          {/* Edit Action Buttons */}
                          <HStack spacing={2} justify="flex-end">
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              isDisabled={!isSSHConnected}
                            >
                              {intl.formatMessage({ id: 'text.cancel' })}
                            </Button>
                            <Button
                              size="xs"
                              colorScheme="blue"
                              onClick={handleSaveEdit}
                              isDisabled={!editPath.trim() || !isSSHConnected}
                            >
                              {intl.formatMessage({ id: 'text.save' })}
                            </Button>
                          </HStack>
                        </VStack>
                      ) : (
                        // Display Mode
                        <Flex justify="space-between" align="start">
                          <VStack spacing={2} align="start" flex={1}>
                            <HStack spacing={2} align="center">
                              <Text fontSize="sm" color="blue.500" mb={0}>📁</Text>
                              <Text fontSize="sm" fontFamily="mono" fontWeight="medium" mb={0}>
                                {access.folderPath}
                              </Text>
                            </HStack>
                            
                            <HStack spacing={4}>
                              <HStack spacing={1}>
                                <Text fontSize="xs" color="gray.500" mb={0}>Read:</Text>
                                <Badge colorScheme={access.permissions.read ? 'green' : 'gray'} size="sm">
                                  {access.permissions.read ? '✓' : '✗'}
                                </Badge>
                              </HStack>
                              <HStack spacing={1}>
                                <Text fontSize="xs" color="gray.500" mb={0}>Write:</Text>
                                <Badge colorScheme={access.permissions.write ? 'green' : 'gray'} size="sm">
                                  {access.permissions.write ? '✓' : '✗'}
                                </Badge>
                              </HStack>
                              <HStack spacing={1}>
                                <Text fontSize="xs" color="gray.500" mb={0}>Execute:</Text>
                                <Badge colorScheme={access.permissions.execute ? 'green' : 'gray'} size="sm">
                                  {access.permissions.execute ? '✓' : '✗'}
                                </Badge>
                              </HStack>
                            </HStack>
                          </VStack>
                          
                          <HStack spacing={2}>
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleEditFolderAccess(index)}
                              isDisabled={!isSSHConnected}
                            >
                              {intl.formatMessage({ id: 'unix_groups.edit' })}
                            </Button>
                            <IconButton
                              size="sm"
                              variant="ghost"
                              icon={<DeleteIcon />}
                              onClick={() => removeFolderAccess(index)}
                              aria-label="Remove folder"
                              colorScheme="red"
                            />
                          </HStack>
                        </Flex>
                      )}
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Box
                  p={8}
                  textAlign="center"
                  border="2px dashed"
                  borderColor={borderColor}
                  borderRadius="md"
                  bg={emptyStateBg}
                >
                  <Text fontSize="sm" color="gray.500" mb={0}>
                    {intl.formatMessage({ id: 'unix_groups.no_folders_added' })}
                  </Text>
                  <Text fontSize="xs" color="gray.400" mt={1} mb={0}>
                    {intl.formatMessage({ id: 'unix_groups.add_folders_to_continue' })}
                  </Text>
                </Box>
              )}
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose} isDisabled={loading}>
              {intl.formatMessage({ id: 'text.cancel' })}
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={loading}
              loadingText={isEditing ? 'Updating...' : 'Creating...'}
            >
              {isEditing
                ? intl.formatMessage({ id: 'text.update' })
                : intl.formatMessage({ id: 'text.create' })
              }
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
