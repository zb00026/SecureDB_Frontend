import { Flex, Text, Table, Thead, Tbody, Tr, Th, Td, Box, VStack, Textarea, useColorModeValue } from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { DamCardDivider } from "@common/index";
import { FormattedMessage } from "react-intl";
import { AssetDetailsSection } from "@pages/developer/components/asset_detail_section";
import { DamQueryInput } from "@common/components/DamQueryInput";
import { QueryResponse } from "@models/QueryModels";
import { Asset } from "@models/assets/Asset";

export interface QueryDetailsSharedProps {
  readonly title: string;
  readonly asset: Asset | null;
  readonly query: string;
  readonly queryResults: QueryResponse | null;
  readonly isQueryEditable?: boolean;
  readonly onQueryChange?: (query: string) => void;
  readonly ticketReference?: string;
  readonly changeDescription?: string;
  readonly isTicketInfoVisible?: boolean;
  readonly actionButtons?: React.ReactNode;
  readonly historySection?: React.ReactNode;
  readonly tabbedContent?: React.ReactNode;
}
export function QueryDetailsShared({
  title,
  asset,
  query,
  queryResults,
  isQueryEditable = false,
  onQueryChange,
  ticketReference,
  changeDescription,
  isTicketInfoVisible = false,
  actionButtons,
  historySection,
  tabbedContent
}: QueryDetailsSharedProps) {
  
  // Color mode values for better contrast
  const tableBg = useColorModeValue('white', 'gray.800');
  const tableHoverBg = useColorModeValue('blue.50', 'whiteAlpha.200');
  const tableBorderColor = useColorModeValue('gray.200', 'gray.600');
  const queryBoxBg = useColorModeValue('gray.50', 'gray.700');

  return (
    <DamBasePage title={title}>
      <Flex flexDir="column" w="full" px={6}>
        <AssetDetailsSection
          asset={asset}
          textSize="md"
          pb={0}
        />
      </Flex>

      <DamCardDivider />

      <Flex direction={"column"} w="full">
        {/* Tabbed Content */}
        {tabbedContent ? (
          <Box>
            {tabbedContent}
          </Box>
        ) : (
          <Flex direction="row" gap={4}>
            <Flex direction={'column'} gap={3} flex={2}>
              <Text fontSize="md" fontWeight="bold" mt={4} mb={0}>
                <FormattedMessage id="text.query_to_run" />
              </Text>

              {isQueryEditable ? (
                <DamQueryInput
                  value={query}
                  onChange={onQueryChange ?? (() => { })}
                />
              ) : (
                <Box
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="md"
                  p={3}
                  bg="gray.50"
                  fontFamily="monospace"
                  fontSize="sm"
                  minHeight="120px"
                  whiteSpace="pre-wrap"
                >
                  {query ?? 'No query provided'}
                </Box>
              )}

              {actionButtons && (
                <Flex direction={'row'} gap={3} mt={2}>
                  {actionButtons}
                </Flex>
              )}

              {isTicketInfoVisible && (
                <Flex direction={'column'} gap={3} mt={2}>
                  <Text fontSize="md" fontWeight="bold" mt={4} mb={0}>
                    <FormattedMessage id="text.ticket_reference" />
                  </Text>
                  <Textarea
                    value={ticketReference ?? ''}
                    isReadOnly={true}
                  />
                  <Text fontSize="md" fontWeight="bold" mt={4} mb={0}>
                    <FormattedMessage id="text.change_description" />
                  </Text>
                  <Textarea
                    value={changeDescription ?? ''}
                    isReadOnly={true}
                  />
                </Flex>
              )}
            </Flex>

            {historySection}
          </Flex>
        )}

        {/* Results Table */}
        {queryResults && (
          <Box mt={6}>
            <Text fontSize="md" fontWeight="bold" mb={3}>
              Query Results ({queryResults.totalQueries} {queryResults.totalQueries === 1 ? 'query' : 'queries'}, {queryResults.results.reduce((total, result) => total + result.data.length, 0)} total rows)
            </Text>
            <VStack spacing={6} align="stretch">
              {queryResults.results.map((result, resultIndex) => (
                <Box key={`result-${result.query}-${result.data.length}`}>
                  <Box mb={3} p={3} borderRadius="md" bg={queryBoxBg}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>
                      Query {resultIndex + 1}:
                    </Text>
                    <Text fontSize="sm" fontFamily="monospace">
                      {result.query}
                    </Text>
                    <Text fontSize="xs" mt={1} mb={0}>
                      {result.data.length} rows returned
                    </Text>
                  </Box>
                  <Box overflowX="auto" border="1px solid" borderColor={tableBorderColor} borderRadius="md" bg={tableBg}>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          {result.headers.map((header) => (
                            <Th key={header} fontSize="xs" fontWeight="bold">
                              {header}
                            </Th>
                          ))}
                        </Tr>
                      </Thead>
                      <Tbody>
                        {result.data.map((row) => (
                          <Tr key={`row-${result.query}-${JSON.stringify(row).substring(0, 100)}`} _hover={{ bg: tableHoverBg }}>
                            {result.headers.map((header) => (
                              <Td key={`cell-${result.query}-${JSON.stringify(row).substring(0, 50)}-${header}`} fontSize="sm">
                                {row[header] !== null ? String(row[header]) : 'NULL'}
                              </Td>
                            ))}
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </Box>
              ))}
            </VStack>
          </Box>
        )}
      </Flex>
    </DamBasePage>
  );
} 