import { Flex, Input, Text } from "@chakra-ui/react";
import { MyBasePage } from "@common/components/MyBasePage";
import { MyCard, MyCardBody, MyCardDivider, MyContent, PrimaryButton, request, TextCardHeader, useMyToast } from "@common/index";
import { S3BucketSettings } from "@models/S3BucketSettings";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { stateActions } from "@common/state";
export const isSearchable = true;
export const displayName = 'Settings Page';

export function Component() {
  const intl = useIntl();
  const { showError, showSuccess } = useMyToast();
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
    <>
      <MyBasePage
        title={intl.formatMessage({ id: 'text.settings' })}
        backTitle={intl.formatMessage({ id: 'text.dashboard' })}
        backURI="/"
        hasBody={false}>
      </MyBasePage>
      <MyContent w="98%">
        <MyCard mt="4" pb="4">
          <MyCardBody>
            <TextCardHeader id="lblAuditLogStorage" w="full" pb={0} textAlign={'center'}>
              <FormattedMessage id="text.audit_log_storage" />
            </TextCardHeader>

            <Flex flexDir="column" w="full" px={6}>
              <MyCardDivider></MyCardDivider>
              <Flex w='full' textAlign={'center'} mt={2} alignItems={'center'} gap={2}>
                <Text mb={0}>
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
          </MyCardBody>
        </MyCard>
      </MyContent>

    </>
  );
}