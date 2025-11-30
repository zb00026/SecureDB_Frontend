import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Flex,
  IconButton,
  useColorModeValue,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Checkbox,
  Select as ChakraSelect,
  FormControl,
  FormLabel,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import { MultiValue, Select as RoleSelect } from 'chakra-react-select';
import { FiSend, FiMessageSquare, FiShield, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import { FormattedMessage, useIntl } from 'react-intl';
import { request, useDamToast } from '@common/index';
import { Role } from '@models/Role';
import { AssetCredential } from '@models/assets/AssetCredential';
import {
  Message,
  MaskingSuggestion,
  MaskingPolicy,
  ThemeColors,
  ChatTheme,
  ChatState,
  AIMaskingChatProps,
  ChatHeaderProps,
  ChatMessagesAreaProps,
  ChatInputAreaProps,
  QuickSuggestionsProps,
  PolicyConfirmationModalProps,
  RoleOption
} from '@models/assets/ai/AIChat';

// Animated Ellipsis Component
const AnimatedEllipsis: React.FC = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        if (prev === '..') return '...';
        if (prev === '.') return '..';
        return '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return <span>{dots}</span>;
};



// Helper functions to reduce cognitive complexity
const createSectionColors = (isLightMode: boolean) => ({
  sectionGrayBg: isLightMode ? 'gray.50' : 'gray.700',
  sectionGrayBorder: isLightMode ? 'gray.200' : 'gray.600',
  sectionGreenBg: isLightMode ? 'green.50' : 'green.900',
  sectionGreenBorder: isLightMode ? 'green.200' : 'green.700',
  sectionBlueBg: isLightMode ? 'blue.50' : 'blue.900',
  sectionBlueBorder: isLightMode ? 'blue.200' : 'blue.700',
  sectionPurpleBg: isLightMode ? 'purple.50' : 'purple.900',
  sectionPurpleBorder: isLightMode ? 'purple.200' : 'purple.700',
  sectionYellowBg: isLightMode ? 'yellow.50' : 'yellow.900',
  sectionYellowBorder: isLightMode ? 'yellow.200' : 'yellow.700',
});

const createCardColors = (isLightMode: boolean) => ({
  cardBg: isLightMode ? 'white' : 'gray.700',
  cardBorder: isLightMode ? 'gray.200' : 'gray.600',
  cardHoverBg: isLightMode ? 'gray.50' : 'gray.500',
  cardHoverBorder: isLightMode ? 'gray.300' : 'gray.500',
});

const createTextColors = (isLightMode: boolean) => ({
  textPrimary: isLightMode ? 'gray.800' : 'gray.100',
  textSecondary: isLightMode ? 'gray.500' : 'gray.400',
  quickLabel: isLightMode ? 'gray.700' : 'gray.200',
  disabledText: isLightMode ? 'gray.400' : 'gray.500',
  disabledBorder: isLightMode ? 'gray.200' : 'gray.600',
});

// Custom hook for theme colors to reduce complexity
const useChatTheme = (): ChatTheme => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const userMessageBg = useColorModeValue('blue.50', 'blue.900');
  const aiMessageBg = useColorModeValue('gray.50', 'gray.700');
  const isLightMode = useColorModeValue(true, false);
  
  const themeColors: ThemeColors = {
    ...createSectionColors(isLightMode),
    ...createCardColors(isLightMode),
    ...createTextColors(isLightMode),
  };

  return { bgColor, borderColor, userMessageBg, aiMessageBg, themeColors };
};

// Custom hook for chat state management
const useChatState = (): ChatState => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [pendingPolicy, setPendingPolicy] = useState<MaskingPolicy | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [roleOptions, setRoleOptions] = useState<Array<RoleOption>>([]);
  const [roles, setRoles] = useState<Array<Role>>([]);
  
  return {
    messages, setMessages,
    inputValue, setInputValue,
    isLoading, setIsLoading,
    selectedAsset, setSelectedAsset,
    pendingPolicy, setPendingPolicy,
    currentSessionId, setCurrentSessionId,
    isSessionLoading, setIsSessionLoading,
    roleOptions, setRoleOptions,
    roles, setRoles
  };
};

