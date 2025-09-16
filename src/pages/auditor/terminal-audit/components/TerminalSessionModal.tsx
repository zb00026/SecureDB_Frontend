import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  Box,
  Flex,
  useColorModeValue,
  Alert,
  AlertIcon,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Code,
  IconButton,
  Tooltip,
  Grid
} from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';
import { FormattedMessage, useIntl } from 'react-intl';
import { TerminalSessionRecording } from '@models/TerminalSessionRecording';
import { TerminalCommandAudit } from '@models/TerminalCommandAudit';
import { useTerminalAudit } from '@common/hooks/useTerminalAudit';
import { formatDateTime } from '../utils/terminalAuditUtils';
import { CommandBadges } from './CommandBadges';

interface TerminalSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: TerminalSessionRecording;
}

export const TerminalSessionModal: React.FC<TerminalSessionModalProps> = ({
  isOpen,
  onClose,
  session
}) => {
  const intl = useIntl();
  const { fetchSessionCommands, error } = useTerminalAudit();
  const [commands, setCommands] = useState<TerminalCommandAudit[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<TerminalCommandAudit | null>(null);
  const [loading, setLoading] = useState(false);

  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const codeBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    if (isOpen && session) {
      setLoading(true);
      fetchSessionCommands(session.sessionId)
        .then(setCommands)
        .finally(() => setLoading(false));
    }
  }, [isOpen, session]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderSessionLog = () => {
    if (!session.fullSessionLog) {
      return (
        <Alert status="info">
          <AlertIcon />
          <FormattedMessage id="terminal.audit.noSessionLog" />
        </Alert>
      );
    }

    return (
      <Box
        bg={codeBg}
        p={4}
        borderRadius="md"
        maxH="400px"
        overflowY="auto"
        fontFamily="mono"
        fontSize="sm"
        whiteSpace="pre-wrap"
      >
        {session.fullSessionLog}
      </Box>
    );
  };

  const renderCommandsList = () => {
    if (loading) {
      return (
        <Flex justify="center" py={8}>
          <Spinner />
        </Flex>
      );
    }

    if (error) {
      return (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      );
    }

    if (commands.length === 0) {
      return (
        <Alert status="info">
          <AlertIcon />
          <FormattedMessage id="terminal.audit.noCommands" />
        </Alert>
      );
    }

    return (
      <VStack spacing={3} align="stretch" maxH="400px" overflowY="auto">
        {commands.map((command) => (
          <Box
            key={command.id}
            p={3}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="md"
            cursor="pointer"
            _hover={{ bg: hoverBg }}
            onClick={() => setSelectedCommand(command)}
          >
            <VStack align="stretch" spacing={2}>
              <CommandBadges command={command} />
              
              <Code p={2} bg={codeBg} borderRadius="md" fontSize="sm">
                {command.parsedCommand}
              </Code>
              
              {command.commandOutput && (
                <Box
                  bg={codeBg}
                  p={2}
                  borderRadius="md"
                  fontSize="xs"
                  maxH="100px"
                  overflowY="auto"
                  whiteSpace="pre-wrap"
                >
                  {command.commandOutput.substring(0, 200)}
                  {command.commandOutput.length > 200 && '...'}
                </Box>
              )}
            </VStack>
          </Box>
        ))}
      </VStack>
    );
  };

  const renderCommandDetails = () => {
    if (!selectedCommand) {
      return (
        <Alert status="info">
          <AlertIcon />
          <FormattedMessage id="terminal.audit.selectCommand" />
        </Alert>
      );
    }

    return (
      <VStack spacing={4} align="stretch">
        <CommandBadges command={selectedCommand} />

        <VStack align="stretch" spacing={3}>
          <Box>
            <Text fontWeight="medium" mb={2}>
              <FormattedMessage id="terminal.audit.rawInput" />
            </Text>
            <Code p={3} bg={codeBg} borderRadius="md" fontSize="sm" display="block">
              {selectedCommand.rawInput}
            </Code>
          </Box>

          <Box>
            <Text fontWeight="medium" mb={2}>
              <FormattedMessage id="terminal.audit.parsedCommand" />
            </Text>
            <Code p={3} bg={codeBg} borderRadius="md" fontSize="sm" display="block">
              {selectedCommand.parsedCommand}
            </Code>
          </Box>

          {selectedCommand.commandOutput && (
            <Box>
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontWeight="medium" mb={0}>
                  <FormattedMessage id="terminal.audit.commandOutput" />
                </Text>
                <Tooltip label={intl.formatMessage({ id: 'common.copy' })}>
                  <IconButton
                    aria-label={intl.formatMessage({ id: 'common.copy' })}
                    icon={<CopyIcon />}
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(selectedCommand.commandOutput)}
                  />
                </Tooltip>
              </Flex>
              <Box
                bg={codeBg}
                p={3}
                borderRadius="md"
                fontSize="sm"
                maxH="300px"
                overflowY="auto"
                whiteSpace="pre-wrap"
                fontFamily="mono"
              >
                {selectedCommand.commandOutput}
              </Box>
            </Box>
          )}

          <HStack spacing={4} fontSize="sm" color="gray.500">
            <Text mb={0}>
              <FormattedMessage id="terminal.audit.executionTime" />: {selectedCommand.executionTimeMs || 'N/A'}ms
            </Text>
            {selectedCommand.clientIp && (
              <Text mb={0}>
                <FormattedMessage id="terminal.audit.clientIp" />: {selectedCommand.clientIp}
              </Text>
            )}
          </HStack>
        </VStack>
      </VStack>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" motionPreset="none">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          <VStack align="start" spacing={1}>
            <Text fontSize="lg" fontWeight="bold" mb={0}>
              <FormattedMessage id="terminal.audit.sessionDetails" />
            </Text>
            <Text fontSize="sm" color="gray.500" fontFamily="mono" mb={0}>
              {session.sessionId}
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            {/* Session Info */}
            <Box>
              <Text fontWeight="bold" mb={3}>
                <FormattedMessage id="terminal.audit.sessionInfo" />
              </Text>
              <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="gray.500" mb={0}>
                    <FormattedMessage id="terminal.audit.asset" />
                  </Text>
                  <Text fontWeight="medium" mb={0}>
                    {session.asset?.name || `Asset #${session.asset?.id || 'Unknown'}`}
                  </Text>
                  <Text fontSize="sm" color="gray.500" mb={0}>
                    {session.asset?.hostAddress || 'Unknown'}:{session.asset?.portNumber || 'Unknown'}
                  </Text>
                </VStack>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="gray.500" mb={0}>
                    <FormattedMessage id="terminal.audit.user" />
                  </Text>
                  <Text fontWeight="medium" mb={0}>
                    {session.user.firstName} {session.user.lastName}
                  </Text>
                  <Text fontSize="sm" color="gray.500" mb={0}>
                    {session.user.email}
                  </Text>
                </VStack>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="gray.500" mb={0}>
                    <FormattedMessage id="terminal.audit.sessionStart" />
                  </Text>
                  <Text mb={0}>{formatDateTime(session.sessionStart)}</Text>
                </VStack>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="gray.500" mb={0}>
                    <FormattedMessage id="terminal.audit.duration" />
                  </Text>
                  <Text mb={0}>{formatDuration(session.durationSeconds)}</Text>
                </VStack>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="gray.500" mb={0}>
                    <FormattedMessage id="terminal.audit.commandCount" />
                  </Text>
                  <Badge colorScheme="blue" variant="subtle">
                    {session.commandCount}
                  </Badge>
                </VStack>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="gray.500" mb={0}>
                    <FormattedMessage id="terminal.audit.status" />
                  </Text>
                  <Badge colorScheme={session.isActive ? 'green' : 'gray'} variant="subtle">
                    {session.isActive ? 'Active' : 'Ended'}
                  </Badge>
                </VStack>
              </Grid>
            </Box>

            <Divider />

            {/* Tabs for Session Log and Commands */}
            <Tabs>
              <TabList>
                <Tab>
                  <FormattedMessage id="terminal.audit.sessionLog" />
                </Tab>
                <Tab>
                  <FormattedMessage id="terminal.audit.commands" />
                </Tab>
                {selectedCommand && (
                  <Tab>
                    <FormattedMessage id="terminal.audit.commandDetails" />
                  </Tab>
                )}
              </TabList>

              <TabPanels>
                <TabPanel px={0}>
                  {renderSessionLog()}
                </TabPanel>
                <TabPanel px={0}>
                  {renderCommandsList()}
                </TabPanel>
                {selectedCommand && (
                  <TabPanel px={0}>
                    {renderCommandDetails()}
                  </TabPanel>
                )}
              </TabPanels>
            </Tabs>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
