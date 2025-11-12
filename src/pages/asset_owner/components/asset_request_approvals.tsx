import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  VStack,
  Text,
  TableContainer,
  useColorModeValue,
  Badge,
  Checkbox,
  Flex
} from "@chakra-ui/react";

import { FormattedMessage, useIntl } from "react-intl";
import { DamCard, DamCardBody, DamCardDivider, DamRejectDialog, request, useDamToast, ActionMenu, ActionMenuItem } from "@common/index";
import { useState, useEffect, useMemo } from "react";
import { AccessRequest } from "@models/assets/AccessRequest";
import { format } from 'date-fns';
import { useApiRequest } from "@common/hooks/useApiRequest";
import { UnixAccessApprovalDialog } from "@common/components/DamDialog/UnixAccessApprovalDialog";
import { useNavigate } from "react-router";
import { handleRowClick, handleCheckboxClick } from "@common/libs/utils/tableSelection";

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'APPROVED':
      return 'green.500';
    case 'REJECTED':
      return 'red.500';
    case 'EXPIRED':
      return 'yellow.500';
    case 'REQUESTED':
      return 'orange.500';
    case 'APPROVAL_IN_PROGRESS':
      return 'blue.500';
    case 'RELINQUISHED_AFTER_APPROVED':
    case 'RELINQUISHED_BEFORE_APPROVAL':
      return 'gray.500';
    default:
      return 'gray.500';
  }
};

