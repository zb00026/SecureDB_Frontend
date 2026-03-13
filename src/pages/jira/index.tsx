import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  VStack,
  Text,
  Button,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  Badge,
} from '@chakra-ui/react';
import { DamBasePage } from '@common/components/DamBasePage';
import { useDamToast } from '@common/index';
import { jiraApi } from '@/services/jiraApi';
import { JiraAccessConfig } from '@models/JiraModels';
import { JiraConfigDialog } from '@common/components/DamDialog/JiraConfigDialog';
import { useIntl, FormattedMessage } from 'react-intl';
import { useSearchParams } from 'react-router-dom';
import { FiSettings, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';

export const isSearchable = true;
export const displayName = 'Jira Integration';

export function Component() {
  const intl = useIntl();
  const { showError, showSuccess } = useDamToast();
  const [searchParams] = useSearchParams();
  
  // Get issueKey and issueId from URL params (for Jira app integration)
  const issueKey = searchParams.get('issueKey') || '';
  const issueId = searchParams.get('issueId') || '';
  const userEmail = searchParams.get('userEmail') || '';

  const [config, setConfig] = useState<JiraAccessConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);

  // Load configuration if issueKey is provided
  useEffect(() => {
    if (issueKey) {
      loadConfig();
    }
  }, [issueKey]);

  const loadConfig = async () => {
    try {
      setIsLoadingConfig(true);
      const configData = await jiraApi.getAccessConfig(issueKey);
      setConfig(configData);
    } catch (error: any) {
      // 404 means no config exists yet, which is fine
      if (error?.response?.status !== 404) {
        console.error('Failed to load configuration:', error);
        showError({
          description:
            error?.response?.data?.error ||
            error?.message ||
            'Failed to load configuration',
        });
      }
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const handleConfigSaved = (damRequestId: number) => {
    showSuccess({
      description: intl.formatMessage({ id: 'text.access_config_saved' }),
    });
    // Reload config to show updated status
    if (issueKey) {
      loadConfig();
    }
  };

  const getAlertStatus = (
    status: string
  ): 'success' | 'error' | 'warning' | 'info' => {
    if (status === 'APPROVED') return 'success';
    if (status === 'REJECTED') return 'error';
    if (status === 'EXPIRED') return 'warning';
    return 'info';
  };

  const renderConfigStatusSection = () => {
    if (isLoadingConfig) {
      return (
        <Flex justify="center" p={8}>
          <Spinner size="lg" />
        </Flex>
      );
    }
    if (config) {
      return (
        <VStack spacing={4} align="stretch">
          <Alert status={getAlertStatus(config.status)}>
            <AlertIcon />
            <Box flex="1">
              <AlertDescription>
                <Flex direction="column" gap={2}>
                  <Flex align="center" gap={2}>
                    <Text fontWeight="semibold">
                      <FormattedMessage id="text.current_status" />:
                    </Text>
                    {getStatusBadge(config.status)}
                  </Flex>
                  <Text fontSize="sm">
                    <FormattedMessage id="text.asset_information" />:{' '}
                    {config.assetName}
                  </Text>
                  {config.expiryDate && (
                    <Text fontSize="sm">
                      <FormattedMessage id="text.expiry_date" />:{' '}
                      {new Date(config.expiryDate).toLocaleDateString()}
                    </Text>
                  )}
                </Flex>
              </AlertDescription>
            </Box>
          </Alert>

          {!config.isLocked && (
            <Button
              leftIcon={<FiSettings />}
              onClick={() => setIsConfigDialogOpen(true)}
              colorScheme="blue"
            >
              <FormattedMessage id="text.configure_access" />
            </Button>
          )}
        </VStack>
      );
    }
    return (
      <VStack spacing={4} align="stretch">
        <Alert status="info">
          <AlertIcon />
          <AlertDescription>
            No access configuration found. Click the button below to configure
            access for this Jira issue.
          </AlertDescription>
        </Alert>
        <Button
          leftIcon={<FiSettings />}
          onClick={() => setIsConfigDialogOpen(true)}
          colorScheme="blue"
        >
          <FormattedMessage id="text.configure_access" />
        </Button>
      </VStack>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge colorScheme="green" display="flex" alignItems="center" gap={1}>
            <FiCheckCircle />
            <FormattedMessage id="text.access_approved" />
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge colorScheme="red" display="flex" alignItems="center" gap={1}>
            <FiXCircle />
            <FormattedMessage id="text.access_rejected" />
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge colorScheme="orange" display="flex" alignItems="center" gap={1}>
            <FiClock />
            <FormattedMessage id="text.access_expired" />
          </Badge>
        );
      case 'REQUESTED':
      default:
        return (
          <Badge colorScheme="blue" display="flex" alignItems="center" gap={1}>
            <FiClock />
            <FormattedMessage id="text.access_requested" />
          </Badge>
        );
    }
  };

  if (!issueKey) {
    return (
      <DamBasePage title={intl.formatMessage({ id: 'text.jira_integration' })}>
        <Box p={6}>
          <Alert status="info">
            <AlertIcon />
            <AlertDescription>
              This page is intended to be accessed from a Jira issue. Please
              open this page from a Jira ticket.
            </AlertDescription>
          </Alert>
        </Box>
      </DamBasePage>
    );
  }

  return (
    <DamBasePage title={intl.formatMessage({ id: 'text.jira_integration' })}>
      <Box p={6}>
        <VStack spacing={6} align="stretch">
          {/* Issue Info */}
          <Box>
            <Text fontSize="lg" fontWeight="semibold" mb={2}>
              <FormattedMessage id="text.jira_issue_key" />: {issueKey}
            </Text>
            {config?.damRequestId && (
              <Text fontSize="sm" color="gray.600">
                <FormattedMessage id="text.dam_request_id" />:{' '}
                {config.damRequestId}
              </Text>
            )}
          </Box>

          {/* Configuration Status */}
          {renderConfigStatusSection()}
        </VStack>
      </Box>

      {/* Configuration Dialog */}
      <JiraConfigDialog
        isOpen={isConfigDialogOpen}
        onClose={() => setIsConfigDialogOpen(false)}
        issueKey={issueKey}
        issueId={issueId}
        userEmail={userEmail}
        onSuccess={handleConfigSaved}
        existingConfig={
          config
            ? {
                assetId: config.assetId,
                tables: '', // Tables not returned in config response
                accessLevel: 'READ_ONLY', // Default, not returned in config
                durationDays: 90, // Default, not returned in config
                businessJustification: '', // Not returned in config
                isLocked: config.isLocked,
              }
            : undefined
        }
      />
    </DamBasePage>
  );
}
