import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  IconButton,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tooltip,
} from '@chakra-ui/react';
import { FiEye, FiTrash2, FiShield, FiDatabase, FiPlay, FiPause, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { FormattedMessage, useIntl } from 'react-intl';
import { request, useDamToast } from '@common/index';
import { MaskingPolicy } from '@models/MaskingPolicy';
import { DamTable } from '@common/components/DamTable';

export interface MaskingPoliciesRef {
  readonly refreshPolicies: () => void;
}

export const MaskingPolicies = forwardRef<MaskingPoliciesRef>((props, ref) => {
  const intl = useIntl();
  const { showSuccess, showError } = useDamToast();
  const [policies, setPolicies] = useState<MaskingPolicy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<MaskingPolicy | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [paginationMeta, setPaginationMeta] = useState({
    total: 0,
    current_page: 1,
    per_page: 20
  });
  const [loading, setLoading] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  // Define colors at component level to avoid hook usage in callbacks
  const roleTagBg = useColorModeValue('blue.50', 'blue.900');
  const roleTagBorder = useColorModeValue('blue.200', 'blue.700');

  useEffect(() => {
    fetchPolicies(1, 20);
  }, []);

  // Expose refresh function to parent components
  useImperativeHandle(ref, () => ({
    refreshPolicies: () => fetchPolicies(paginationMeta.current_page, paginationMeta.per_page)
  }), [paginationMeta.current_page, paginationMeta.per_page]);

  const fetchPolicies = async (page: number = 1, perPage: number = 20) => {
    setLoading(true);
    try {
      // Build query string for pagination
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(page - 1)); // Backend might use 0-based indexing
      queryParams.append('size', String(perPage));
      const queryString = queryParams.toString();
      const base = "/api/asset_owner/masking-policies";
      const url = queryString ? `${base}?${queryString}` : base;
      
      const response = await request(url, {
        method: 'GET'
      });
      
      // Handle both paginated and non-paginated responses
      if (response.content) {
        // Paginated response (Spring Boot Page format)
        setPolicies(response.content || []);
        setPaginationMeta({
          total: response.totalElements || response.total || 0,
          current_page: (response.number || 0) + 1,
          per_page: response.size || perPage
        });
      } else if (response.policies) {
        // Non-paginated response (fallback)
        setPolicies(response.policies || []);
        setPaginationMeta({
          total: response.policies.length,
          current_page: 1,
          per_page: perPage
        });
      } else {
        // Array response (fallback)
        const policiesArray = Array.isArray(response) ? response : [];
        setPolicies(policiesArray);
        setPaginationMeta({
          total: policiesArray.length,
          current_page: 1,
          per_page: perPage
        });
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      showError({
        description: error instanceof Error ? error.message : intl.formatMessage({ id: 'text.error_fetching_policies' })
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    try {
      await request(`/api/asset_owner/masking-policies/${policyId}`, {
        method: 'DELETE'
      });
      
      showSuccess({
        description: intl.formatMessage({ id: 'text.policy_deleted_success' })
      });
      
      fetchPolicies(paginationMeta.current_page, paginationMeta.per_page);
    } catch (error) {
      console.error('Error deleting policy:', error);
      showError({
        description: error instanceof Error ? error.message : intl.formatMessage({ id: 'text.error_deleting_policy' })
      });
    }
  };

  const handleTogglePolicy = async (policyId: string, newStatus: boolean) => {
    try {
      await request(`/api/asset_owner/masking-policies/${policyId}/status`, {
        method: 'PUT',
        data: { isActive: newStatus }
      });
      
      showSuccess({
        description: intl.formatMessage({ id: 'text.policy_status_updated' })
      });
      
      fetchPolicies(paginationMeta.current_page, paginationMeta.per_page);
    } catch (error) {
      console.error('Error updating policy status:', error);
      showError({
        description: error instanceof Error ? error.message : intl.formatMessage({ id: 'text.error_updating_policy_status' })
      });
    }
  };

  const getStatusColor = (status: boolean) => {
    switch (status) {
      case true: return 'green';
      case false: return 'gray';
      default: return 'gray';
    }
  };

  const getStrategyLabel = (strategy: string) => {
    switch (strategy) {
      case 'partial': return intl.formatMessage({ id: 'text.partial_masking' });
      case 'full': return intl.formatMessage({ id: 'text.full_masking' });
      case 'hash': return intl.formatMessage({ id: 'text.hash_masking' });
      default: return strategy;
    }
  };


  const getStatusLabel = (status: boolean) => {
    switch (status) {
      case true: return intl.formatMessage({ id: 'text.active' });
      case false: return intl.formatMessage({ id: 'text.inactive' });
    }
  };

  const getStatusIcon = (status: boolean) => {
    if (status === true) {
      return <FiCheckCircle size={12} />;
    }
    if (status === false) {
      return <FiXCircle size={12} />;
    }
    return <FiPause size={12} />;
  };

  const handlePaginationChange = (page: number, pageSize: number) => {
    fetchPolicies(page, pageSize);
  };

  // Calculate statistics from all policies (may need to fetch separately if paginated)
  const totalPolicies = paginationMeta.total;
  const activePolicies = policies.filter(p => p.isActive === true).length;

  return (
    <Box w='full'>
      {/* Statistics */}
      <VStack spacing={4} mb={2} borderBottom="1px solid" borderColor="gray.200">
        <HStack spacing={8} w="full" justify="center">
          <Stat textAlign="center">
            <StatLabel>
              <FormattedMessage id="text.total_policies" />
            </StatLabel>
            <StatNumber>{totalPolicies}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              <FormattedMessage id="text.policies_created" />
            </StatHelpText>
          </Stat>
          
          <Stat textAlign="center">
            <StatLabel>
              <FormattedMessage id="text.active_policies" />
            </StatLabel>
            <StatNumber>{activePolicies}</StatNumber>
            <StatHelpText>
              <FormattedMessage id="text.currently_enforced" />
            </StatHelpText>
          </Stat>
          
          <Stat textAlign="center">
            <StatLabel>
              <FormattedMessage id="text.protected_fields" />
            </StatLabel>
            <StatNumber>{activePolicies}</StatNumber>
            <StatHelpText>
              <FormattedMessage id="text.fields_masked" />
            </StatHelpText>
          </Stat>
        </HStack>
      </VStack>

      {/* Policies Table */}
      <Box bg={bgColor}>
        <DamTable
          columns={[
            {
              title: intl.formatMessage({ id: 'text.asset_name' }),
              dataIndex: 'asset',
              key: 'asset_name',
              render: (_: any, record: MaskingPolicy) => (
                <Text fontWeight="medium" mb={0}>{record.asset.name}</Text>
              )
            },
            {
              title: intl.formatMessage({ id: 'text.database_name' }),
              dataIndex: 'asset',
              key: 'database_name',
              render: (_: any, record: MaskingPolicy) => (
                <HStack>
                  <FiDatabase size={14} />
                  <Text mb={0}>{record.asset.databaseName}</Text>
                </HStack>
              )
            },
            {
              title: intl.formatMessage({ id: 'text.field_name' }),
              dataIndex: 'fieldName',
              key: 'field_name',
              render: (text: string) => (
                <Text fontWeight="medium" mb={0}>{text}</Text>
              )
            },
            {
              title: intl.formatMessage({ id: 'text.table_name' }),
              dataIndex: 'tableName',
              key: 'table_name',
              render: (text: string, record: MaskingPolicy) => (
                <HStack>
                  <FiDatabase size={14} />
                  <Text mb={0}>{text}</Text>
                </HStack>
              )
            },
            {
              title: intl.formatMessage({ id: 'text.strategy' }),
              dataIndex: 'maskingStrategy',
              key: 'strategy',
              render: (strategy: string, record: MaskingPolicy) => (
                <Flex direction="column" align="start">
                  {getStrategyLabel(strategy).split('(').map((part, index) => (
                    <Text 
                      key={`strategy-part-${record.id}-${part.slice(0, 10).replaceAll(/\s/g, '')}-${index}`} 
                      fontSize={index === 0 ? "sm" : "xs"} 
                      fontWeight={index === 0 ? "medium" : "normal"}
                      color={index === 0 ? "inherit" : "gray.500"}
                      mb={0}
                    >
                      {index === 0 ? part.trim() : `(${part.trim()}`}
                    </Text>
                  ))}
                </Flex>
              )
            },
            {
              title: intl.formatMessage({ id: 'text.affected_roles' }),
              dataIndex: 'roles',
              key: 'affected_roles',
              render: (roles: string[] | undefined, record: MaskingPolicy) => (
                <Box maxW="200px">
                  <VStack spacing={1} align="start">
                    {roles && roles.length > 0 ? (
                      <>
                        {roles.slice(0, 3).map((role, index) => (
                          <Text 
                            key={`role-${record.id}-${role}-${index}`} 
                            fontSize="xs" 
                            bg={roleTagBg} 
                            px={2} 
                            py={1} 
                            borderRadius="sm"
                            mb={0}
                          >
                            {role}
                          </Text>
                        ))}
                        {roles.length > 3 && (
                          <Text fontSize="xs" color="gray.500" mb={0}>
                            +{roles.length - 3} more
                          </Text>
                        )}
                      </>
                    ) : (
                      <Text fontSize="xs" color="gray.500" mb={0}>
                        No roles assigned
                      </Text>
                    )}
                  </VStack>
                </Box>
              )
            },
            {
              title: intl.formatMessage({ id: 'text.status' }),
              dataIndex: 'isActive',
              key: 'status',
              render: (isActive: boolean) => (
                <Badge colorScheme={getStatusColor(isActive)} display="flex" alignItems="center" gap={1}>
                  {getStatusLabel(isActive)}
                </Badge>
              )
            },
            {
              title: intl.formatMessage({ id: 'text.created' }),
              dataIndex: 'createdAt',
              key: 'created',
              render: (createdAt: string) => (
                <Text fontSize="sm" color="gray.500" mb={0}>
                  {new Date(createdAt).toLocaleDateString()}
                </Text>
              )
            },
            {
              title: intl.formatMessage({ id: 'text.actions' }),
              dataIndex: 'id',
              key: 'actions',
              render: (_: string, record: MaskingPolicy) => (
                <HStack spacing={2} justify="center">
                  <Tooltip label={intl.formatMessage({ id: 'text.view_policy_details' })}>
                    <IconButton
                      size="sm"
                      colorScheme="blue"
                      variant="ghost"
                      icon={<FiEye />}
                      aria-label="View policy"
                      onClick={() => {
                        setSelectedPolicy(record);
                        onOpen();
                      }}
                    />
                  </Tooltip>
                  
                  <Tooltip label={intl.formatMessage({ 
                    id: record.isActive === true ? 'text.deactivate_policy' : 'text.activate_policy' 
                  })}>
                    <IconButton
                      size="sm"
                      colorScheme={record.isActive === true ? 'orange' : 'green'}
                      variant="ghost"
                      icon={record.isActive === true ? <FiPause /> : <FiPlay />}
                      aria-label="Toggle policy"
                      onClick={() => handleTogglePolicy(
                        record.id, 
                        !record.isActive
                      )}
                    />
                  </Tooltip>
                  
                  <Tooltip label={intl.formatMessage({ id: 'text.delete_policy' })}>
                    <IconButton
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      icon={<FiTrash2 />}
                      aria-label="Delete policy"
                      onClick={() => handleDeletePolicy(record.id)}
                    />
                  </Tooltip>
                </HStack>
              )
            }
          ]}
          dataSource={policies}
          rowKey="id"
          loading={loading}
          pagination={{
            meta: paginationMeta,
            onChange: handlePaginationChange
          }}
          selectable={false}
        />
      </Box>

      {/* Policy Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id="text.policy_details" />
          </ModalHeader>
          <ModalBody>
            {selectedPolicy && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold" mb={0}>
                    <FormattedMessage id="text.asset_information" />
                  </Text>
                  <HStack spacing={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={0}>
                        <FormattedMessage id="text.asset_name" />
                      </Text>
                      <Text fontWeight="medium" mb={0}>{selectedPolicy.asset.name}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={0}>
                        <FormattedMessage id="text.database_name" />
                      </Text>
                      <Text fontWeight="medium" mb={0}>{selectedPolicy.asset.databaseName}</Text>
                    </Box>
                  </HStack>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={0}>
                    <FormattedMessage id="text.field_information" />
                  </Text>
                  <HStack spacing={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={0}>
                        <FormattedMessage id="text.field_name" />
                      </Text>
                      <Text fontWeight="medium" mb={0}>{selectedPolicy.fieldName}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={0}>
                        <FormattedMessage id="text.table_name" />
                      </Text>
                      <Text fontWeight="medium" mb={0}>{selectedPolicy.tableName}</Text>
                    </Box>
                  </HStack>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={0}>
                    <FormattedMessage id="text.masking_configuration" />
                  </Text>
                  <HStack spacing={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={0}>
                        <FormattedMessage id="text.strategy" />
                      </Text>
                      <Flex direction="column" align="start">
                        {getStrategyLabel(selectedPolicy.maskingStrategy).split('(').map((part, index) => (
                          <Text 
                            key={`modal-strategy-part-${selectedPolicy.id}-${part.slice(0, 10).replaceAll(/\s/g, '')}-${index}`} 
                            fontSize={index === 0 ? "md" : "sm"} 
                            fontWeight={index === 0 ? "medium" : "normal"}
                            color={index === 0 ? "inherit" : "gray.500"}
                            mb={0}
                          >
                            {index === 0 ? part.trim() : `(${part.trim()}`}
                          </Text>
                        ))}
                      </Flex>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={0}>
                        <FormattedMessage id="text.status" />
                      </Text>
                      <Badge colorScheme={getStatusColor(selectedPolicy.isActive)} display="flex" alignItems="center" gap={1}>
                        {getStatusIcon(selectedPolicy.isActive)}
                        {getStatusLabel(selectedPolicy.isActive)}
                      </Badge>
                    </Box>
                  </HStack>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={0}>
                    <FormattedMessage id="text.affected_roles" />
                  </Text>
                  {selectedPolicy.roles && selectedPolicy.roles.length > 0 ? (
                    <VStack spacing={2} align="stretch">
                      {selectedPolicy.roles.map((role, index) => (
                        <Text 
                          key={`modal-role-${selectedPolicy.id}-${role}-${index}`} 
                          fontSize="sm" 
                          p={2} 
                          bg={roleTagBg} 
                          borderRadius="md" 
                          border="1px solid" 
                          borderColor={roleTagBorder}
                          mb={0}
                        >
                          • {role}
                        </Text>
                      ))}
                    </VStack>
                  ) : (
                    <Text fontSize="sm" color="gray.500" fontStyle="italic" mb={0}>
                      No roles assigned to this policy
                    </Text>
                  )}
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={0}>
                    <FormattedMessage id="text.description" />
                  </Text>
                  <Text mb={0}>{selectedPolicy.description}</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={0}>
                    <FormattedMessage id="text.policy_information" />
                  </Text>
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={0}>
                      <FormattedMessage id="text.created" />
                    </Text>
                    <Text fontWeight="medium" mb={0}>
                      {new Date(selectedPolicy.createdAt).toLocaleString()}
                    </Text>
                  </Box>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>
              <FormattedMessage id="text.close" />
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}); 