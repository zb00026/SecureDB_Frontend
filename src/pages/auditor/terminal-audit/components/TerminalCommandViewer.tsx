import React from 'react';
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
  Box,
  Flex,
  useColorModeValue,
  Code,
  IconButton,
  Tooltip,
  Divider,
  Grid,
  GridItem
} from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';
import { FormattedMessage, useIntl } from 'react-intl';
import { TerminalCommandAudit } from '@models/TerminalCommandAudit';
import { formatDateTime, getRiskLevelColor, getCommandTypeColor } from '../utils/terminalAuditUtils';

interface TerminalCommandViewerProps {
  isOpen: boolean;
  onClose: () => void;
  command: TerminalCommandAudit;
}

export const TerminalCommandViewer: React.FC<TerminalCommandViewerProps> = ({
  isOpen,
  onClose,
  command
}) => {
  const intl = useIntl();
  const codeBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getCommandTypeDescription = (commandType: string) => {
    const descriptions: Record<string, string> = {
      'file_operation': 'File and directory operations (ls, cd, cp, mv, rm, etc.)',
      'process_management': 'Process control and monitoring (ps, top, kill, etc.)',
      'network': 'Network operations (ping, wget, curl, netstat, etc.)',
      'security': 'Security-related commands (sudo, su, passwd, chmod, etc.)',
      'system_admin': 'System administration (systemctl, mount, fdisk, etc.)',
      'text_processing': 'Text manipulation (cat, grep, awk, sed, etc.)',
      'editor': 'Text editors (vi, vim, nano, emacs, etc.)',
      'other': 'Other commands not categorized above'
    };
    return descriptions[commandType] || 'Unknown command type';
  };

  const getRiskLevelDescription = (riskLevel: string) => {
    const descriptions: Record<string, string> = {
      'LOW': 'Low risk - Basic informational commands with minimal system impact',
      'MEDIUM': 'Medium risk - Commands that may affect system state or access sensitive data',
      'HIGH': 'High risk - Potentially dangerous commands that could cause system damage',
      'CRITICAL': 'Critical risk - Extremely dangerous commands that pose immediate threat'
    };
    return descriptions[riskLevel] || 'Unknown risk level';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" motionPreset="none">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          <VStack align="start" spacing={1}>
            <Text fontSize="lg" fontWeight="bold" mb={0}>
              <FormattedMessage id="terminal.audit.commandDetails" />
            </Text>
            <Text fontSize="sm" color="gray.500" fontFamily="mono" mb={0}>
              Session: {command.sessionId.substring(0, 12)}...
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            {/* Command Header */}
            <Box>
              <Flex justify="space-between" align="center" mb={4}>
                <HStack spacing={2}>
                  <Badge colorScheme="blue" variant="subtle" fontSize="sm">
                    #{command.commandSequence}
                  </Badge>
                  <Badge colorScheme={getCommandTypeColor(command.commandType)} variant="subtle">
                    {command.commandType}
                  </Badge>
                  <Badge colorScheme={getRiskLevelColor(command.riskLevel)} variant="subtle">
                    {command.riskLevel}
                  </Badge>
                  {command.isDangerous && (
                    <Badge colorScheme="red" variant="solid">
                      DANGEROUS
                    </Badge>
                  )}
                </HStack>
                <Text fontSize="sm" color="gray.500" mb={0}>
                  {formatDateTime(command.executedAt)}
                </Text>
              </Flex>

              <Code p={3} bg={codeBg} borderRadius="md" fontSize="md" display="block" fontFamily="mono">
                {command.parsedCommand}
              </Code>
            </Box>

            <Divider />

            {/* Command Information */}
            <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
              <GridItem>
                <VStack align="start" spacing={2}>
                  <Text fontWeight="medium" color="gray.600" mb={0}>
                    <FormattedMessage id="terminal.audit.asset" />
                  </Text>
                  <Text mb={0}>
                    {command.sessionRecording?.asset?.name || `Asset #${command.sessionRecording?.asset?.id || 'Unknown'}`}
                  </Text>
                  <Text fontSize="sm" color="gray.500" mb={0}>
                    {command.sessionRecording.hostAddress}:{command.sessionRecording.portNumber}
                  </Text>
                </VStack>
              </GridItem>
              <GridItem>
                <VStack align="start" spacing={2}>
                  <Text fontWeight="medium" color="gray.600" mb={0}>
                    <FormattedMessage id="terminal.audit.user" />
                  </Text>
                  <Text mb={0}>{command.sessionRecording.user.firstName} {command.sessionRecording.user.lastName}</Text>
                  <Text fontSize="sm" color="gray.500" mb={0}>
                    {command.sessionRecording.user.email}
                  </Text>
                </VStack>
              </GridItem>
              <GridItem>
                <VStack align="start" spacing={2}>
                  <Text fontWeight="medium" color="gray.600" mb={0}>
                    <FormattedMessage id="terminal.audit.sshUser" />
                  </Text>
                  <Text fontFamily="mono" mb={0}>{command.username}</Text>
                </VStack>
              </GridItem>
              <GridItem>
                <VStack align="start" spacing={2}>
                  <Text fontWeight="medium" color="gray.600" mb={0}>
                    <FormattedMessage id="terminal.audit.executionTime" />
                  </Text>
                  <Text mb={0}>{command.executionTimeMs || 'N/A'}ms</Text>
                </VStack>
              </GridItem>
              {command.clientIp && (
                <GridItem>
                  <VStack align="start" spacing={2}>
                    <Text fontWeight="medium" color="gray.600" mb={0}>
                      <FormattedMessage id="terminal.audit.clientIp" />
                    </Text>
                    <Text fontFamily="mono" mb={0}>{command.clientIp}</Text>
                  </VStack>
                </GridItem>
              )}
            </Grid>

            <Divider />

            {/* Risk Analysis */}
            <Box>
              <Text fontWeight="bold" mb={3}>
                <FormattedMessage id="terminal.audit.riskAnalysis" />
              </Text>
              <VStack align="stretch" spacing={3}>
                <Box p={3} border="1px solid" borderColor={borderColor} borderRadius="md">
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Badge colorScheme={getRiskLevelColor(command.riskLevel)} variant="subtle">
                        {command.riskLevel}
                      </Badge>
                      {command.isDangerous && (
                        <Badge colorScheme="red" variant="solid">
                          DANGEROUS
                        </Badge>
                      )}
                    </HStack>
                    <Text fontSize="sm" color="gray.600" mb={0}>
                      {getRiskLevelDescription(command.riskLevel)}
                    </Text>
                  </VStack>
                </Box>
                <Box p={3} border="1px solid" borderColor={borderColor} borderRadius="md">
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Badge colorScheme={getCommandTypeColor(command.commandType)} variant="subtle">
                        {command.commandType}
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.600" mb={0}>
                      {getCommandTypeDescription(command.commandType)}
                    </Text>
                  </VStack>
                </Box>
              </VStack>
            </Box>

            <Divider />

            {/* Raw Input */}
            <Box>
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontWeight="medium" mb={0}>
                  <FormattedMessage id="terminal.audit.rawInput" />
                </Text>
                <Tooltip label={intl.formatMessage({ id: 'common.copy' })}>
                  <IconButton
                    aria-label={intl.formatMessage({ id: 'common.copy' })}
                    icon={<CopyIcon />}
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(command.rawInput)}
                  />
                </Tooltip>
              </Flex>
              <Code p={3} bg={codeBg} borderRadius="md" fontSize="sm" display="block" fontFamily="mono">
                {command.rawInput}
              </Code>
            </Box>

            {/* Command Output */}
            {command.commandOutput && (
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
                      onClick={() => copyToClipboard(command.commandOutput)}
                    />
                  </Tooltip>
                </Flex>
                <Box
                  bg={codeBg}
                  p={3}
                  borderRadius="md"
                  fontSize="sm"
                  maxH="400px"
                  overflowY="auto"
                  whiteSpace="pre-wrap"
                  fontFamily="mono"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  {command.commandOutput}
                </Box>
              </Box>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