// Helper function to get valid assets
const getValidAssets = (credentials: AssetCredential[]) => 
  credentials
    .filter(cred => cred.username != null && cred.password != null)
    .map(cred => cred.asset)
    .filter((asset): asset is NonNullable<typeof asset> => asset !== undefined);

// Chat Header Component
const ChatHeader: React.FC<ChatHeaderProps> = ({ assets, selectedAsset, onAssetChange, currentSessionId, isSessionLoading, onRefreshSession, borderColor, selectBg, intl }) => (
  <Flex p={4} borderBottom="1px" borderColor={borderColor} align="center" justify="space-between">
    <HStack>
      <FiMessageSquare />
      <Text fontWeight="bold" mb={0}>
        <FormattedMessage id="text.ai_masking_assistant" />
      </Text>
    </HStack>

    <HStack spacing={2} flex="1" justify="center" mx={4}>
      <Text fontSize="sm" fontWeight="medium" mb={0}>
        <FormattedMessage id="text.asset" />:
      </Text>
      <ChakraSelect
        size="sm"
        value={selectedAsset?.id || ''}
        onChange={(e) => onAssetChange(e.target.value)}
        minW="200px"
        maxW="300px"
        bg={selectBg}
        isDisabled={assets.length === 0}
      >
        {assets.length === 0 ? (
          <option value="">
            {intl.formatMessage({ id: 'text.no_assets_available' })}
          </option>
        ) : (
          assets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.name || `${asset.hostAddress}:${asset.portNumber}/${asset.databaseName || 'N/A'}`}
            </option>
          ))
        )}
      </ChakraSelect>
    </HStack>

    <HStack spacing={2}>
      {(() => {
        if (!selectedAsset) {
          return <Icon as={FiX} color="gray.500" />;
        }
        if (isSessionLoading) {
          return <Spinner size="sm" color="blue.500" />;
        }
        if (currentSessionId) {
          return <Icon as={FiCheck} color="green.500" />;
        }
        return <Icon as={FiX} color="red.500" />;
      })()}
      <Text fontSize="sm" color={(() => {
        if (!selectedAsset) return 'gray.500';
        if (currentSessionId) return 'green.500';
        return 'red.500';
      })()} mb={0}>
        {(() => {
          if (!selectedAsset) {
            return intl.formatMessage({ id: 'text.session_not_available' });
          }
          if (isSessionLoading) {
            return intl.formatMessage({ id: 'text.connecting' });
          }
          if (currentSessionId) {
            return intl.formatMessage({ id: 'text.session_active' });
          }
          return intl.formatMessage({ id: 'text.session_inactive' });
        })()}
      </Text>
      {currentSessionId && (
        <IconButton
          size="sm"
          icon={<FiRefreshCw />}
          aria-label="Refresh session"
          onClick={onRefreshSession}
          variant="ghost"
        />
      )}
    </HStack>
  </Flex>
);

// Chat Messages Area Component
const ChatMessagesArea: React.FC<ChatMessagesAreaProps> = ({ messagesContainerRef, messages, renderMessage, isLoading, aiMessageBg, borderColor, intl }) => (
  <VStack
    ref={messagesContainerRef}
    h="calc(100% - 180px)"
    p={4}
    spacing={0}
    overflowY="auto"
  >
    {messages.map(renderMessage)}
    {isLoading && (
      <Box alignSelf="flex-start" maxW="70%" minW="25%">
        <Box bg={aiMessageBg} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
          <Text fontSize="sm" color="gray.500" mb={0}>
            <FormattedMessage id="text.ai_assistant" />
          </Text>
          <Text>
            {intl.formatMessage({ id: 'text.ai_thinking' })}<AnimatedEllipsis />
          </Text>
        </Box>
      </Box>
    )}
  </VStack>
);

// Chat Input Area Component
const ChatInputArea: React.FC<ChatInputAreaProps> = ({ inputValue, onInputChange, onSendMessage, onSendSuggestion, selectedAsset, currentSessionId, isSessionLoading, isLoading, borderColor, quickSuggestionColors, intl }) => (
  <Flex flexDirection="column">
    <Flex pl={4} pr={4} pt={4} borderTop="1px" borderColor={borderColor}>
      <Input
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder={
          !selectedAsset
            ? intl.formatMessage({ id: 'text.select_asset_first' })
            : intl.formatMessage({ id: 'text.type_masking_request' })
        }
        onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
        mr={2}
        isDisabled={!selectedAsset}
      />
      <IconButton
        colorScheme="blue"
        aria-label="Send message"
        icon={<FiSend />}
        onClick={onSendMessage}
        isLoading={isLoading}
        isDisabled={!selectedAsset}
      />
    </Flex>

    <QuickSuggestions
      onSendSuggestion={onSendSuggestion}
      currentSessionId={currentSessionId}
      isSessionLoading={isSessionLoading}
      selectedAsset={selectedAsset}
      colors={quickSuggestionColors}
    />
  </Flex>
);

