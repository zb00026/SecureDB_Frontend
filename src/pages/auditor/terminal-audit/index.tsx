import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Text,
  Select,
  Input,
  VStack,
  HStack,
  Badge,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardBody,
  Heading,
  IconButton,
  Tooltip,
  useDisclosure,
  FormControl,
  FormLabel,
  useBreakpointValue
} from '@chakra-ui/react';
import { ViewIcon, SearchIcon } from '@chakra-ui/icons';
import { FormattedMessage, useIntl } from 'react-intl';
import { useTerminalAudit } from '@common/hooks/useTerminalAudit';
import { TerminalSessionRecording } from '@models/TerminalSessionRecording';
import { TerminalCommandAudit } from '@models/TerminalCommandAudit';
import { DamTable } from '@common/components/DamTable';
import { DatePicker } from '@common/components/DamDatePicker';
import { DamBasePage } from '@common/components/DamBasePage';
import { TerminalSessionModal } from './components/TerminalSessionModal';
import { TerminalCommandViewer } from './components/TerminalCommandViewer';
import { formatDateTime, getRiskLevelColor, getCommandTypeColor } from './utils/terminalAuditUtils';

export const isSearchable = true;
export const displayName = 'Terminal Audit Logs';

export const Component: React.FC = () => {
  const intl = useIntl();
  const {
    sessions,
    commands,
    statistics,
    error,
    sessionsPagination,
    commandsPagination,
    viewMode,
    setViewMode,
    filters,
    fetchStatistics,
    handleSearch,
    handleFilterChange
  } = useTerminalAudit();

  // Responsive layout: horizontal on lg+, vertical on smaller screens
  const isHorizontal = useBreakpointValue({ base: false, lg: true });

  const [selectedSession, setSelectedSession] = useState<TerminalSessionRecording | null>(null);
  const [selectedCommand, setSelectedCommand] = useState<TerminalCommandAudit | null>(null);

  const { isOpen: isSessionModalOpen, onOpen: onSessionModalOpen, onClose: onSessionModalClose } = useDisclosure();
  const { isOpen: isCommandModalOpen, onOpen: onCommandModalOpen, onClose: onCommandModalClose } = useDisclosure();

  useEffect(() => {
    fetchStatistics();
  }, []);

  const handleViewSession = (session: TerminalSessionRecording) => {
    setSelectedSession(session);
    onSessionModalOpen();
  };

  const handleViewCommand = (command: TerminalCommandAudit) => {
    setSelectedCommand(command);
    onCommandModalOpen();
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const sessionsColumns = [
    {
      key: 'sessionId',
      title: intl.formatMessage({ id: 'terminal.audit.sessionId' }),
      dataIndex: 'sessionId',
      render: (text: any, session: TerminalSessionRecording) => (
        <Text fontFamily="mono" fontSize="sm" mb={0}>
          {session.sessionId.substring(0, 8)}...
        </Text>
      )
    },
    {
      key: 'asset',
      title: intl.formatMessage({ id: 'terminal.audit.asset' }),
      dataIndex: 'asset',
      render: (text: any, session: TerminalSessionRecording) => (
        <VStack align="start" spacing={1}>
          <Text fontWeight="medium" mb={0}>
            {session.asset?.name || `Asset #${session.asset?.id || 'Unknown'}`}
          </Text>
          <Text fontSize="sm" color="gray.500" mb={0}>
            {session.asset?.hostAddress || 'Unknown'}:{session.asset?.portNumber || 'Unknown'}
          </Text>
        </VStack>
      )
    },
    {
      key: 'user',
      title: intl.formatMessage({ id: 'terminal.audit.user' }),
      dataIndex: 'user',
      render: (text: any, session: TerminalSessionRecording) => (
        <VStack align="start" spacing={1}>
          <Text fontWeight="medium" mb={0}>
            {session.user.firstName} {session.user.lastName}
          </Text>
          <Text fontSize="sm" color="gray.500" mb={0}>
            {session.user.email}
          </Text>
        </VStack>
      )
    },
    {
      key: 'sessionStart',
      title: intl.formatMessage({ id: 'terminal.audit.sessionStart' }),
      dataIndex: 'sessionStart',
      render: (text: any, session: TerminalSessionRecording) => (
        <Text fontSize="sm" mb={0}>{formatDateTime(session.sessionStart)}</Text>
      )
    },
    {
      key: 'duration',
      title: intl.formatMessage({ id: 'terminal.audit.duration' }),
      dataIndex: 'durationSeconds',
      render: (text: any, session: TerminalSessionRecording) => (
        <Text fontSize="sm" mb={0}>{formatDuration(session.durationSeconds)}</Text>
      )
    },
    {
      key: 'commandCount',
      title: intl.formatMessage({ id: 'terminal.audit.commandCount' }),
      dataIndex: 'commandCount',
      render: (text: any, session: TerminalSessionRecording) => (
        <Badge colorScheme="blue" variant="subtle">
          {session.commandCount}
        </Badge>
      )
    },
    {
      key: 'status',
      title: intl.formatMessage({ id: 'terminal.audit.status' }),
      dataIndex: 'isActive',
      render: (text: any, session: TerminalSessionRecording) => (
        <Badge colorScheme={session.isActive ? 'green' : 'gray'} variant="subtle">
          {session.isActive ? 'Active' : 'Ended'}
        </Badge>
      )
    },
    {
      key: 'actions',
      title: intl.formatMessage({ id: 'common.actions' }),
      dataIndex: 'actions',
      render: (text: any, session: TerminalSessionRecording) => (
        <Tooltip label={intl.formatMessage({ id: 'terminal.audit.viewSession' })}>
          <IconButton
            aria-label={intl.formatMessage({ id: 'terminal.audit.viewSession' })}
            icon={<ViewIcon />}
            size="sm"
            variant="ghost"
            onClick={() => handleViewSession(session)}
          />
        </Tooltip>
      )
    }
  ];

  const commandsColumns = [
    {
      key: 'sessionId',
      title: intl.formatMessage({ id: 'terminal.audit.sessionId' }),
      dataIndex: 'sessionId',
      render: (text: any, command: TerminalCommandAudit) => (
        <Text fontFamily="mono" fontSize="sm" mb={0}>
          {command.sessionId.substring(0, 8)}...
        </Text>
      )
    },
    {
      key: 'asset',
      title: intl.formatMessage({ id: 'terminal.audit.asset' }),
      dataIndex: 'asset',
      render: (text: any, command: TerminalCommandAudit) => (
        <Text fontWeight="medium" mb={0}>
          {command.sessionRecording?.asset?.name || `Asset #${command.sessionRecording?.asset?.id || 'Unknown'}`}
        </Text>
      )
    },
    {
      key: 'user',
      title: intl.formatMessage({ id: 'terminal.audit.user' }),
      dataIndex: 'user',
      render: (text: any, command: TerminalCommandAudit) => (
        <Text fontSize="sm" mb={0}>{command.sessionRecording.user.email}</Text>
      )
    },
    {
      key: 'command',
      title: intl.formatMessage({ id: 'terminal.audit.command' }),
      dataIndex: 'parsedCommand',
      render: (text: any, command: TerminalCommandAudit) => (
        <Text fontFamily="mono" fontSize="sm" maxW="200px" isTruncated mb={0}>
          {command.parsedCommand}
        </Text>
      )
    },
    {
      key: 'type',
      title: intl.formatMessage({ id: 'terminal.audit.commandType' }),
      dataIndex: 'commandType',
      render: (text: any, command: TerminalCommandAudit) => (
        <Badge colorScheme={getCommandTypeColor(command.commandType)} variant="subtle">
          {command.commandType}
        </Badge>
      )
    },
    {
      key: 'risk',
      title: intl.formatMessage({ id: 'terminal.audit.riskLevel' }),
      dataIndex: 'riskLevel',
      render: (text: any, command: TerminalCommandAudit) => (
        <Badge colorScheme={getRiskLevelColor(command.riskLevel)} variant="subtle">
          {command.riskLevel}
        </Badge>
      )
    },
    {
      key: 'dangerous',
      title: intl.formatMessage({ id: 'terminal.audit.dangerous' }),
      dataIndex: 'isDangerous',
      render: (text: any, command: TerminalCommandAudit) => (
        <Badge colorScheme={command.isDangerous ? 'red' : 'gray'} variant="subtle">
          {command.isDangerous ? 'Yes' : 'No'}
        </Badge>
      )
    },
    {
      key: 'executedAt',
      title: intl.formatMessage({ id: 'terminal.audit.executedAt' }),
      dataIndex: 'executedAt',
      render: (text: any, command: TerminalCommandAudit) => (
        <Text fontSize="sm" mb={0}>{formatDateTime(command.executedAt)}</Text>
      )
    },
    {
      key: 'actions',
      title: intl.formatMessage({ id: 'common.actions' }),
      dataIndex: 'actions',
      render: (text: any, command: TerminalCommandAudit) => (
        <Tooltip label={intl.formatMessage({ id: 'terminal.audit.viewCommand' })}>
          <IconButton
            aria-label={intl.formatMessage({ id: 'terminal.audit.viewCommand' })}
            icon={<ViewIcon />}
            size="sm"
            variant="ghost"
            onClick={() => handleViewCommand(command)}
          />
        </Tooltip>
      )
    }
  ];

  return (
    <DamBasePage title={intl.formatMessage({ id: 'terminal.audit.title' })}>
      <Box>
        {/* Header */}
        <Flex justify="space-between" align="center" mb={6}>
          <VStack align="start" spacing={1}>
            <Heading size="lg">
              <FormattedMessage id="terminal.audit.title" />
            </Heading>
            <Text color="gray.500" mb={0}>
              <FormattedMessage id="terminal.audit.subtitle" />
            </Text>
          </VStack>
        </Flex>

        {/* Statistics Dashboard */}
        {statistics && (
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
            <GridItem>
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>
                      <FormattedMessage id="terminal.audit.activeSessions" />
                    </StatLabel>
                    <StatNumber color="green.500">{statistics.activeSessions}</StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      Currently active
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
            <GridItem>
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>
                      <FormattedMessage id="terminal.audit.sessionsToday" />
                    </StatLabel>
                    <StatNumber color="blue.500">{statistics.sessionsToday}</StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      Today
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
            <GridItem>
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>
                      <FormattedMessage id="terminal.audit.dangerousCommandsToday" />
                    </StatLabel>
                    <StatNumber color="red.500">{statistics.dangerousCommandsToday}</StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      High risk
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
            <GridItem>
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>
                      <FormattedMessage id="terminal.audit.commandsToday" />
                    </StatLabel>
                    <StatNumber color="purple.500">{statistics.commandsToday}</StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      Total today
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
        )}

        {/* Filters and View Mode */}
        <Box mb={6} mt={4}>
          <Flex gap={4} align={isHorizontal ? "center" : "stretch"} direction={isHorizontal ? "row" : "column"} wrap={isHorizontal ? "nowrap" : "wrap"} mb={4}>
            <HStack>
              <Text fontWeight="medium" mb={0}>
                <FormattedMessage id="terminal.audit.viewMode" />:
              </Text>
              <Select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'sessions' | 'commands')}
                w="150px"
              >
                <option value="sessions">
                  <FormattedMessage id="terminal.audit.sessions" />
                </option>
                <option value="commands">
                  <FormattedMessage id="terminal.audit.commands" />
                </option>
              </Select>
            </HStack>
            {isHorizontal ? (
              <>
                <FormControl>
                  <HStack spacing={3} align="center">
                    <FormLabel mb={0} minW="80px">
                      <FormattedMessage id="terminal.audit.startDate" />
                    </FormLabel>
                    <DatePicker
                      placeholder=""
                      value={filters.startDate}
                      onChange={(date: string | null) => handleFilterChange('startDate', date || undefined)}
                    />
                  </HStack>
                </FormControl>
                <FormControl>
                  <HStack spacing={3} align="center">
                    <FormLabel mb={0} minW="70px">
                      <FormattedMessage id="terminal.audit.endDate" />
                    </FormLabel>
                    <DatePicker
                      placeholder=""
                      value={filters.endDate}
                      onChange={(date: string | null) => handleFilterChange('endDate', date || undefined)}
                    />
                  </HStack>
                </FormControl>
              </>
            ) : (
              <VStack gap={4} align="stretch" w="full">
                <FormControl>
                  <FormLabel mb={1}>
                    <FormattedMessage id="terminal.audit.startDate" />
                  </FormLabel>
                  <DatePicker
                    placeholder=""
                    value={filters.startDate}
                    onChange={(date: string | null) => handleFilterChange('startDate', date || undefined)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel mb={1}>
                    <FormattedMessage id="terminal.audit.endDate" />
                  </FormLabel>
                  <DatePicker
                    placeholder=""
                    value={filters.endDate}
                    onChange={(date: string | null) => handleFilterChange('endDate', date || undefined)}
                  />
                </FormControl>
              </VStack>
            )}
            {viewMode === 'commands' && (
              <>
                <HStack>
                  <Text fontWeight="medium" mb={0}>
                    <FormattedMessage id="terminal.audit.riskLevel" />:
                  </Text>
                  <Select
                    value={filters.riskLevel || ''}
                    onChange={(e) => handleFilterChange('riskLevel', e.target.value || undefined)}
                    w="120px"
                  >
                    <option value="">All</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </Select>
                </HStack>

                <HStack>
                  <Text fontWeight="medium" mb={0}>
                    <FormattedMessage id="terminal.audit.dangerous" />:
                  </Text>
                  <Select
                    value={filters.isDangerous === undefined ? '' : filters.isDangerous.toString()}
                    onChange={(e) => handleFilterChange('isDangerous', e.target.value === '' ? undefined : e.target.value === 'true')}
                    w="100px"
                  >
                    <option value="">All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </Select>
                </HStack>
              </>
            )}

            {isHorizontal ? (
              <FormControl>
                <HStack spacing={3} align="center">
                  <FormLabel mb={0} minW="80px">
                    <FormattedMessage id="terminal.audit.search" />
                  </FormLabel>
                  <HStack>
                    <Input
                      value={filters.searchQuery || ''}
                      onChange={(e) => handleFilterChange('searchQuery', e.target.value || undefined)}
                      w="200px"
                    />
                    <IconButton
                      aria-label={intl.formatMessage({ id: 'common.search' })}
                      icon={<SearchIcon />}
                      onClick={handleSearch}
                    />
                  </HStack>
                </HStack>
              </FormControl>
            ) : (
              <FormControl w="full">
                <FormLabel mb={1}>
                  <FormattedMessage id="terminal.audit.search" />
                </FormLabel>
                <HStack>
                  <Input
                    value={filters.searchQuery || ''}
                    onChange={(e) => handleFilterChange('searchQuery', e.target.value || undefined)}
                    w="200px"
                  />
                  <IconButton
                    aria-label={intl.formatMessage({ id: 'common.search' })}
                    icon={<SearchIcon />}
                    onClick={handleSearch}
                  />
                </HStack>
              </FormControl>
            )}
          </Flex>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* Data Table */}
        <DamTable
          id={`tableTerminalAudit${viewMode}`}
          columns={viewMode === 'sessions' ? sessionsColumns : commandsColumns}
          dataSource={viewMode === 'sessions' ? sessions : commands}
          pagination={viewMode === 'sessions' ? sessionsPagination : commandsPagination}
          rowKey="id"
        />

        {/* Modals */}
        {selectedSession && (
          <TerminalSessionModal
            isOpen={isSessionModalOpen}
            onClose={onSessionModalClose}
            session={selectedSession}
          />
        )}

        {selectedCommand && (
          <TerminalCommandViewer
            isOpen={isCommandModalOpen}
            onClose={onCommandModalClose}
            command={selectedCommand}
          />
        )}
      </Box>
    </DamBasePage>
  );
};
