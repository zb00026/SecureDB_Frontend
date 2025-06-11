import { Flex, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Text, Tooltip } from "@chakra-ui/react";
import { DamCard, DamCardBody, DamCardDivider, PrimaryButton, TextCardHeader } from "@common/index";
import { ApprovalStatus } from "@models/assets/AccessRequest";
import { Asset } from "@models/assets/Asset";
import { FormattedMessage } from "react-intl";
import { WarningIcon } from "@chakra-ui/icons";

interface BaseAssetsTableProps {
  readonly assets: Asset[];
  readonly selectedAsset: Asset | null;
  readonly onSelectAsset: (asset: Asset) => void;
  readonly showFetchTemplate?: boolean;
  readonly showQueryButton?: boolean;
  readonly renderDetailButton?: (asset: Asset) => React.ReactNode;
  readonly renderActions: (asset: Asset) => React.ReactNode;
  readonly onQueryAsset?: (asset: Asset) => void;
  readonly showAccessRequestStatus?: boolean;
}

const getStatusColor = (status: string | undefined): string => {
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

export function BaseAssetsTable({
  assets,
  selectedAsset,
  onSelectAsset,
  showFetchTemplate = false,
  showQueryButton = false,
  renderDetailButton,
  renderActions,
  onQueryAsset,
  showAccessRequestStatus
}: BaseAssetsTableProps) {
  return (
    <DamCard mt={4}>
      <DamCardBody>
        <TextCardHeader mb={0}>
          <FormattedMessage id="text.assets" />
        </TextCardHeader>
        <DamCardDivider />

        <TableContainer width='100%'>
          <Table variant='simple' id="tblAssets">
            <Thead>
              <Tr>
                <Th><FormattedMessage id='text.name' /></Th>
                <Th><FormattedMessage id='text.type' /></Th>
                <Th><FormattedMessage id='text.database_type' /></Th>
                <Th><FormattedMessage id='text.host_address' /></Th>
                <Th><FormattedMessage id='text.port_number' /></Th>
                <Th><FormattedMessage id='text.database_name' /></Th>
                <Th><FormattedMessage id='text.description' /></Th>
                {showFetchTemplate && (
                  <Th><FormattedMessage id='text.fetch_template' /></Th>
                )}
                {showAccessRequestStatus && (
                  <Th><FormattedMessage id='text.access_request_status' /></Th>
                )}
                <Th><FormattedMessage id='text.actions' /></Th>
                {showQueryButton && (
                  <Th><FormattedMessage id='text.query_action' /></Th>
                )}
                {renderDetailButton && (
                  <Th><FormattedMessage id='text.detail_action' /></Th>
                )}
              </Tr>
            </Thead>
            <Tbody maxHeight={500}>
              {assets.length > 0 ? (
                <>
                  {assets.map((asset) => (
                    <Tr key={asset.id}
                      sx={{
                        _light: {
                          backgroundColor: asset.id === selectedAsset?.id ? 'gray.200' : 'transparent',
                        },
                        _dark: {
                          backgroundColor: asset.id === selectedAsset?.id ? 'gray.600' : 'transparent',
                        },
                      }}
                      cursor="pointer"
                      onClick={() => onSelectAsset(asset)}>
                      <Td>{asset.name}</Td>
                      <Td>{asset.type}</Td>
                      <Td>{asset.databaseType ?? '-'}</Td>
                      <Td>{asset.hostAddress}</Td>
                      <Td>{asset.portNumber}</Td>
                      <Td>{asset.databaseName}</Td>
                      <Td>{asset.description}</Td>
                      {showFetchTemplate && (
                        <Td>{asset.fetchTemplate ?? '-'}</Td>
                      )}
                      {showAccessRequestStatus && (
                        <Td>
                          <Tooltip
                            label={asset.accessRequest?.rejectReason ?? 'No reason provided'}
                            isDisabled={asset.accessRequest?.assetApproverStatus !== 'REJECTED'}
                            placement="right"
                            hasArrow
                          >
                            <Flex 
                              dir="row" 
                              alignItems={'center'} 
                              gap={2}
                              display="inline-flex"
                            >
                              <Text
                                color={getStatusColor(asset.accessRequest?.assetApproverStatus)}
                                mb={0}
                                fontWeight="semibold"
                              >
                                {asset.accessRequest?.assetApproverStatus}
                              </Text>
                              {asset.accessRequest?.assetApproverStatus === 'REJECTED' && (
                                <WarningIcon color="red.500" />
                              )}
                            </Flex>
                          </Tooltip>
                        </Td>
                      )}
                      <Td>
                        <Flex gap={2}>
                          {renderActions(asset)}
                        </Flex>
                      </Td>
                      {showQueryButton && (
                        <Td>
                          {asset.accessRequest &&
                            !asset.accessRequest?.assetCredential?.isTemporaryPassword &&
                            asset.accessRequest?.assetApproverStatus === ApprovalStatus.APPROVED && (
                              <PrimaryButton variant='outline' size='sm' onClick={() => onQueryAsset?.(asset)}>
                                <FormattedMessage id='text.run_query' />
                              </PrimaryButton>
                            )}
                        </Td>
                      )}
                      {renderDetailButton && (
                        <Td>
                          {renderDetailButton(asset)}
                        </Td>
                      )}
                    </Tr>
                  ))}
                </>
              ) : (
                <Tr>
                  <Td colSpan={showFetchTemplate ? 7 : 6} textAlign={'center'}>
                    <FormattedMessage id="text.no_assets" />
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </DamCardBody>
    </DamCard>
  );
} 