export function AssetRequestApprovals() {
  const navigate = useNavigate();
  const [assetRequestApprovals, setAssetRequestApprovals] = useState<AccessRequest[]>([]);
  const { showSuccess, showError } = useDamToast();
  const intl = useIntl();
  const [isAccessRejectDlgOpen, setIsAccessRejectDlgOpen] = useState(false);
  const [isUnixApprovalDialogOpen, setIsUnixApprovalDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const { handleRequest } = useApiRequest();
  const selectedRowBg = useColorModeValue('gray.200', 'gray.700');
  const gray600 = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = () => {
    request('/api/asset_owner/assets/approvals', {})
      .then((res) => {
        if (res.length > 0) {
          setAssetRequestApprovals(res);
        } else {
          setAssetRequestApprovals([]);
        }
      })
      .catch((e) => {
        showError({
          description: intl.formatMessage({ id: 'text.error_occurred_get_asset_credentials' }),
        });
      });
  };


  const handleReject = async (rejectReason: string) => {
    if (!selectedRequest?.id) {
      return;
    }
    setIsAccessRejectDlgOpen(false);
    handleRequest(`/api/asset_owner/assets/request/${selectedRequest.id}/reject`, 'POST', { rejectReason },
      {
        onSuccess: () => {
          showSuccess({
            description: intl.formatMessage({ id: 'text.access_request_rejected' }),
          });
          setSelectedRowKeys([]);
          setSelectedRequest(null);
          fetchApprovals();
        },
        errorDescriptionId: 'text.failed_to_reject_access_request'
      }
    );
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss');
  };

  const handleViewRequest = (request: AccessRequest) => {
    setSelectedRequest(request);
    
    // Check if it's a Unix access request
    if (request.assetApprovalsDTO.type === 'UNIX_SERVER' && request.requestedUsername) {
      setIsUnixApprovalDialogOpen(true);
    } else {
      // For database requests, redirect to approval page
      navigate(`/asset_owner/access_request_details?accessRequestId=${request.id}&assetId=${request.assetApprovalsDTO.id}`);
    }
  };

  const handleUnixApprovalSuccess = () => {
    setIsUnixApprovalDialogOpen(false);
    setSelectedRequest(null);
    fetchApprovals();
  };

  const selectedRows = useMemo(() => {
    return assetRequestApprovals.filter(request => request.id && selectedRowKeys.includes(String(request.id)));
  }, [assetRequestApprovals, selectedRowKeys]);

  const selectAll = () => {
    setSelectedRowKeys(assetRequestApprovals.filter(request => request.id).map(request => String(request.id)));
  };

  const deselectAll = () => {
    setSelectedRowKeys([]);
  };

  // Wrapper functions for request IDs
  const handleRequestRowClick = (requestId: number) => {
    handleRowClick(String(requestId), selectedRowKeys, setSelectedRowKeys);
  };

  const handleRequestCheckboxClick = (requestId: number, checked: boolean) => {
    handleCheckboxClick(String(requestId), checked, selectedRowKeys, setSelectedRowKeys);
  };

  const isAllSelected = assetRequestApprovals.length > 0 && selectedRowKeys.length === assetRequestApprovals.length;
  const isIndeterminate = selectedRowKeys.length > 0 && selectedRowKeys.length < assetRequestApprovals.length;

  // Build action menu items based on selected rows
  const actionMenuItems: ActionMenuItem[] = useMemo(() => {
    const items: ActionMenuItem[] = [];
    const singleSelected = selectedRows.length === 1;
    const selectedRequestForActions = singleSelected ? selectedRows[0] : null;

    if (!singleSelected || !selectedRequestForActions) {
      return items;
    }

    // View Request
    items.push({
      label: 'View Request',
      onClick: () => handleViewRequest(selectedRequestForActions),
      colorScheme: 'blue',
      variant: 'outline',
    });

    // Reject (only if status is REQUESTED or APPROVAL_IN_PROGRESS)
    if (selectedRequestForActions.assetApproverStatus === 'REQUESTED' || 
        selectedRequestForActions.assetApproverStatus === 'APPROVAL_IN_PROGRESS') {
      items.push({
        label: 'Reject',
        onClick: () => {
          setSelectedRequest(selectedRequestForActions);
          setIsAccessRejectDlgOpen(true);
        },
        colorScheme: 'red',
        variant: 'outline',
      });
    }

    return items;
  }, [selectedRows, handleViewRequest]);

  return (
    <DamCard mt={4} flex={1}>
      <DamCardBody>
        {/* AWS-style Header with Selection Count and Actions */}
        <Flex justify="space-between" align="center" my={2} minH="32px" gap={2} pl={2}>
          <Flex align="center" gap={2} minH="32px">
            <Text fontSize="md" fontWeight="semibold" mb={0} lineHeight="32px">
              <FormattedMessage id='text.asset_request_approvals' />
              {selectedRows.length > 0 && ` (${selectedRows.length} selected)`}
            </Text>
          </Flex>
          <ActionMenu
            items={actionMenuItems}
            hasSelection={selectedRows.length === 1}
            selectedCount={selectedRows.length}
            variant="buttons"
          />
        </Flex>

        <DamCardDivider />

        <TableContainer w='full'>
          <Table variant="simple" mt={4} id="tblRequestApprovals" size="sm">
            <Thead>
              <Tr>
                <Th width="40px">
                  <Checkbox
                    isChecked={isAllSelected}
                    isIndeterminate={isIndeterminate}
                    onChange={(e) => e.target.checked ? selectAll() : deselectAll()}
                  />
                </Th>
                <Th><FormattedMessage id="text.asset_name" /></Th>
                <Th><FormattedMessage id="text.asset_type" /></Th>
                <Th><FormattedMessage id="text.asset_description" /></Th>
                <Th><FormattedMessage id="text.requestor" /></Th>
                <Th><FormattedMessage id="text.email" /></Th>
                <Th><FormattedMessage id="text.request_time" /></Th>
                <Th><FormattedMessage id="text.request_reason" /></Th>
                <Th textAlign="center"><FormattedMessage id="text.status" /></Th>
              </Tr>
            </Thead>
            <Tbody>
              {assetRequestApprovals.length === 0 && (
                <Tr>
                  <Td colSpan={9} textAlign="center">
                    <FormattedMessage id="text.no_asset_request_approvals" />
                  </Td>
                </Tr>
              )}
              {assetRequestApprovals.map((request) => {
                if (!request.id) return null;
                const isRowSelected = selectedRowKeys.includes(String(request.id));
                const isSelectedRequest = request.id === selectedRequest?.id;
                
                // Determine row background style
                let rowBackgroundStyle = {};
                if (isRowSelected) {
                  rowBackgroundStyle = {
                    backgroundColor: 'blue.50 !important',
                    _dark: {
                      backgroundColor: 'blue.900 !important'
                    }
                  };
                } else if (isSelectedRequest) {
                  rowBackgroundStyle = {
                    _light: {
                      backgroundColor: 'gray.200'
                    },
                    _dark: {
                      backgroundColor: 'gray.600'
                    }
                  };
                }

                return (
                  <Tr 
                    key={request.id}
                    sx={{
                      _hover: {
                        backgroundColor: 'gray.100',
                        _dark: {
                          backgroundColor: 'gray.700'
                        }
                      },
                      ...rowBackgroundStyle
                    }}
                    cursor="pointer"
                    onClick={() => {
                      if (request.id) {
                        handleRequestRowClick(request.id);
                      }
                      setSelectedRequest(request);
                    }}
                  >
                    <Td onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        isChecked={isRowSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          request.id && handleRequestCheckboxClick(request.id, e.target.checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Td>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium" mb={0}>{request.assetApprovalsDTO.name}</Text>
                        {request.assetApprovalsDTO.type === 'UNIX_SERVER' && request.assetApprovalsDTO.hostAddress && (
                          <Text fontSize="sm" color={gray600} mb={0}>
                            {request.assetApprovalsDTO.hostAddress}
                          </Text>
                        )}
                      </VStack>
                    </Td>
                    <Td>
                      <Badge colorScheme={request.assetApprovalsDTO.type === 'UNIX_SERVER' ? 'purple' : 'blue'}>
                        {request.assetApprovalsDTO.type === 'UNIX_SERVER' ? 'Unix Server' : 'Database'}
                      </Badge>
                    </Td>
                    <Td>{request.assetApprovalsDTO.description}</Td>
                    <Td>{`${request.requestor.firstName} ${request.requestor.lastName}`}</Td>
                    <Td>{request.requestor.email}</Td>
                    <Td>{formatDate(request.requestTime)}</Td>
                    <Td>{request.requestReason}</Td>
                    <Td textAlign="center">
                      <Text
                        mb={0}
                        color={getStatusColor(request.assetApproverStatus)}
                        fontWeight="semibold"
                      >
                        {request.assetApproverStatus}
                      </Text>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
      </DamCardBody>
      <DamRejectDialog
        isOpen={isAccessRejectDlgOpen}
        onClose={() => setIsAccessRejectDlgOpen(false)}
        onConfirm={handleReject}
        title="text.reject_access_request"
        message="text.are_you_sure_reject_access_request"
        confirmButtonId="btnConfirmRejectAccessRequest"
      />

      {/* Unix Access Approval Dialog */}
      {selectedRequest && (
        <UnixAccessApprovalDialog
          isOpen={isUnixApprovalDialogOpen}
          onClose={() => {
            setIsUnixApprovalDialogOpen(false);
            setSelectedRequest(null);
          }}
          accessRequest={selectedRequest}
          onSuccess={handleUnixApprovalSuccess}
        />
      )}
    </DamCard>
  );
} 