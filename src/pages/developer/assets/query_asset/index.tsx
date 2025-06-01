import { Flex, Text, Table, Thead, Tbody, Tr, Th, Td, Box, VStack, HStack, Badge, IconButton } from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { DamCardDivider, PrimaryButton, useDamToast } from "@common/index";
import { Asset } from "@models/assets/Asset";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useSearchParams } from "react-router-dom";
import { useApiRequest } from "@common/hooks/useApiRequest";
import { AssetDetailsSection } from "@pages/developer/components/asset_detail_section";
import { DamQueryInput } from "@common/components/DamQueryInput";
import { DeleteIcon } from "@chakra-ui/icons";

interface QueryResult {
  headers: string[];
  data: Record<string, any>[];
}

interface QueryHistory {
  id: string;
  query: string;
  timestamp: string;
  resultCount?: number;
  results?: QueryResult;
}

const QUERY_HISTORY_KEY = 'dam_query_history';

// SQL validation functions
const validateSQL = (query: string): { isValid: boolean; errorMessage?: string } => {
  const trimmedQuery = query.trim().toUpperCase();
  
  // Check for DDL statements
  const ddlKeywords = ['ALTER', 'DROP', 'CREATE', 'TRUNCATE', 'RENAME'];
  const isDDL = ddlKeywords.some(keyword => 
    trimmedQuery.startsWith(keyword + ' ') || trimmedQuery === keyword
  );
  
  if (isDDL) {
    return {
      isValid: false,
      errorMessage: 'Please execute any DDL statements as a change request'
    };
  }
  
  // Check DELETE/UPDATE queries for WHERE clause
  const isDelete = trimmedQuery.startsWith('DELETE ');
  const isUpdate = trimmedQuery.startsWith('UPDATE ');
  
  if (isDelete || isUpdate) {
    // Simple regex to check for WHERE clause (case insensitive)
    const hasWhereClause = /\bWHERE\b/i.test(query);
    
    if (!hasWhereClause) {
      const operation = isDelete ? 'DELETE' : 'UPDATE';
      return {
        isValid: false,
        errorMessage: `${operation} queries must include a WHERE clause to prevent accidental mass operations`
      };
    }
  }
  
  return { isValid: true };
};

