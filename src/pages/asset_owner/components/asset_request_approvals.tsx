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
  Badge
} from "@chakra-ui/react";

import { FormattedMessage, useIntl } from "react-intl";
import { DamCard, DamCardBody, DamCardDivider, DamRejectDialog, request, TextCardHeader, useDamToast } from "@common/index";
import { useState, useEffect } from "react";
import { AccessRequest } from "@models/assets/AccessRequest";
import { format } from 'date-fns';
import { Link } from "react-router-dom";
import { useApiRequest } from "@common/hooks/useApiRequest";
import { UnixAccessApprovalDialog } from "@common/components/DamDialog/UnixAccessApprovalDialog";

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'APPROVED':
      return 'green.500';
    case 'REJECTED':
      return 'red.500';
    case 'PENDING':
      return 'orange.500';
    default:
      return 'gray.500';
  }
};

export function AssetRequestApprovals() {
  const [assetRequestApprovals, setAssetRequestApprovals] = useState<AccessRequest[]>([]);
  const { showSuccess, showError } = useDamToast();
  const intl = useIntl();
  const [isAccessRejectDlgOpen, setIsAccessRejectDlgOpen] = useState(false);
  const [isUnixApprovalDialogOpen, setIsUnixApprovalDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
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
    if (request.assetDTO.type === 'UNIX_SERVER' && request.requestedUsername) {
      setIsUnixApprovalDialogOpen(true);
    } else {
      // For database requests, redirect to approval page
      globalThis.location.href = `/asset_owner/access_request_details?accessRequestId=${request.id}&assetId=${request.assetDTO.id}`;
    }
  };

  const handleUnixApprovalSuccess = () => {
    setIsUnixApprovalDialogOpen(false);
    setSelectedRequest(null);
    fetchApprovals();
  };

  return (
    <DamCard mt={4} flex={1}>
      <DamCardBody>
        <TextCardHeader mb={0} id="lblAssetSetting">
          <FormattedMessage id="text.asset_request_approvals" />
        </TextCardHeader>
        <DamCardDivider />
        <TableContainer w='full'>
          <Table variant="simple" mt={4} id="tblRequestApprovals">
            <Thead>
              <Tr>
                <Th><FormattedMessage id="text.asset_name" /></Th>
                <Th><FormattedMessage id="text.asset_type" /></Th>
                <Th><FormattedMessage id="text.asset_description" /></Th>
                <Th><FormattedMessage id="text.requestor" /></Th>
                <Th><FormattedMessage id="text.email" /></Th>
                <Th><FormattedMessage id="text.request_time" /></Th>
                <Th><FormattedMessage id="text.request_reason" /></Th>
                <Th textAlign="center"><FormattedMessage id="text.status" /></Th>
                <Th textAlign="center"><FormattedMessage id="text.details" /></Th>
                <Th textAlign="center"><FormattedMessage id="text.reject" /></Th>
              </Tr>
            </Thead>
            <Tbody>
              {assetRequestApprovals.length === 0 && (
                <Tr>
                  <Td colSpan={10} textAlign="center">
                    <FormattedMessage id="text.no_asset_request_approvals" />
                  </Td>
                </Tr>
              )}
              {assetRequestApprovals.map((request) => (
                <Tr key={request.id} backgroundColor={request.id === selectedRequest?.id ? selectedRowBg : 'transparent'}>
                  <Td>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium">{request.assetDTO.name}</Text>
                      {request.assetDTO.type === 'UNIX_SERVER' && request.assetDTO.hostAddress && (
                        <Text fontSize="sm" color={gray600}>
                          {request.assetDTO.hostAddress}
                        </Text>
                      )}
                    </VStack>
                  </Td>
                  <Td>
                    <Badge colorScheme={request.assetDTO.type === 'UNIX_SERVER' ? 'purple' : 'blue'}>
                      {request.assetDTO.type === 'UNIX_SERVER' ? 'Unix Server' : 'Database'}
                    </Badge>
                  </Td>
                  <Td>{request.assetDTO.description}</Td>
                  <Td>{`${request.requestor.firstName} ${request.requestor.lastName}`}</Td>
                  <Td>{request.requestor.email}</Td>
                  <Td>{formatDate(request.requestTime)}</Td>
                  <Td>{request.requestReason}</Td>
                  <Td>
                    <VStack align="stretch" spacing={2} alignItems={'center'}>
                      <Text
                        mb={0}
                        color={getStatusColor(request.assetApproverStatus)}
                        fontWeight="semibold"
                      >
                        {request.assetApproverStatus}
                      </Text>
                    </VStack>
                  </Td>
                  <Td textAlign="center">
                    <Button 
                      size="sm" 
                      colorScheme="blue"
                      onClick={() => handleViewRequest(request)}
                    >
                      <FormattedMessage id="text.view_request" />
                    </Button>
                  </Td>
                  <Td textAlign="center">
                    {request.assetApproverStatus === 'PENDING' && (
                      <Button
                        size="sm"
                        colorScheme="red"
                        onClick={() => {
                          setSelectedRequest(request);
                          setIsAccessRejectDlgOpen(true);
                        }}
                      >
                        <FormattedMessage id="text.reject" />
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
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