// Quick Suggestions Component
const QuickSuggestions: React.FC<QuickSuggestionsProps> = ({ onSendSuggestion, currentSessionId, isSessionLoading, selectedAsset, colors }) => (
  <Flex pl={4} mt={2} gap={2} alignItems="center" justifyContent="flex-start">
    <Text
      fontSize="sm"
      fontWeight="medium"
      mb={0}
      color={colors.text}
    >
      <FormattedMessage id="text.quick_suggestions" />
    </Text>
    <HStack spacing={2} flexWrap="wrap">
      {['Mask all email addresses', 'Hide social security numbers', 'Partially mask phone numbers', 'Tokenize credit card numbers', 'Protect customer names and addresses'].map((suggestion, index) => (
        <Button
          key={`suggestion-${suggestion}-${index}`}
          size="sm"
          variant="outline"
          onClick={() => onSendSuggestion(suggestion)}
          isDisabled={!currentSessionId || isSessionLoading || !selectedAsset}
          color={colors.text}
          borderColor={colors.border}
          _hover={{
            bg: colors.hoverBg,
            borderColor: colors.hoverBorder
          }}
          _disabled={{
            color: colors.disabledText,
            borderColor: colors.disabledBorder
          }}
        >
          <FormattedMessage id={['text.mask_emails', 'text.hide_ssns', 'text.mask_phones', 'text.tokenize_cards', 'text.protect_pii'][index]} />
        </Button>
      ))}
    </HStack>
  </Flex>
);

