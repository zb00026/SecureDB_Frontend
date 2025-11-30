import { Flex, Text, Box, VStack, HStack, Badge, IconButton, Textarea, Checkbox, Input } from "@chakra-ui/react";
import { PrimaryButton, useDamToast } from "@common/index";
import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useApiRequest } from "@common/hooks/useApiRequest";
import { DeleteIcon } from "@chakra-ui/icons";
import { DamAlertDialog } from "@common/components/DamDialog/DamAlertDialog";
import { DamQueryInput } from "@common/components/DamQueryInput";
import { 
  QueryResponse, 
  QueryHistory, 
  SharedQueryComponentProps, 
  SharedQueryComponentRef,
  SaveDialogConfig,
} from "@models/QueryModels";

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

export const SharedQueryComponent = forwardRef<SharedQueryComponentRef, SharedQueryComponentProps>(({
  asset,
  accessRequestId,
  userType,
  showHistory = true,
  showQueryEditor = true,
}, ref) => {
  const { showError, showSuccess } = useDamToast();
  const [query, setQuery] = useState<string>('');
  const [queryResults, setQueryResults] = useState<QueryResponse | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { handleRequest } = useApiRequest();
  const [isSaveDlgOpen, setIsSaveDlgOpen] = useState(false);
  const [saveDialogConfig, setSaveDialogConfig] = useState<SaveDialogConfig>({ title: '', message: '' });
  const [ticketReference, setTicketReference] = useState('');
  const [changeDescription, setChangeDescription] = useState('');
  const [isChangeRequest, setIsChangeRequest] = useState(false);
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  // Expose setQuery method to parent component
  useImperativeHandle(ref, () => ({
    setQuery: (newQuery: string) => {
      setQuery(newQuery);
    }
  }));

  // Load query history from localStorage on component mount, filtered by accessRequestId
  useEffect(() => {
    const savedHistory = localStorage.getItem(QUERY_HISTORY_KEY);
    if (savedHistory) {
      try {
        const allHistory = JSON.parse(savedHistory);
        // Filter history by accessRequestId if it exists
        const filteredHistory = accessRequestId 
          ? allHistory.filter((item: QueryHistory) => item.accessRequestId === accessRequestId)
          : allHistory;
        setQueryHistory(filteredHistory);
      } catch (error) {
        console.error('Failed to parse query history:', error);
      }
    }
  }, [accessRequestId]);

  // Save query to history
  const saveQueryToHistory = (query: string, results?: QueryResponse) => {
    const newQuery: QueryHistory = {
      id: Date.now().toString(),
      query: query.trim(),
      timestamp: new Date().toISOString(),
      resultCount: results?.results?.reduce((total, result) => total + result.data.length, 0),
      results,
      accessRequestId
    };

    // Get all history from localStorage and filter by accessRequestId
    const savedHistory = localStorage.getItem(QUERY_HISTORY_KEY);
    let allHistory: QueryHistory[] = [];
    if (savedHistory) {
      try {
        allHistory = JSON.parse(savedHistory);
      } catch (error) {
        console.error('Failed to parse query history:', error);
      }
    }

    // Filter existing history by accessRequestId and add new query
    const filteredHistory = accessRequestId 
      ? allHistory.filter((item: QueryHistory) => item.accessRequestId === accessRequestId)
      : allHistory;
    
    const updatedHistory = [newQuery, ...filteredHistory.filter(h => h.query !== query.trim())].slice(0, 20);
    
    // Update the filtered history for display
    setQueryHistory(updatedHistory);
    
    // Save back to localStorage with all history (including other accessRequestIds)
    const updatedAllHistory = [newQuery, ...allHistory.filter(h => h.query !== query.trim())].slice(0, 20);
    localStorage.setItem(QUERY_HISTORY_KEY, JSON.stringify(updatedAllHistory));
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

  // Convert natural language to SQL
  const convertNaturalLanguageToSql = () => {
    if (!naturalLanguageQuery.trim()) {
      showError({ description: 'Please enter a natural language query' });
      return;
    }

    if (!asset?.id) {
      showError({ description: 'Asset not selected' });
      return;
    }

    // Validate required parameters based on user type
    if (userType === 'developer' && !accessRequestId) {
      showError({ description: 'Access request ID is required' });
      return;
    }

    setIsConverting(true);
    
    // Use different API endpoints based on user type
    const apiEndpoint = userType === 'developer' 
      ? '/api/developer/assets/convert_nl_to_sql'
      : '/api/asset_owner/assets/convert_nl_to_sql';
    
    const requestData = userType === 'developer'
      ? {
          naturalLanguageQuery: naturalLanguageQuery.trim(),
          requestId: accessRequestId
        }
      : {
          naturalLanguageQuery: naturalLanguageQuery.trim(),
          assetId: asset.id
        };
    
    handleRequest(apiEndpoint, 'POST', requestData,
      {
        onSuccess: (data: any) => {
          if (data.sqlQuery) {
            setQuery(data.sqlQuery);
            showSuccess({ 
              description: 'Natural language query converted to SQL successfully' 
            });
          } else {
            showError({ description: 'No SQL query returned from conversion' });
          }
          setIsConverting(false);
        },
        onError: (error: any) => {
          setIsConverting(false);
        },
        errorDescriptionId: 'text.failed_to_convert_nl_to_sql'
      }
    );
  };

  const runQuery = () => {
    if (!query.trim()) {
      showError({ description: 'Please enter a query' });
      return;
    }

    if (!asset?.id) {
      showError({ description: 'Asset not selected' });
      return;
    }

    // Validate SQL before execution
    const validation = validateSQL(query);
    if (!validation.isValid) {
      showError({ description: validation.errorMessage ?? 'Invalid query' });
      return;
    }

    setIsLoading(true);
    
    // Use different API endpoints based on user type
    const apiEndpoint = userType === 'developer' 
      ? '/api/developer/assets/run_query'
      : '/api/asset_owner/assets/run_query';
    
    handleRequest(apiEndpoint, 'POST', {
      requestId: accessRequestId,
      assetId: asset.id,
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

  // Reusable query results component
  const renderQueryResults = () => {
    if (!queryResults) return null;
    
    return (
      <Box flex="1" mt={4} overflowY="auto">
        <Text fontSize="md" fontWeight="bold" mb={2}>
          Query Results ({queryResults.totalQueries} {queryResults.totalQueries === 1 ? 'query' : 'queries'}, {queryResults.results.reduce((total, result) => total + result.data.length, 0)} total rows)
        </Text>
        <Box border="1px solid" borderColor="gray.200" borderRadius="md" overflow="hidden">
          <Box overflowX="auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'gray.50' }}>
                  {queryResults.results[0]?.headers.map((header) => (
                    <th key={header} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid gray.200' }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {queryResults.results[0]?.data.slice(0, 100).map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}-${JSON.stringify(row)}`} style={{ borderBottom: '1px solid gray.200' }}>
                    {queryResults.results[0]?.headers.map((header) => (
                      <td key={`${header}-${rowIndex}`} style={{ padding: '8px 12px', borderRight: '1px solid gray.200' }}>
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Box>
      </Box>
    );
  };

  // Action buttons for query functionality
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
      {userType === 'developer' && (
        <Checkbox onChange={(e) => setIsChangeRequest(e.target.checked)}>
          <FormattedMessage id="text.save_as_change_request" />
        </Checkbox>
      )}
    </Flex>
  );

  // Change request fields that show when isChangeRequest is true (only for developers)
  const changeRequestFields = isChangeRequest && userType === 'developer' ? (
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
    <Box flex={1} minW="300px" h="full">
      <HStack justify="space-between" mb={2}>
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
        h="calc(100% - 40px)"
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

  // If only showing history, return just the history section
  if (!showQueryEditor && showHistory) {
    return <>{historySection}</>;
  }

  // Natural language to SQL conversion section
  const naturalLanguageSection = (
    <Flex direction={'column'} gap={3} mb={4}>
      <Text fontSize="md" fontWeight="bold" mb={0}>
        <FormattedMessage id="text.natural_language_query" />
      </Text>
      <HStack gap={3} align="flex-end">
        <Box flex={1}>
          <Input
            placeholder="e.g., get me a count of all employees"
            value={naturalLanguageQuery}
            onChange={(e) => setNaturalLanguageQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                convertNaturalLanguageToSql();
              }
            }}
          />
        </Box>
        <PrimaryButton
          onClick={convertNaturalLanguageToSql}
          isLoading={isConverting}
          minW="150px"
        >
          <FormattedMessage id="text.convert_to_sql" />
        </PrimaryButton>
      </HStack>
    </Flex>
  );

  // If only showing query editor, return just the query editor
  if (showQueryEditor && !showHistory) {
    return (
      <Flex direction={'column'} gap={3} h="full">
        {naturalLanguageSection}
        
        <Text fontSize="md" fontWeight="bold" mb={0}>
          <FormattedMessage id="text.query_to_run" />
        </Text>

        <DamQueryInput
          value={query}
          onChange={setQuery}
        />

        <Flex direction={'row'} gap={3} mt={2}>
          {actionButtons}
        </Flex>

        {changeRequestFields}

        {/* Query Results */}
        {renderQueryResults()}
      </Flex>
    );
  }

  // Default: show both query editor and history
  return (
    <>
      <Flex direction="row" gap={4} h="full" minH="500px">
        <Flex direction={'column'} gap={3} flex={2} h="full">
          {naturalLanguageSection}
          
          <Text fontSize="md" fontWeight="bold" mb={0}>
            <FormattedMessage id="text.query_to_run" />
          </Text>

          <Box flex="0 0 120px">
            <DamQueryInput
              value={query}
              onChange={setQuery}
            />
          </Box>

          <Flex direction={'row'} gap={3} mt={2}>
            {actionButtons}
          </Flex>

          {changeRequestFields}

          {/* Query Results */}
          {renderQueryResults()}
        </Flex>

        <Box flex="0 0 300px" h="full">
          {historySection}
        </Box>
      </Flex>
      
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
});
