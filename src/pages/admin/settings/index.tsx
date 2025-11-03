import { Flex, Input, Text, VStack, Select, Spinner, Alert, AlertIcon, AlertTitle, AlertDescription } from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { DamCard, DamCardBody, DamCardDivider, PrimaryButton, request, TextCardHeader, useDamToast } from "@common/index";
import { S3BucketSettings } from "@models/S3BucketSettings";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { stateActions } from "@common/state";
import { ShortKey } from "./components/shortkey";
import { useTimezoneContext } from "@common/contexts/TimezoneContext";

export const isSearchable = true;
export const displayName = 'Settings Page';

export function Component() {
  const intl = useIntl();
  const { showError, showSuccess } = useDamToast();
  const [s3BucketName, setS3BucketName] = useState<string>('');
  const [localRetentionDays, setLocalRetentionDays] = useState<number>(0);
  const { 
    timezones, 
    currentTimezone, 
    isLoading: timezoneLoading, 
    error: timezoneError, 
    updateTimezone,
    fetchTimezones,
  } = useTimezoneContext();

  useEffect(() => {
    request('/api/admin/settings/get-current-audit-log-storage').then((res: any) => {
      setS3BucketName(res.bucketName);
      if (typeof res.localRetentionDays === 'number') {
        setLocalRetentionDays(res.localRetentionDays);
      }
    });
    
    // Load timezone list when component mounts (current timezone is already loaded globally)
    fetchTimezones();
  }, [fetchTimezones]);

  const setS3BucketInfo = () => {
    const s3BucketSettings: S3BucketSettings = {
      bucketName: s3BucketName,
      localRetentionDays: Number.isFinite(localRetentionDays) ? localRetentionDays : 0
    }
    stateActions.addLoading();
    request('/api/admin/settings/update-audit-log-storage', {
      method: 'POST',
      data: s3BucketSettings
    }).then((res: any) => {
      stateActions.subLoading();
      showSuccess({
        description: intl.formatMessage({ id: 'text.s3_bucket_name_success' }),
      });
    }).catch((e: any) => {
      stateActions.subLoading();
      showError({
        description: intl.formatMessage({ id: 'text.s3_bucket_name_error' }),
      });
      setS3BucketName('');
    });
  }

  const handleTimezoneChange = async (timezone: string) => {
    if (timezone !== currentTimezone) {
      await updateTimezone(timezone);
    }
  };

  return (
    <DamBasePage
      title={intl.formatMessage({ id: 'text.settings' })}>
      
      <VStack spacing={6} align="stretch">
        {/* Timezone Settings */}
        <DamCard>
          <DamCardBody>
            <TextCardHeader id="lblTimezoneSettings" w="full" pb={2} textAlign={'center'}>
              <FormattedMessage id="text.timezone_settings" />
            </TextCardHeader>

            <Flex flexDir="column" w="full" px={6}>
              <DamCardDivider />
              
              {timezoneError && (
                <Alert status="warning" mb={4}>
                  <AlertIcon />
                  <AlertTitle>Timezone Error:</AlertTitle>
                  <AlertDescription>{timezoneError}</AlertDescription>
                </Alert>
              )}

              <Flex w='full' textAlign={'center'} mt={4} alignItems={'center'} gap={2} mb={2}>
                <Text mb={0} minW='150px' textAlign={'right'}>
                  <FormattedMessage id="text.system_timezone" />
                </Text>
                <Select
                  id="selectTimezone"
                  flex={1}
                  value={currentTimezone}
                  onChange={(e) => handleTimezoneChange(e.target.value)}
                  disabled={timezoneLoading || timezones.length === 0}
                >
                  {timezones.length === 0 ? (
                    <option value={currentTimezone}>
                      {timezoneLoading ? 'Loading...' : 'No timezones available'}
                    </option>
                  ) : (
                    timezones.map((tz) => (
                      <option key={tz.id} value={tz.id}>
                        {tz.displayName}
                      </option>
                    ))
                  )}
                </Select>
                {timezoneLoading && <Spinner size="sm" />}
              </Flex>
            </Flex>
          </DamCardBody>
        </DamCard>

        {/* Audit Log Storage Settings */}
        <DamCard>
          <DamCardBody>
            <TextCardHeader id="lblAuditLogStorage" w="full" pb={2} textAlign={'center'}>
              <FormattedMessage id="text.audit_log_storage" />
            </TextCardHeader>

            <Flex flexDir="row" w="full" px={6}>
              <Flex w='full' textAlign={'center'} mt={4} alignItems={'center'} gap={2} mb={2}>
                <Text mb={0} minW='150px' textAlign={'right'}>
                  <FormattedMessage id="text.s3_bucket_name" />
                </Text>
                <Input
                  id="inputAuditLogStorage"
                  flex={1}
                  value={s3BucketName}
                  onChange={(e) => setS3BucketName(e.target.value)}
                  placeholder={intl.formatMessage({ id: 'text.s3_bucket_name' })}
                />
              </Flex>

              <Flex w='full' textAlign={'center'} mt={4} alignItems={'center'} gap={2} mb={2}>
                <Text mb={0} minW='150px' textAlign={'right'}>
                  <FormattedMessage id="text.audit_retention_days" />
                </Text>
                <Input
                  id="inputLocalRetentionDays"
                  type="number"
                  min={0}
                  flex={1}
                  value={Number.isFinite(localRetentionDays) ? localRetentionDays : 0}
                  onChange={(e) => setLocalRetentionDays(Number.parseInt(e.target.value || '0', 10))}
                  placeholder={intl.formatMessage({ id: 'text.audit_retention_days' })}
                />
                <PrimaryButton
                  id="btnApplyAuditLogStorage"
                  onClick={setS3BucketInfo}>
                  <FormattedMessage id="text.apply" />
                </PrimaryButton>
              </Flex>
            </Flex>
          </DamCardBody>
        </DamCard>

        {/* Shortkey Search Settings */}
        <DamCard>
          <DamCardBody>
            <TextCardHeader id="lblShortkeySearch" w="full" pb={2} textAlign={'center'}>
              <FormattedMessage id="text.shortkey_search" />
            </TextCardHeader>

            <Flex flexDir="column" w="full" px={6}>
              <DamCardDivider />
              <Flex w='full' textAlign={'center'} mt={4} alignItems={'center'} gap={2} mb={2}>
                <ShortKey />
              </Flex>
            </Flex>
          </DamCardBody>
        </DamCard>
      </VStack>
    </DamBasePage>
  );
}