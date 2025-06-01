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
  HStack
} from "@chakra-ui/react";

import { FormattedMessage, useIntl } from "react-intl";
import { DamCard, DamCardBody, DamCardDivider, request, TextCardHeader, useDamToast } from "@common/index";
import { useState, useEffect } from "react";
import { AccessRequest } from "@models/assets/AccessRequest";
import { format } from 'date-fns';
import { Link } from "react-router-dom";
import { DamAlertDialog } from "@common/components/DamDialog/DamAlertDialog";
import { useApiRequest } from "@common/hooks/useApiRequest";

export function AssetRequestApprovals() {
  const [assetRequestApprovals, setAssetRequestApprovals] = useState<AccessRequest[]>([]);
  const { showSuccess, showError } = useDamToast();
  const intl = useIntl();
  const [isAccessRejectDlgOpen, setIsAccessRejectDlgOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const { handleRequest } = useApiRequest();

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


  const handleReject = async (requestId: number | undefined) => {
    if (!requestId) {
      return;
    }
    setIsAccessRejectDlgOpen(false);
    handleRequest(`/api/asset_owner/assets/request/${requestId}/reject`, 'POST', {},
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

  return (
    <DamCard mt={4} flex={1}>
      <DamCardBody>
        <TextCardHeader mb={0} id="lblAssetSetting">
          <FormattedMessage id="text.asset_request_approvals" />
        </TextCardHeader>
        <DamCardDivider />

        <Table variant="simple" mt={4} id="tblRequestApprovals">
          <Thead>
            <Tr>
              <Th><FormattedMessage id="text.asset_name" /></Th>
              <Th><FormattedMessage id="text.asset_description" /></Th>
              <Th><FormattedMessage id="text.requestor" /></Th>
              <Th><FormattedMessage id="text.email" /></Th>
              <Th><FormattedMessage id="text.request_time" /></Th>
              <Th><FormattedMessage id="text.request_reason" /></Th>
              <Th textAlign="center"><FormattedMessage id="text.status" /></Th>
            </Tr>
          </Thead>
          <Tbody>
            {assetRequestApprovals.map((request) => (
              <Tr key={request.id}>
                <Td>{request.assetDTO.name}</Td>
                <Td>{request.assetDTO.description}</Td>
                <Td>{`${request.requestor.firstName} ${request.requestor.lastName}`}</Td>
                <Td>{request.requestor.email}</Td>
                <Td>{formatDate(request.requestTime)}</Td>
                <Td>{request.requestReason}</Td>
                <Td>
                  <VStack align="stretch" spacing={2} alignItems={'center'}>
                    <Text mb={0}>
                      {request.assetApproverStatus}
                    </Text>
                    {request.assetApproverStatus === 'PENDING' && (
                      <HStack spacing={2}>
                        <Link to={`/asset_owner/access_request_details?accessRequestId=${request.id}&assetId=${request.assetDTO.id}`}>
                          <Button
                            size="sm"
                            colorScheme="green"
                          >
                            <FormattedMessage id="text.approve" />
                          </Button>
                        </Link>

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
                      </HStack>
                    )}
                    {request.assetApproverStatus === 'APPROVED' && (
                      <Link to={`/asset_owner/access_request_details?accessRequestId=${request.id}&assetId=${request.assetDTO.id}`}>
                        <Button
                          size="sm"
                          colorScheme="blue"
                        >
                          <FormattedMessage id="text.details" />
                        </Button>
                      </Link>
                    )}
                  </VStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </DamCardBody>
      <DamAlertDialog
        isOpen={isAccessRejectDlgOpen}
        onClose={() => setIsAccessRejectDlgOpen(false)}
        onConfirm={() => handleReject(selectedRequest?.id)}
        title="text.reject_access_request"
        message="text.are_you_sure_reject_access_request"
        confirmButtonId="btnConfirmRejectAccessRequest"
      />
    </DamCard>
  );
} 