export function Component() {
  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const { showError, showSuccess } = useDamToast();
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);
  const [query, setQuery] = useState<string>('');
  const [queryResults, setQueryResults] = useState<QueryResult | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const assetId = searchParams.get('assetId');
  const accessRequestId = searchParams.get('accessRequestId');
  const { handleRequest } = useApiRequest();

  // Load query history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(QUERY_HISTORY_KEY);
    if (savedHistory) {
      try {
        setQueryHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Failed to parse query history:', error);
      }
    }
  }, []);

  // Save query to history
  const saveQueryToHistory = (query: string, results?: QueryResult) => {
    const newQuery: QueryHistory = {
      id: Date.now().toString(),
      query: query.trim(),
      timestamp: new Date().toISOString(),
      resultCount: results?.data?.length,
      results
    };

    const updatedHistory = [newQuery, ...queryHistory.filter(h => h.query !== query.trim())].slice(0, 20); // Keep last 20 queries
    setQueryHistory(updatedHistory);
    localStorage.setItem(QUERY_HISTORY_KEY, JSON.stringify(updatedHistory));
  };

  // Load query and results from history
  const loadQueryAndResultsFromHistory = (historyItem: QueryHistory) => {
    setQuery(historyItem.query);
    if (historyItem.results) {
      setQueryResults(historyItem.results);
    }
  };

  // Clear query history
  const clearQueryHistory = () => {
    setQueryHistory([]);
    localStorage.removeItem(QUERY_HISTORY_KEY);
    showSuccess({ description: 'Query history cleared' });
  };

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
        },
        errorDescriptionId: 'text.failed_to_fetch_asset_info'
      }
    );
  };

  const runQuery = () => {
    if (!query.trim()) {
      showError({ description: 'Please enter a query' });
      return;
    }


    // Validate SQL before execution
    const validation = validateSQL(query);
    if (!validation.isValid) {
      showError({ description: validation.errorMessage ?? 'Invalid query' });
      return;
    }

    setIsLoading(true);
    handleRequest(`/api/developer/assets/run_query`, 'POST', {
      requestId: accessRequestId,
      assetId,
      query
    },
      {
        onSuccess: (data: any) => {
          console.log(data);
          if (data.results) {
            setQueryResults(data.results);
            saveQueryToHistory(query, data.results);
          }
          setIsLoading(false);
        },
        onError: (error: any) => {
          setIsLoading(false);
        },
        successTitleId: 'text.SUCCESS',
        successDescriptionId: 'text.query_run_success',
        errorDescriptionId: 'text.failed_to_run_query'
      }
    );
  };

  useEffect(() => {
    getAsset();
  }, [assetId]);

  return (
    <DamBasePage
      title={intl.formatMessage({ id: 'text.query_asset' })}
      backTitle={intl.formatMessage({ id: 'text.back' })}
      backURI="/developer/assets">

      <Flex flexDir="column" w="full" px={6}>
        <AssetDetailsSection
          asset={currentAsset}
          textSize="md"
          pb={0}
        />
      </Flex>

      <DamCardDivider />

      <Flex direction={"column"} w="full">
        <Flex direction="row" gap={2}>
          <Flex direction={'column'} gap={3} flex={2}>
            <Text fontSize="md" fontWeight="bold" mt={4} mb={0}>
              <FormattedMessage id="text.query_to_run" />
            </Text>
            <DamQueryInput
              value={query}
              onChange={setQuery}
            />
            <Flex direction={'row'} gap={3} mt={2}>
              <PrimaryButton onClick={runQuery} isLoading={isLoading}>
                <FormattedMessage id="text.run" />
              </PrimaryButton>
              <PrimaryButton
                variant="outline"
                onClick={() => {
                  setQuery('');
                  setQueryResults(null);
                }}>
                <FormattedMessage id="text.clear" />
              </PrimaryButton>
            </Flex>
          </Flex>


          {/* Query History Section */}
          <Box flex={1} minW="300px" maxHeight={'320px'}>
            <HStack justify="space-between" mt={4} mb={2}>
              <Text fontSize="md" fontWeight="bold">
                Query History
              </Text>
              {queryHistory.length > 0 && (
                <IconButton
                  aria-label="Clear history"
                  icon={<DeleteIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={clearQueryHistory}
                />
              )}
            </HStack>

            <Box
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              p={3}
              maxH="320px"
              overflowY="auto"
            >
              {queryHistory.length === 0 ? (
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  No query history yet
                </Text>
              ) : (
                <VStack spacing={2} align="stretch">
                  {queryHistory.map((item) => (
                    <Box
                      key={item.id}
                      p={3}
                      border="1px solid"
                      borderColor="gray.100"
                      borderRadius="md"
                      cursor="pointer"
                      _hover={{ bg: "gray.50", borderColor: "gray.300" }}
                      onClick={() => loadQueryAndResultsFromHistory(item)}
                    >
                      <HStack justify="space-between" mb={1}>
                        <Badge colorScheme="blue" fontSize="xs">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </Badge>
                        {item.resultCount !== undefined && (
                          <Badge colorScheme="green" fontSize="xs">
                            {item.resultCount} rows
                          </Badge>
                        )}
                        {item.results && (
                          <Badge colorScheme="purple" fontSize="xs">
                            Cached
                          </Badge>
                        )}
                      </HStack>
                      <Text
                        fontSize="xs"
                        fontFamily="monospace"
                        color="gray.700"
                        noOfLines={3}
                      >
                        {item.query}
                      </Text>
                      <Text fontSize="xs" color="gray.400" mt={1}>
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </Box>
        </Flex>
        {/* Results Table */}
        {queryResults && (
          <Box mt={6}>
            <Text fontSize="md" fontWeight="bold" mb={3}>
              Query Results ({queryResults.data.length} rows)
            </Text>
            <Box overflowX="auto" border="1px solid" borderColor="gray.200" borderRadius="md">
              <Table variant="simple" size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    {queryResults.headers.map((header) => (
                      <Th key={header} fontSize="xs" fontWeight="bold">
                        {header}
                      </Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {queryResults.data.map((row, rowIndex) => (
                    <Tr key={`row-${rowIndex}-${JSON.stringify(Object.values(row)).substring(0, 50)}`} _hover={{ bg: "gray.50" }}>
                      {queryResults.headers.map((header) => (
                        <Td key={`${rowIndex}-${header}`} fontSize="sm">
                          {row[header] !== null ? String(row[header]) : 'NULL'}
                        </Td>
                      ))}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </Box>
        )}
      </Flex>
    </DamBasePage>
  );
}