import { Flex, Table, TableContainer, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import { DamCard, DamCardBody, DamCardDivider, TextCardHeader } from "@common/index";
import { Asset } from "@models/assets/Asset";
import { FormattedMessage } from "react-intl";

interface BaseAssetsTableProps {
  readonly assets: Asset[];
  readonly selectedAsset: Asset | null;
  readonly onSelectAsset: (asset: Asset) => void;
  readonly showFetchTemplate?: boolean;
  readonly renderActions: (asset: Asset) => React.ReactNode;
}

export function BaseAssetsTable({
  assets,
  selectedAsset,
  onSelectAsset,
  showFetchTemplate = false,
  renderActions
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
                <Th><FormattedMessage id='text.actions' /></Th>
              </Tr>
            </Thead>
            <Tbody maxHeight={500}>
              {assets.length > 0 ? (
                <>
                  {assets.map((asset) => (
                    <Tr key={asset.id}
                      backgroundColor={asset.id === selectedAsset?.id ? 'gray.80' : 'transparent'}
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
                      <Td>
                        <Flex gap={2}>
                          {renderActions(asset)}
                        </Flex>
                      </Td>
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