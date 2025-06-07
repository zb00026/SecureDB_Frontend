import { Flex, Text, Box, VStack, HStack, Badge, IconButton, Textarea, Checkbox } from "@chakra-ui/react";
import { PrimaryButton, useDamToast } from "@common/index";
import { Asset } from "@models/assets/Asset";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useSearchParams } from "react-router-dom";
import { useApiRequest } from "@common/hooks/useApiRequest";
import { DeleteIcon } from "@chakra-ui/icons";
import { DamAlertDialog } from "@common/components/DamDialog/DamAlertDialog";
import { QueryDetailsShared } from "@common/components/QueryDetailsShared";

interface QueryResult {
  headers: string[];
  data: Record<string, any>[];
  query: string;
}

interface QueryResponse {
  totalQueries: number;
  results: QueryResult[];
}

interface QueryHistory {
  id: string;
  query: string;
  timestamp: string;
  resultCount?: number;
  results?: QueryResponse;
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
  const [queryResults, setQueryResults] = useState<QueryResponse | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const assetId = searchParams.get('assetId');
  const accessRequestId = searchParams.get('accessRequestId');
  const { handleRequest } = useApiRequest();
  const [isSaveDlgOpen, setIsSaveDlgOpen] = useState(false);
  const [saveDialogConfig, setSaveDialogConfig] = useState<{
    title: string;
    message: string;
  }>({ title: '', message: '' });
  const [ticketReference, setTicketReference] = useState('');
  const [changeDescription, setChangeDescription] = useState('');
  const [isChangeRequest, setIsChangeRequest] = useState(false);

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
  const saveQueryToHistory = (query: string, results?: QueryResponse) => {
    const newQuery: QueryHistory = {
      id: Date.now().toString(),
      query: query.trim(),
      timestamp: new Date().toISOString(),
      resultCount: results?.results?.reduce((total, result) => total + result.data.length, 0),
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

  // Handle save as change request
  const handleSaveAsChangeRequest = () => {
    if (!query.trim()) {
      showError({ description: 'Please enter a query to save as change request' });
      return;
    }

    // Check if query is single line or multi-line
    const isMultiLine = query.trim().split('\n').length > 1;
    
    if (isMultiLine) {
      setSaveDialogConfig({
        title: 'Save as Change Request',
        message: 'The query provided will be executed under a transaction and transaction will be rolled back to validate script. Ok to proceed?'
      });
    } else {
      setSaveDialogConfig({
        title: 'Save as Change Request', 
        message: 'The query provided will be executed with an Explain statement to validate and create a change request. Ok to proceed?'
      });
    }
    
    setIsSaveDlgOpen(true);
  };

  // Confirm save as change request
  const confirmSaveAsChangeRequest = () => {
    setIsSaveDlgOpen(false);
    runQuery();
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
      isChangeRequest,
      ticketReference,
      changeDescription,
      query
    },
      {
        onSuccess: (data: any) => {
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

  // Action buttons for developer functionality
  const actionButtons = (
    <Flex direction="row" gap={3} w="full">
      <PrimaryButton onClick={() => {
        if (isChangeRequest) {
          handleSaveAsChangeRequest();
        } else {
          runQuery();
        }
      }} isLoading={isLoading}>
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
      <Checkbox onChange={(e) => setIsChangeRequest(e.target.checked)}>
        <FormattedMessage id="text.save_as_change_request" />
      </Checkbox>
    </Flex>
  );

  // Change request fields that show when isChangeRequest is true
  const changeRequestFields = isChangeRequest ? (
    <Flex direction={'column'} gap={3} mt={2}>
      <Text fontSize="md" fontWeight="bold" mt={4} mb={0}>
        <FormattedMessage id="text.ticket_reference" />
      </Text>
      <Textarea value={ticketReference} onChange={(e) => setTicketReference(e.target.value)} />
      <Text fontSize="md" fontWeight="bold" mt={4} mb={0}>
        <FormattedMessage id="text.change_description" />
      </Text>
      <Textarea value={changeDescription} onChange={(e) => setChangeDescription(e.target.value)} />
    </Flex>
  ) : null;

  // Query History Section
  const historySection = (
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
  );

  return (
    <>
      <QueryDetailsShared
        title={intl.formatMessage({ id: 'text.query_asset' })}
        asset={currentAsset}
        query={query}
        queryResults={queryResults}
        isQueryEditable={true}
        onQueryChange={setQuery}
        actionButtons={
          <Flex direction="column" gap={3} w="full">
            {actionButtons}
            {changeRequestFields}
          </Flex>
        }
        historySection={historySection}
      />
      
      <DamAlertDialog
        isOpen={isSaveDlgOpen}
        onClose={() => setIsSaveDlgOpen(false)}
        onConfirm={confirmSaveAsChangeRequest}
        title={saveDialogConfig.title}
        message={saveDialogConfig.message}
        confirmButtonId="btnConfirmSaveAsChangeRequest"
      />
    </>
  );
}