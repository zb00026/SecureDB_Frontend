import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text
} from "@chakra-ui/react";

import { FormattedMessage, useIntl } from "react-intl";
import { DamCard, DamCardBody, DamCardDivider, request, TextCardHeader, useDamToast } from "@common/index";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AssetQueryChangeRequest } from "@models/assets/AssetQueryChangeRequest";
import { ChangeRequestStatus } from "@/constants/enums";

export function ChangeRequests() {
  const [changeRequests, setChangeRequests] = useState<AssetQueryChangeRequest[]>([]);
  const { showError } = useDamToast();
  const intl = useIntl();
  const navigate = useNavigate();

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = () => {
    request('/api/asset_owner/assets/change_requests', {})
      .then((res) => {
        if (res.length > 0) {
          setChangeRequests(res);
        }
      })
      .catch((e) => {
        showError({
          description: intl.formatMessage({ id: 'text.error_occurred_get_asset_credentials' }),
        });
      });
  };

  const handleChangeRequest = (changeRequest: AssetQueryChangeRequest) => {
    navigate(`/asset_owner/change_request_details?changeRequestId=${changeRequest.id}`);
  };

  return (
    <DamCard mt={4} flex={1}>
      <DamCardBody>
        <DamCardDivider />

        <Table variant="simple" mt={4} id="tblChangeRequests">
          <Thead>
            <Tr>
              <Th ><FormattedMessage id="text.asset_name" /></Th>
              <Th><FormattedMessage id="text.change_status" /></Th>
              <Th><FormattedMessage id="text.accessor" /></Th>
              <Th><FormattedMessage id="text.change_description" /></Th>
            </Tr>
          </Thead>
          <Tbody>
            {changeRequests.length === 0 && (
              <Tr>
                <Td colSpan={4} textAlign="center">
                  <FormattedMessage id="text.no_change_requests" />
                </Td>
              </Tr>
            )}
            {changeRequests.map((changeRequest) => (
              <Tr key={changeRequest.id} cursor="pointer" onClick={() => handleChangeRequest(changeRequest)}>
                <Td>{changeRequest.asset.name}</Td>
                <Td>
                  <Text
                    color={
                      changeRequest.approvalStatus === ChangeRequestStatus.APPROVED
                        ? "green.600"
                        : changeRequest.approvalStatus === ChangeRequestStatus.REJECTED
                        ? "red.600"
                        : "blue.600"
                    }
                    fontWeight="semibold"
                  >
                    {changeRequest.approvalStatus}
                  </Text>
                </Td>
                <Td>
                  {`${changeRequest.requestor.firstName} ${changeRequest.requestor.lastName}`}
                  <Text>{changeRequest.requestor.email}</Text>
                </Td>
                <Td>{changeRequest.changeDescription}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </DamCardBody>
    </DamCard>
  );
} 