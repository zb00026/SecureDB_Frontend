import { Button, Flex, Tr, Tbody, Table, TableContainer, Td, Th, Thead, Text } from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { DamCardBody, DamCard, request, useDamToast, TextCardHeader, DamCardDivider, stateActions } from "@common/index";
import { AssetCredential } from "@models/AssetCredential";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { SetCredentialDialog } from "@common/components/SetCredentialDialog";
import { DamAlertDialog } from "@common/components/DamAlert/DamAlertDialog";

export const isSearchable = true;
export const displayName = 'Asset Owner Main Page';

export function Component() {
  const { showError, showSuccess } = useDamToast();
  const [credentials, setCredentials] = useState<AssetCredential[]>([]);
  const [selectedCredential, setSelectedCredential] = useState<AssetCredential | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDelDlgOpen, setIsDelDlgOpen] = useState(false);

  const fetchAssignedCredentials = () => {
    stateActions.addLoading();
    request('/api/asset_owner/assets/credentials', {})
      .then((res) => {
        if (res.length > 0) {
          setCredentials(res);
        }
      })
      .catch((e) => {
        showError({
          description: intl.formatMessage({ id: 'text.error_occurred_get_asset_credentials' }),
        });
      });
  }
  useEffect(() => {
    fetchAssignedCredentials();
  }, []);
  const intl = useIntl();

  const handleSetCredential = (username: string, password: string) => {
    if (!selectedCredential) return;
    stateActions.addLoading();
    request(`/api/asset_owner/assets/credentials/${selectedCredential.id}`, {
      method: 'POST',
      data: { username, password }
    })
      .then(() => {
        showSuccess({
          description: intl.formatMessage({ id: 'text.credentials_set_success' }),
        });
        fetchAssignedCredentials();
      })
      .catch((e) => {
        showError({
          description: e.data?.error ? e.data?.error : intl.formatMessage({ id: 'text.error_occurred_setting_credentials' }),
        });
      });
  };

  const handleRelinquish = () => {
    if (!selectedCredential) return;
    setIsDelDlgOpen(false);
    stateActions.addLoading();
    request(`/api/asset_owner/assets/credentials/${selectedCredential.id}`, {
      method: 'DELETE'
    })
      .then(() => {
        showSuccess({
          description: intl.formatMessage({ id: 'text.credentials_relinquished_success' }),
        });
        fetchAssignedCredentials();
      })
      .catch((e) => {
        showError({
          description: e.data?.error ? e.data?.error : intl.formatMessage({ id: 'text.error_occurred_relinquishing_credentials' }),
        });
      });
  };

  return (
    <DamBasePage
      title={intl.formatMessage({ id: 'text.asset_owner' })}
      backTitle={intl.formatMessage({ id: 'text.dashboard' })}
      backURI="/">
      <DamCard mt={4}>
        <DamCardBody>
          <TextCardHeader mb={0} id="lblAssetSetting">
            <FormattedMessage id="text.assets" />
          </TextCardHeader>
          <DamCardDivider />

          <TableContainer width='100%'>
            <Table variant='simple' id="tblAssetCredentials">
              <Thead>
                <Tr>
                  <Th><FormattedMessage id='text.name' /></Th>
                  <Th><FormattedMessage id='text.type' /></Th>
                  <Th><FormattedMessage id='text.database_type' /></Th>
                  <Th><FormattedMessage id='text.host_address' /></Th>
                  <Th><FormattedMessage id='text.description' /></Th>
                  <Th textAlign={'center'}><FormattedMessage id='text.status' /></Th>
                </Tr>
              </Thead>
              <Tbody maxHeight={500}>
                {credentials.length > 0 ? (
                  <>
                    {credentials.map((credential) => (
                      <Tr key={credential.id}
                        backgroundColor={credential.id === selectedCredential?.id ? 'gray.80' : 'transparent'}
                        onClick={() => setSelectedCredential(credential)}>
                        <Td>{credential.asset?.name}</Td>
                        <Td>{credential.asset?.type}</Td>
                        <Td>{credential.asset?.databaseType || '-'}</Td>
                        <Td>{credential.asset?.hostAddress}</Td>
                        <Td>{credential.asset?.description}</Td>
                        <Td textAlign={'center'}>
                          {credential.username == null && credential.password == null ?
                            (<Flex gap={2} justifyContent={'center'} w='full'>
                              <Button
                                size="sm"
                                className="btn-set-credential"
                                colorScheme="green"
                                onClick={() => {
                                  setIsDialogOpen(true);
                                }}
                              >
                                <FormattedMessage id="text.set_credential" />
                              </Button>
                            </Flex>) :
                            (<Flex flexDirection={'row'} gap={2} justifyContent={'center'} w='full'>
                              <Button
                                size="sm"
                                className="btn-update-credential"
                                colorScheme="yellow"
                                onClick={() => {
                                  setIsDialogOpen(true);
                                }}
                              >
                                <FormattedMessage id="text.update_credential" />
                              </Button>
                              <Button
                                size="sm"
                                className="btn-relinquish-credential"
                                colorScheme="red"
                                onClick={() => setIsDelDlgOpen(true)}
                              >
                                <FormattedMessage id="text.relinquish_credential" />
                              </Button>
                            </Flex>)}
                        </Td>
                      </Tr>
                    ))}
                  </>
                ) : (
                  <Tr>
                    <Td colSpan={6} textAlign={'center'}>
                      <FormattedMessage id="text.no_asset_credentials" />
                    </Td>
                  </Tr>
                )}

              </Tbody>
            </Table>
          </TableContainer>
        </DamCardBody>
      </DamCard>
      <Flex mt={6} />

      <SetCredentialDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleSetCredential}
      />

      <DamAlertDialog
        isOpen={isDelDlgOpen}
        onClose={() => setIsDelDlgOpen(false)}
        onConfirm={handleRelinquish}
        title="text.relinquish_credential"
        message="text.are_you_sure_relinquish_credential"
        confirmButtonId="btnConfirmRelinquish"
      />
    </DamBasePage>
  );
}