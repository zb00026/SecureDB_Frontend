import { Flex, Text, Textarea } from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { DamCardDivider, PrimaryButton, useDamToast } from "@common/index";
import { Asset } from "@models/assets/Asset";
import { AccessLevel } from "@models/assets/AccessLevel";
import { useEffect, useState, useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useSearchParams } from "react-router-dom";
import { AccessLevelManager } from "../../components/access_level_manager";
import { AssetObject } from "@models/assets/AssetObject";
import { AccessLevelObject } from "@models/assets/AccessLevelObject";
import { AccessRequest } from "@models/assets/AccessRequest";
import { useApiRequest } from "@common/hooks/useApiRequest";
import { AssetDetailsSection } from "@pages/developer/components/asset_detail_section";
import { ExpirationInput } from "@common/components/DamExpirationInput";

export function Component() {
  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const { showError } = useDamToast();
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);
  const [assetObjects, setAssetObjects] = useState<Array<AssetObject> | null>(null);
  const [requestReason, setRequestReason] = useState<string>('');
  const [expirationDays, setExpirationDays] = useState<number>(180);
  const [expirationHours, setExpirationHours] = useState<number>(0);
  const [accessLevelObjects, setAccessLevelObjects] = useState<Array<AccessLevelObject>>([]);
  const assetId = searchParams.get('assetId');
  const { handleRequest } = useApiRequest();

  const handleRequestAccess = () => {
    const expHrs = expirationHours + (expirationDays * 24);
    handleRequest(`/api/developer/assets/request`, 'POST', {
      requestId: currentAsset?.accessRequest?.id,
      assetId,
      accessLevelObjects,
      requestReason,
      expirationHours: expHrs
    },
      {
        onSuccess: (accessRequest: AccessRequest) => {
          setCurrentAsset(prevAsset => {
            if (!prevAsset) return null;
            return {
              ...prevAsset,
              accessRequest: accessRequest
            };
          });
        },
        successTitleId: 'text.SUCCESS',
        successDescriptionId: 'text.access_request_sent',
        errorDescriptionId: 'text.failed_to_request_access'
      }
    );
  };

  const getAccessLevelObjects = (accessRequestId: number) => {
    handleRequest(`/api/developer/assets/${accessRequestId}/access_level_objects`, 'GET', {},
      {
        onSuccess: (data: Array<AccessLevelObject>) => {
          setAccessLevelObjects(data);
        },
        errorDescriptionId: 'text.failed_to_fetch_access_level_objects'
      }
    );
  }

  const getAsset = () => {
    handleRequest(`/api/developer/assets/${assetId}`, 'GET', {},
      {
        onSuccess: (data: Asset) => {
          setCurrentAsset(data);
          if (!data.owners?.length) {
            showError({
              description: intl.formatMessage({ id: 'text.asset_has_no_owners' }),
            });
          }
          if (data.accessRequest) {
            setRequestReason(data.accessRequest.requestReason);
            getAccessLevelObjects(data.accessRequest.id);
          }
        },
        errorDescriptionId: 'text.failed_to_fetch_asset_info'
      }
    );
  };

  const getAccessLevels = () => {
    handleRequest(`/api/developer/assets/${assetId}/asset_objects`, 'GET', {},
      {
        onSuccess: (data: Array<AssetObject> | null) => {
          setAssetObjects(data);
        },
        errorDescriptionId: 'text.failed_to_fetch_asset_objects'
      }
    );
  };

  const handleAddPermission = useCallback((objectName: string, accessLevel: AccessLevel) => {
    const newAccessLevelObject: AccessLevelObject = {
      objectName,
      accessLevel
    }
    setAccessLevelObjects(prev => [...prev, newAccessLevelObject]);
  }, []);

  const handleRemovePermission = useCallback((objectName: string, accessLevel: AccessLevel) => {
    setAccessLevelObjects(prev => prev.filter(obj =>
      !(obj.objectName === objectName && obj.accessLevel.id === accessLevel.id)
    ));
  }, []);

  useEffect(() => {
    getAsset();
    getAccessLevels();
  }, [assetId]);


  return (
    <DamBasePage
      title={intl.formatMessage({ id: 'text.request_access' })}
      backTitle={intl.formatMessage({ id: 'text.back' })}
      backURI="/developer/assets">
      <Flex flexDir="column" w="full" px={6}>
        <AssetDetailsSection
          asset={currentAsset}
        />
        <Flex>
          <AccessLevelManager
            initialData={assetObjects}
            accessLevelObjects={accessLevelObjects}
            onAddPermission={handleAddPermission}
            onRemovePermission={handleRemovePermission}
          />
        </Flex>
        <Flex flexDirection={'column'} mt={3} mb={4}>
          <Text fontSize="lg" fontWeight="bold">
            <FormattedMessage id="text.request_reason" />
          </Text>
          <Textarea value={requestReason}
            onChange={(e) => setRequestReason(e.target.value)}
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
        <Flex w='full' my={4} alignItems={'center'} justifyContent={'center'}>
          <PrimaryButton onClick={handleRequestAccess}>
            <FormattedMessage id="text.request_access" />
          </PrimaryButton>
        </Flex>
      </Flex>
    </DamBasePage>
  );
}