// Policy Confirmation Modal Component
const PolicyConfirmationModal: React.FC<PolicyConfirmationModalProps> = ({ isOpen, onClose, pendingPolicy, roleOptions, roles, onPolicyChange, onRoleChange, onConfirmPolicy, intl }) => (
  <Modal isOpen={isOpen} onClose={onClose}>
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>
        <FormattedMessage id="text.confirm_masking_policy" />
      </ModalHeader>
      <ModalBody>
        {pendingPolicy && (
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>
                <FormattedMessage id="text.masking_strategy" />
              </FormLabel>
              <ChakraSelect
                value={pendingPolicy?.maskingStrategy || 'partial'}
                onChange={(e) => onPolicyChange(pendingPolicy ? { ...pendingPolicy, maskingStrategy: e.target.value as 'partial' | 'full' | 'hash' | 'custom' } : null)}
              >
                <option value="partial">
                  <FormattedMessage id="text.partial_masking" />
                </option>
                <option value="full">
                  <FormattedMessage id="text.full_masking" />
                </option>
                <option value="hash">
                  <FormattedMessage id="text.hash_masking" />
                </option>
              </ChakraSelect>
            </FormControl>

            {pendingPolicy?.maskingStrategy === 'partial' && (
              <FormControl>
                <FormLabel>
                  <FormattedMessage id="text.preserve_chars" />
                </FormLabel>
                <ChakraSelect
                  value={pendingPolicy?.preserveChars || 4}
                  onChange={(e) => onPolicyChange(pendingPolicy ? { ...pendingPolicy, preserveChars: parseInt(e.target.value) } : null)}
                >
                  <option value={2}>2 characters</option>
                  <option value={4}>4 characters</option>
                  <option value={6}>6 characters</option>
                </ChakraSelect>
              </FormControl>
            )}

            <FormControl>
              <FormLabel>
                <FormattedMessage id="text.selected_fields" />
              </FormLabel>
              <Text fontSize="sm" color="gray.600" mb={0}>
                {pendingPolicy?.suggestions.map(s => `${s.tableName}.${s.fieldName}`).join(', ')}
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel>
                <FormattedMessage id="text.affected_roles" />
              </FormLabel>
              <RoleSelect
                isMulti
                id="selectAffectedRoles"
                placeholder={intl.formatMessage({ id: 'text.select_roles' })}
                value={(pendingPolicy.roles || []).map(roleName => {
                  const role = roles.find(r => r.name === roleName);
                  return { label: roleName, value: role?.id.toString() || roleName };
                })}
                options={roleOptions}
                closeMenuOnSelect={false}
                chakraStyles={{
                  container: (provided) => ({ ...provided, width: '100%' })
                }}
                onChange={onRoleChange}
              />
            </FormControl>
          </VStack>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" mr={3} onClick={onClose}>
          <FormattedMessage id="text.cancel" />
        </Button>
        <Button colorScheme="blue" onClick={onConfirmPolicy}>
          <FormattedMessage id="text.apply_policy" />
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);

export function AIMaskingChat({ credentials, onPolicyCreated }: Readonly<AIMaskingChatProps>) {
  const intl = useIntl();
  const { showSuccess, showError } = useDamToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const suppressAutoScrollRef = useRef(false);

  // Use custom hooks to reduce complexity
  const { bgColor, borderColor, userMessageBg, aiMessageBg, themeColors } = useChatTheme();
  const {
    messages, setMessages,
    inputValue, setInputValue,
    isLoading, setIsLoading,
    selectedAsset, setSelectedAsset,
    pendingPolicy, setPendingPolicy,
    currentSessionId, setCurrentSessionId,
    isSessionLoading, setIsSessionLoading,
    roleOptions, setRoleOptions,
    roles, setRoles
  } = useChatState();

  // Define message background colors at component level to avoid hook usage in nested functions
  const systemMessageBg = useColorModeValue('orange.50', 'orange.900');
  const errorMessageBg = useColorModeValue('red.50', 'red.900');
  
  // Define additional colors for child components to avoid hook usage in callbacks
  const selectBg = useColorModeValue('white', 'gray.700');
  const quickSuggestionColors = {
    text: useColorModeValue('gray.700', 'gray.200'),
    border: useColorModeValue('gray.300', 'gray.600'),
    hoverBg: useColorModeValue('gray.50', 'gray.700'),
    hoverBorder: useColorModeValue('gray.400', 'gray.500'),
    disabledText: useColorModeValue('gray.400', 'gray.500'),
    disabledBorder: useColorModeValue('gray.200', 'gray.600')
  };

  const assets = getValidAssets(credentials);

  // Helper function to get sensitivity color scheme
  const getSensitivityColorScheme = (level: string) => {
    if (level === 'CRITICAL') return 'red';
    if (level === 'HIGH') return 'orange';
    if (level === 'MEDIUM') return 'yellow';
    return 'green';
  };

  // Set first asset as selected by default when credentials change
  useEffect(() => {
    console.log("Assets changed:", assets.length, "assets, selectedAsset:", selectedAsset);
    if (assets.length > 0 && !selectedAsset) {
      console.log("Setting first asset:", assets[0]);
      setSelectedAsset(assets[0]);
    }
  }, [assets.length]);

  // Load roles once when component mounts
  useEffect(() => {
    request(`/api/asset_owner/assets/roles`, {
      method: 'GET',
      data: {}
    }).then((res: any) => {
      if (res) {
        setRoleOptions(res.map((role: Role) => ({ label: role.name, value: role.id.toString() })));
        setRoles(res);
      } else {
        setRoleOptions([]);
        setRoles([]);
      }
    }).catch((e) => {
      setRoleOptions([]);
      setRoles([]);
      showError({
        description: e?.response?.data?.error ?? intl.formatMessage({ id: 'text.failed_getting_roles' })
      });
    });
  }, []);

  // Start chat session when selectedAsset changes
  useEffect(() => {
    if (selectedAsset) {
      console.log("Starting chat session for asset:", selectedAsset.id);
      startChatSession();
    }
  }, [selectedAsset]);



  const startChatSession = async () => {
    console.log("startChatSession called, selectedAsset:", selectedAsset);
    setIsSessionLoading(true);

    // Check if there's a selected asset
    if (!selectedAsset) {
      console.log("No selected asset, stopping chat session start");
      setIsSessionLoading(false);
      return;
    }

    try {
      // AI session start may take time for initial setup and connection
      const response = await request(`/api/ai/chat/session/start/${selectedAsset.id}`, {
        method: 'POST',
        data: {
        }
      }, true, 120000); // 2 minutes timeout for session start

      if (response) {
        setCurrentSessionId(response.sessionId);

        // Add welcome message from AI
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: response.content || intl.formatMessage({ id: 'text.ai_masking_welcome' }),
          timestamp: new Date(),
          sender: 'AI Assistant'
        };

        setMessages([welcomeMessage]);

        showSuccess({
          description: intl.formatMessage({ id: 'text.chat_session_started' })
        });
      }
    } catch (error) {
      console.error('Error starting chat session:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'error',
        content: intl.formatMessage({ id: 'text.chat_session_error' }),
        timestamp: new Date()
      };
      setMessages([errorMessage]);

      showError({
        description: intl.formatMessage({ id: 'text.chat_session_error' })
      });
    } finally {
      setIsSessionLoading(false);
    }
  };

  const sendChatMessage = async (messageContent: string) => {
    if (!currentSessionId || !messageContent.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date(),
      sender: 'You'
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // AI analysis can take a long time to process user requests and generate responses
      const response = await request('/api/ai/chat/message', {
        method: 'POST',
        data: {
          sessionId: currentSessionId,
          message: messageContent
        }
      }, true, 300000); // 5 minutes timeout for AI analysis

      if (response) {
        // Add unique IDs to suggestions if they don't have them
                        const suggestionsWithIds = response.suggestions?.map((suggestion: MaskingSuggestion, index: number) => ({
          ...suggestion,
          id: suggestion.id || `suggestion_${Date.now()}_${index}`
        })) || [];

        const aiMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: response.content,
          timestamp: new Date(),
          sender: 'AI Assistant',
          suggestions: suggestionsWithIds,
          confirmationRequired: suggestionsWithIds.length > 0
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'error',
        content: intl.formatMessage({ id: 'text.ai_error_message' }),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Use setTimeout to ensure DOM has updated
    const timeoutId = setTimeout(() => {
      if (suppressAutoScrollRef.current) {
        // Skip one auto-scroll cycle triggered by checkbox toggling
        suppressAutoScrollRef.current = false;
        return;
      }
      scrollToBottom();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };



  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !currentSessionId || !selectedAsset) return;

    const messageContent = inputValue;
    setInputValue('');
    await sendChatMessage(messageContent);
  };

  const sendSuggestion = async (text: string) => {
    if (!currentSessionId || !selectedAsset) return;

    setInputValue(text);
    await sendChatMessage(text);
    setInputValue(''); // Clear the input after sending
  };

  const refreshSession = async () => {
    await startChatSession();
  };

  const handleAssetChange = async (assetId: string) => {
    const asset = assets.find(a => a?.id?.toString() === assetId);
    if (asset?.id && asset.id !== selectedAsset?.id) {
      setSelectedAsset(asset);
      // Clear all messages when asset changes
      setMessages([]);
      // Reset session
      setCurrentSessionId(null);
      setIsSessionLoading(true);
    }
  };


  const handleSuggestionToggle = (suggestionId: string) => {
    // Prevent auto-scroll caused by the state update below
    suppressAutoScrollRef.current = true;
    
    const updateSuggestionSelection = (suggestion: MaskingSuggestion) => 
      suggestion.id === suggestionId 
        ? { ...suggestion, isSelected: !suggestion.isSelected } 
        : suggestion;

    const updateMessageSuggestions = (message: Message) => 
      message.suggestions 
        ? { ...message, suggestions: message.suggestions.map(updateSuggestionSelection) }
        : message;

    setMessages(prev => prev.map(updateMessageSuggestions));
  };

  const handleApplyMasking = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message?.suggestions) return;

    const selectedSuggestions = message.suggestions.filter(s => s.isSelected);
    if (selectedSuggestions.length === 0) {
      showError({
        description: intl.formatMessage({ id: 'text.no_suggestions_selected' })
      });
      return;
    }

    // Create masking policy with multiple suggestions
    const policy: MaskingPolicy = {
      originalRequest: message.content, // description -> originalRequest
      intentType: 'PII_MASKING', // Default intent type
      tableName: selectedSuggestions[0].tableName, // Use first suggestion's table as primary
      fieldName: selectedSuggestions.map(s => s.fieldName).join(', '), // Combine field names
      maskingStrategy: 'partial',
      roles: ['Developer', 'Auditor'], // Default role names as strings
      suggestions: selectedSuggestions, // Include all selected suggestions
      aiConfidence: Math.min(...selectedSuggestions.map(s => s.confidence)), // Use minimum confidence
      preserveChars: 4, // Default preserve chars for partial masking
      maskChar: '*' // Default mask character
    };

    setPendingPolicy(policy);
    onOpen();
  };

  const handleRoleChange = (selectedOptions: MultiValue<RoleOption>) => {
    const selectedRoleNames = selectedOptions.map(option => {
      // Find the role name by id
      const role = roles.find(role => role.id === parseInt(option.value.toString()));
      return role?.name || option.label; // Use role name or fallback to label
    });

    // Update the pending policy with the selected role names
    setPendingPolicy(prev => prev ? { ...prev, roles: selectedRoleNames } : prev);
  };

  const handleConfirmPolicy = async () => {
    if (!pendingPolicy || !selectedAsset) return;

    try {
      // Create multiple policies for each selected suggestion
      const policies = pendingPolicy.suggestions.map(suggestion => ({
        originalRequest: pendingPolicy.originalRequest,
        intentType: pendingPolicy.intentType,
        tableName: suggestion.tableName,
        fieldName: suggestion.fieldName,
        maskingStrategy: pendingPolicy.maskingStrategy,
        maskingPattern: pendingPolicy.maskingPattern,
        preserveChars: pendingPolicy.preserveChars,
        maskChar: pendingPolicy.maskChar,
        targetRole: pendingPolicy.roles.join(','), // Join roles as string
        aiConfidence: suggestion.confidence,
        aiReasoning: `AI suggested ${suggestion.suggestedStrategy} for ${suggestion.fieldName} in ${suggestion.tableName}`,
        roles: pendingPolicy.roles, // Send roles array for backend processing
        userConfirmed: true,
        isActive: true,
        assetId: selectedAsset.id
      }));

      // Send all policies to backend
      await request(`/api/asset_owner/masking-policies/${selectedAsset.id}`, {
        method: 'POST',
        data: { policies }
      });

      showSuccess({
        description: intl.formatMessage({ id: 'text.masking_policy_created' })
      });

      // Add confirmation message to chat
      const confirmationMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: intl.formatMessage({ id: 'text.masking_policy_confirmed' }),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, confirmationMessage]);
      onClose();
      setPendingPolicy(null);
      
      // Call the callback to refresh policies if provided
      onPolicyCreated?.();
    } catch (error) {
      console.error('Error creating masking policy:', error);
      showError({
        description: error instanceof Error ? error.message : intl.formatMessage({ id: 'text.error_creating_policy' })
      });
    }
  };

  // Helper functions for renderFormattedContent to reduce complexity
  const createListElement = (items: string[], elementsLength: number) => (
    <VStack key={`list-${elementsLength}`} align="start" spacing={1} pl={4}>
      {items.map((item, index) => (
        <Text key={`list-item-${elementsLength}-${item.slice(0, 10)}-${index}`} mb={0}>• {item.trim()}</Text>
      ))}
    </VStack>
  );

  const createCodeBlock = (content: string[], elementsLength: number) => (
    <Box
      key={`code-${elementsLength}`}
      bg={themeColors.sectionGrayBg}
      p={3}
      borderRadius="md"
      border="1px"
      borderColor={themeColors.sectionGrayBorder}
      fontFamily="mono"
      fontSize="sm"
    >
      {content.map((line, index) => (
        <Text key={`code-line-${elementsLength}-${line.slice(0, 20).replace(/\s/g, '')}-${index}`} mb={0}>{line}</Text>
      ))}
    </Box>
  );

  const createHeader = (text: string, index: number) => (
    <Text key={`header-${text.slice(0, 15).replace(/\s/g, '')}-${index}`} fontWeight="bold" fontSize="md" mb={0} color="blue.600">
      {text}
    </Text>
  );

  const createEmphasis = (text: string, index: number) => (
    <Text key={`emphasis-${text.slice(0, 15).replace(/\s/g, '')}-${index}`} fontWeight="medium" mb={0}>
      {text}
    </Text>
  );

  const createSpacer = (index: number) => <Box key={`spacer-${index}`} h={2} />;

  const getSectionColors = (sectionTitle: string) => {
    if (sectionTitle.includes('understood')) {
      return { bg: themeColors.sectionGreenBg, border: themeColors.sectionGreenBorder };
    }
    if (sectionTitle.includes('Fields')) {
      return { bg: themeColors.sectionBlueBg, border: themeColors.sectionBlueBorder };
    }
    if (sectionTitle.includes('strategy')) {
      return { bg: themeColors.sectionPurpleBg, border: themeColors.sectionPurpleBorder };
    }
    if (sectionTitle.includes('Try') || sectionTitle.includes('Suggestions')) {
      return { bg: themeColors.sectionYellowBg, border: themeColors.sectionYellowBorder };
    }
    return { bg: themeColors.sectionGrayBg, border: themeColors.sectionGrayBorder };
  };

  const createSpecialSection = (sectionTitle: string, sectionContent: string, index: number) => {
    const colors = getSectionColors(sectionTitle);
    return (
      <Box key={`section-${sectionTitle.replace(/\s/g, '')}-${index}`} bg={colors.bg} p={3} borderRadius="md" border="1px" borderColor={colors.border}>
        <Text fontWeight="medium" mb={1}>{sectionTitle}:</Text>
        {sectionContent && (
          <Text fontSize="sm" mb={0}>{sectionContent}</Text>
        )}
      </Box>
    );
  };

  const isSpecialSection = (line: string): boolean => {
    const specialPrefixes = [
      'What I understood:',
      'Fields I found:',
      'Recommended strategy:',
      'Try saying:',
      'Suggestions:'
    ];
    return specialPrefixes.some(prefix => line.startsWith(prefix));
  };

  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(createListElement(currentList, elements.length));
        currentList = [];
      }
    };

    const flushCodeBlock = () => {
      if (codeBlockContent.length > 0) {
        elements.push(createCodeBlock(codeBlockContent, elements.length));
        codeBlockContent = [];
      }
    };

    const processLine = (line: string, index: number) => {
      const trimmedLine = line.trim();

      // Handle code blocks
      if (trimmedLine.startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock();
          inCodeBlock = false;
        } else {
          flushList();
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Handle headers
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        flushList();
        const headerText = trimmedLine.slice(2, -2);
        elements.push(createHeader(headerText, index));
        return;
      }

      // Handle emphasis
      if (trimmedLine.startsWith('*') && trimmedLine.endsWith('*')) {
        flushList();
        const emphasisText = trimmedLine.slice(1, -1);
        elements.push(createEmphasis(emphasisText, index));
        return;
      }

      // Handle bullet points
      if (trimmedLine.startsWith('•')) {
        currentList.push(trimmedLine.slice(1));
        return;
      }

      // Handle numbered lists
      const numberedListRegex = /^\d{1,3}\./;
      if (numberedListRegex.exec(trimmedLine)) {
        currentList.push(trimmedLine.replace(/^\d{1,3}\.\s*/, ''));
        return;
      }

      // Handle empty lines
      if (trimmedLine === '') {
        flushList();
        elements.push(createSpacer(index));
        return;
      }

      // Handle special sections
      if (isSpecialSection(trimmedLine)) {
        flushList();
        const sectionTitle = trimmedLine.split(':')[0];
        const sectionContent = trimmedLine.split(':').slice(1).join(':').trim();
        elements.push(createSpecialSection(sectionTitle, sectionContent, index));
        return;
      }

      // Handle regular text
      flushList();
      elements.push(
        <Text key={`text-${trimmedLine.slice(0, 20).replace(/\s/g, '')}-${index}`} mb={0}>
          {trimmedLine}
        </Text>
      );
    };

    lines.forEach((line, index) => {
      processLine(line, index);
    });

    // Flush any remaining content
    flushList();
    flushCodeBlock();

    return (
      <VStack align="start" spacing={0}>
        {elements}
      </VStack>
    );
  };

  const renderMessage = (message: Message) => {
    const getMessageStyle = () => {
      switch (message.type) {
        case 'user':
          return {
            alignSelf: 'flex-end' as const,
            bg: userMessageBg,
            sender: intl.formatMessage({ id: 'text.you' })
          };
        case 'system':
          return {
            alignSelf: 'center' as const,
            bg: systemMessageBg,
            sender: intl.formatMessage({ id: 'text.system' })
          };
        case 'error':
          return {
            alignSelf: 'center' as const,
            bg: errorMessageBg,
            sender: intl.formatMessage({ id: 'text.error' })
          };
        default:
          // Same as 'ai' case - default to AI assistant behavior
          return {
            alignSelf: 'flex-start' as const,
            bg: aiMessageBg,
            sender: intl.formatMessage({ id: 'text.ai_assistant' })
          };
      }
    };

    const style = getMessageStyle();

    return (
      <Box
        key={message.id}
        alignSelf={style.alignSelf}
        maxW={message.type === 'system' || message.type === 'error' ? '90%' : '70%'}
        mb={4}
      >
        <Box
          bg={style.bg}
          p={4}
          borderRadius="lg"
          border="1px"
          borderColor={borderColor}
        >
          <Text fontSize="sm" color="gray.500" mb={0}>
            {style.sender}
          </Text>
          {renderFormattedContent(message.content)}

          {message.suggestions && message.suggestions.length > 0 && (
            <Box mt={4}>
              <Text fontWeight="bold" mb={0}>
                <FormattedMessage id="text.detected_fields" />
              </Text>

              {/* Show first 12 suggestions in a grid */}
              <Box
                display="grid"
                gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))"
                gap={3}
                mt={3}
              >
                {message.suggestions.map((suggestion: MaskingSuggestion) => (
                  <Flex
                    key={suggestion.id}
                    justify="space-between"
                    align="center"
                    p={3}
                    bg={themeColors.cardBg}
                    borderRadius="md"
                    border="1px"
                    onClick={() => { handleSuggestionToggle(suggestion.id) }}
                    cursor={'pointer'}
                    borderColor={themeColors.cardBorder}
                    _hover={{
                      bg: themeColors.cardHoverBg,
                      borderColor: themeColors.cardHoverBorder,
                    }}
                  >
                    <Box flex={1}>
                      <Text
                        fontWeight="medium"
                        mb={1}
                        color={themeColors.textPrimary}
                        fontSize="sm"
                      >
                        {suggestion.fieldName}
                      </Text>
                      <Text
                        fontSize="xs"
                        color={themeColors.textSecondary}
                        mb={1}
                      >
                        {suggestion.tableName}
                      </Text>
                    </Box>
                    <Flex flex={1} flexDirection="column" alignItems="flex-end">
                      <Checkbox
                        ml={2}
                        isChecked={suggestion.isSelected}
                        onChange={() => handleSuggestionToggle(suggestion.id)}
                      />
                    </Flex>
                  </Flex>
                ))}
              </Box>

              <Button
                mt={3}
                colorScheme="blue"
                size="sm"
                onClick={() => handleApplyMasking(message.id)}
                leftIcon={<FiShield />}
              >
                <FormattedMessage id="text.apply_masking" />
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box h="600px" border="1px" w='full' borderColor={borderColor} borderRadius="lg" bg={bgColor}>
      <ChatHeader
        assets={assets}
        selectedAsset={selectedAsset}
        onAssetChange={handleAssetChange}
        currentSessionId={currentSessionId}
        isSessionLoading={isSessionLoading}
        onRefreshSession={refreshSession}
        borderColor={borderColor}
        selectBg={selectBg}
        intl={intl}
      />

      <ChatMessagesArea
        messagesContainerRef={messagesContainerRef}
        messages={messages}
        renderMessage={renderMessage}
        isLoading={isLoading}
        aiMessageBg={aiMessageBg}
        borderColor={borderColor}
        intl={intl}
      />

      <ChatInputArea
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSendMessage={handleSendMessage}
        onSendSuggestion={sendSuggestion}
        selectedAsset={selectedAsset}
        currentSessionId={currentSessionId}
        isSessionLoading={isSessionLoading}
        isLoading={isLoading}
        borderColor={borderColor}
        quickSuggestionColors={quickSuggestionColors}
        intl={intl}
      />

      <PolicyConfirmationModal
        isOpen={isOpen}
        onClose={onClose}
        pendingPolicy={pendingPolicy}
        roleOptions={roleOptions}
        roles={roles}
        onPolicyChange={setPendingPolicy}
        onRoleChange={handleRoleChange}
        onConfirmPolicy={handleConfirmPolicy}
        intl={intl}
      />
    </Box>
  );
} 