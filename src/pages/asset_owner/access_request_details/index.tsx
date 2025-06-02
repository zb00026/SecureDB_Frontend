import { Button, Flex, Text, Textarea } from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { DamCardDivider, useDamToast } from "@common/index";
import { Asset } from "@models/assets/Asset";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useSearchParams } from "react-router-dom";
import { AssetObject } from "@models/assets/AssetObject";
import { AccessLevelObject } from "@models/assets/AccessLevelObject";
import { AccessRequest } from "@models/assets/AccessRequest";
import { useApiRequest } from "@common/hooks/useApiRequest";
import { AccessLevelManager } from "@pages/developer/components/access_level_manager";
import { AccessRequestDTO } from "@models/assets/AccessRequestDTO";
import { DamAlertDialog } from "@common/components/DamDialog/DamAlertDialog";
import { AssetDetailsSection } from "@pages/developer/components/asset_detail_section";
import { ExpirationInput } from "@common/components/DamExpirationInput";
export function Component() {
  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const { showError, showSuccess } = useDamToast();
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);
  const [assetObjects, setAssetObjects] = useState<Array<AssetObject> | null>(null);
  const [requestReason, setRequestReason] = useState<string>('');
  const [accessLevelObjects, setAccessLevelObjects] = useState<Array<AccessLevelObject>>([]);
  const [accessRequest, setAccessRequest] = useState<AccessRequest | null>(null);
  const assetId = searchParams.get('assetId');
  const accessRequestId = searchParams.get('accessRequestId');
  const { handleRequest } = useApiRequest();
  const [isAccessRejectDlgOpen, setIsAccessRejectDlgOpen] = useState(false);
  const [expirationDays, setExpirationDays] = useState<number>(180);
  const [expirationHours, setExpirationHours] = useState<number>(0);

  const approveRequestAccess = () => {
    const expHrs = expirationHours + (expirationDays * 24);
    handleRequest(`/api/asset_owner/assets/request/${accessRequestId}/approve`, 'POST', {
      expirationHours: expHrs
    },
      {
        onSuccess: () => {
          showSuccess({
            description: intl.formatMessage({ id: 'text.access_request_approved' }),
          });
          fetchData();
        },
        errorDescriptionId: 'text.failed_to_approve_access_request'
      }
    );
  };

  const rejectRequestAccess = () => {
    setIsAccessRejectDlgOpen(false);
    handleRequest(`/api/asset_owner/assets/request/${accessRequestId}/reject`, 'POST', {},
      {
        onSuccess: () => {
          showSuccess({
            description: intl.formatMessage({ id: 'text.access_request_rejected' }),
          });
          fetchData();
        },
        errorDescriptionId: 'text.failed_to_reject_access_request'
      }
    );
  }

  const getAsset = () => {
    handleRequest(`/api/asset_owner/assets/${assetId}`, 'GET', {},
      {
        onSuccess: (data: Asset) => {
          setCurrentAsset(data);
          if (!data.owners?.length) {
            showError({
              description: intl.formatMessage({ id: 'text.asset_has_no_owners' }),
            });
          }
        },
        errorDescriptionId: 'text.failed_to_fetch_asset_info'
      }
    );
  };

  const getAccessLevelObjects = () => {
    handleRequest(`/api/asset_owner/assets/${accessRequestId}/access_level_objects`, 'GET', {},
      {
        onSuccess: (data: AccessRequestDTO) => {
          setAccessLevelObjects(data.accessLevelObjects);
          setAccessRequest(data.accessRequest);
          setExpirationDays(Math.floor(data.accessRequest.expiryHours / 24));
          setExpirationHours(data.accessRequest.expiryHours % 24);
          setRequestReason(data.accessRequest.requestReason);
        },
        errorDescriptionId: 'text.failed_to_fetch_access_level_objects'
      }
    );
  }

  const getAccessLevels = () => {
    handleRequest(`/api/asset_owner/assets/${assetId}/asset_objects`, 'GET', {},
      {
        onSuccess: (data: Array<AssetObject> | null) => {
          setAssetObjects(data);
        },
        errorDescriptionId: 'text.failed_to_fetch_asset_objects'
      }
    );
  };

  const fetchData = () => {
    if (assetId && accessRequestId) {
      getAsset();
      getAccessLevelObjects();
      getAccessLevels();
    }
  }

  useEffect(() => {
    fetchData();
  }, [assetId, accessRequestId]);


  return (
    <DamBasePage
      title={intl.formatMessage({ id: 'text.request_access_details' })}>
      <Flex flexDir="column" w="full" px={6}>

        <AssetDetailsSection
          asset={currentAsset}
        />
        <Flex>
          <AccessLevelManager
            initialData={assetObjects}
            accessLevelObjects={accessLevelObjects}
            editable={false}
          />
        </Flex>
        <Flex flexDirection={'column'} mt={3} mb={4}>
          <Text fontSize="lg" fontWeight="bold" >
            <FormattedMessage id="text.request_reason" />
          </Text>
          <Textarea value={requestReason}
            id="txtAccessRequestReason"
            readOnly={true}
          />
        </Flex>

        <Flex flexDirection={'column'} mt={3} mb={4}>
          <Text fontSize="lg" fontWeight="bold">
            <FormattedMessage id="text.access_expiration" />
          </Text>
          <ExpirationInput
            days={expirationDays}
            hours={expirationHours}
            onDaysChange={setExpirationDays}
            onHoursChange={setExpirationHours}
          />
        </Flex>
        <DamCardDivider />
        {accessRequest?.assetApproverStatus === 'PENDING' && (
          <Flex w='full' my={4} alignItems={'center'} justifyContent={'center'} gap={4}>
            <Button onClick={approveRequestAccess} colorScheme="green" id="btnApprove">
              <FormattedMessage id="text.approve_access_request" />
            </Button>
            <Button onClick={() => setIsAccessRejectDlgOpen(true)} colorScheme="red">
              <FormattedMessage id="text.reject_access_request" />
            </Button>
          </Flex>
        )}
        {accessRequest?.assetApproverStatus === 'APPROVED' && (
          <Flex w='full' my={4} alignItems={'center'} justifyContent={'center'} gap={4}>
            <Text>
              <FormattedMessage id="text.access_request_approved" />
            </Text>
          </Flex>
        )}
        {accessRequest?.assetApproverStatus === 'REJECTED' && (
          <Flex w='full' my={4} alignItems={'center'} justifyContent={'center'} gap={4}>
            <Text>
              <FormattedMessage id="text.access_request_rejected" />
            </Text>
          </Flex>
        )}
      </Flex>
      <DamAlertDialog
        isOpen={isAccessRejectDlgOpen}
        onClose={() => setIsAccessRejectDlgOpen(false)}
        onConfirm={() => rejectRequestAccess()}
        title="text.reject_access_request"
        message="text.are_you_sure_reject_access_request"
        confirmButtonId="btnConfirmRejectAccessRequest"
      />
    </DamBasePage>
  );
}