import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
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

export interface MaskingPoliciesRef {
  readonly refreshPolicies: () => void;
}

export const MaskingPolicies = forwardRef<MaskingPoliciesRef>((props, ref) => {
  const intl = useIntl();
  const { showSuccess, showError } = useDamToast();
  const [policies, setPolicies] = useState<MaskingPolicy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<MaskingPolicy | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.800');
  // Define colors at component level to avoid hook usage in callbacks
  const roleTagBg = useColorModeValue('blue.50', 'blue.900');
  const roleTagBorder = useColorModeValue('blue.200', 'blue.700');

  useEffect(() => {
    fetchPolicies();
  }, []);

  // Expose refresh function to parent components
  useImperativeHandle(ref, () => ({
    refreshPolicies: fetchPolicies
  }), []);

  const fetchPolicies = async () => {
    try {
      const response = await request('/api/asset_owner/masking-policies', {});
      setPolicies(response.policies || []);
    } catch (error) {
      console.error('Error fetching policies:', error);
      showError({
        description: error instanceof Error ? error.message : intl.formatMessage({ id: 'text.error_fetching_policies' })
      });
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
      
      fetchPolicies();
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
      
      fetchPolicies();
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

  const totalPolicies = policies.length;
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

        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>
                  <FormattedMessage id="text.asset_name" />
                </Th>
                <Th>
                  <FormattedMessage id="text.database_name" />
                </Th>
                <Th>
                  <FormattedMessage id="text.field_name" />
                </Th>
                <Th>
                  <FormattedMessage id="text.table_name" />
                </Th>
                <Th>
                  <FormattedMessage id="text.strategy" />
                </Th>
                <Th>
                  <FormattedMessage id="text.affected_roles" />
                </Th>
                <Th>
                  <FormattedMessage id="text.status" />
                </Th>
                <Th>
                  <FormattedMessage id="text.created" />
                </Th>
                <Th textAlign="center">
                  <FormattedMessage id="text.actions" />
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {policies.length > 0 ? (
                policies.map((policy) => (
                  <Tr key={policy.id}>
                    <Td fontWeight="medium">{policy.asset.name}</Td>
                    <Td>
                      <HStack>
                        <FiDatabase size={14} />
                        <Text mb={0}>{policy.asset.databaseName}</Text>
                      </HStack>
                    </Td>
                    <Td fontWeight="medium">{policy.fieldName}</Td>
                    <Td>
                      <HStack>
                        <FiDatabase size={14} />
                        <Text mb={0}>{policy.tableName}</Text>
                      </HStack>
                    </Td>
                    <Td>
                      <Flex direction="column" align="start">
                        {getStrategyLabel(policy.maskingStrategy).split('(').map((part, index) => (
                          <Text 
                            key={`strategy-part-${policy.id}-${part.slice(0, 10).replace(/\s/g, '')}-${index}`} 
                            fontSize={index === 0 ? "sm" : "xs"} 
                            fontWeight={index === 0 ? "medium" : "normal"}
                            color={index === 0 ? "inherit" : "gray.500"}
                            mb={0}
                          >
                            {index === 0 ? part.trim() : `(${part.trim()}`}
                          </Text>
                        ))}
                      </Flex>
                    </Td>
                    <Td maxW="200px">
                      <VStack spacing={1} align="start">
                        {policy.roles && policy.roles.length > 0 ? (
                          <>
                            {policy.roles.slice(0, 3).map((role, index) => (
                              <Text 
                                key={`role-${policy.id}-${role}-${index}`} 
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
                            {policy.roles.length > 3 && (
                              <Text fontSize="xs" color="gray.500" mb={0}>
                                +{policy.roles.length - 3} more
                              </Text>
                            )}
                          </>
                        ) : (
                          <Text fontSize="xs" color="gray.500" mb={0}>
                            No roles assigned
                          </Text>
                        )}
                      </VStack>
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(policy.isActive)} display="flex" alignItems="center" gap={1}>
                        
                        {getStatusLabel(policy.isActive)}
                      </Badge>
                    </Td>
                    <Td>
                      <Text fontSize="sm" color="gray.500" mb={0}>
                        {new Date(policy.createdAt).toLocaleDateString()}
                      </Text>
                    </Td>
                    <Td>
                      <HStack spacing={2} justify="center">
                        <Tooltip label={intl.formatMessage({ id: 'text.view_policy_details' })}>
                          <IconButton
                            size="sm"
                            colorScheme="blue"
                            variant="ghost"
                            icon={<FiEye />}
                            aria-label="View policy"
                            onClick={() => {
                              setSelectedPolicy(policy);
                              onOpen();
                            }}
                          />
                        </Tooltip>
                        
                        <Tooltip label={intl.formatMessage({ 
                          id: policy.isActive === true ? 'text.deactivate_policy' : 'text.activate_policy' 
                        })}>
                          <IconButton
                            size="sm"
                            colorScheme={policy.isActive === true ? 'orange' : 'green'}
                            variant="ghost"
                            icon={policy.isActive === true ? <FiPause /> : <FiPlay />}
                            aria-label="Toggle policy"
                            onClick={() => handleTogglePolicy(
                              policy.id, 
                              !policy.isActive
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
                            onClick={() => handleDeletePolicy(policy.id)}
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={9} textAlign="center" py={8}>
                    <VStack spacing={2}>
                      <FiShield size={48} color="gray" />
                      <Text color="gray.500" mb={0}>
                        <FormattedMessage id="text.no_masking_policies" />
                      </Text>
                      <Text fontSize="sm" color="gray.400" mb={0}>
                        <FormattedMessage id="text.create_first_policy" />
                      </Text>
                    </VStack>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>
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
                            key={`modal-strategy-part-${selectedPolicy.id}-${part.slice(0, 10).replace(/\s/g, '')}-${index}`} 
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