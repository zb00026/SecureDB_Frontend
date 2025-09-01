import { Flex, Input, Text, VStack } from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { DamCard, DamCardBody, DamCardDivider, PrimaryButton, request, TextCardHeader, useDamToast } from "@common/index";
import { S3BucketSettings } from "@models/S3BucketSettings";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { stateActions } from "@common/state";
import { ShortKey } from "./components/shortkey";

export const isSearchable = true;
export const displayName = 'Settings Page';

export function Component() {
  const intl = useIntl();
  const { showError, showSuccess } = useDamToast();
  const [s3BucketName, setS3BucketName] = useState<string>('');

  useEffect(() => {
    request('/api/admin/settings/get-current-audit-log-storage').then((res: any) => {
      setS3BucketName(res.bucketName);
    });
  }, []);

  const setS3BucketInfo = () => {
    const s3BucketSettings: S3BucketSettings = {
      bucketName: s3BucketName
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

  return (
    <DamBasePage
      title={intl.formatMessage({ id: 'text.settings' })}>
      
      <VStack spacing={6} align="stretch">
        {/* Audit Log Storage Settings */}
        <DamCard>
          <DamCardBody>
            <TextCardHeader id="lblAuditLogStorage" w="full" pb={0} textAlign={'center'}>
              <FormattedMessage id="text.audit_log_storage" />
            </TextCardHeader>

            <Flex flexDir="column" w="full" px={6}>
              <DamCardDivider />
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
            <TextCardHeader id="lblShortkeySearch" w="full" pb={0} textAlign={'center'}>
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