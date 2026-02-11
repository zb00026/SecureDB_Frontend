import {
  Flex,
  Text,
  Box,
  VStack,
  HStack,
  Badge,
  IconButton,
  Textarea,
  Checkbox,
  Input,
  FormControl,
  FormLabel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
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
import { DatabaseType } from "@/constants/enums";

const QUERY_HISTORY_KEY = 'dam_query_history';

// SQL validation functions
const validateSQL = (query: string, isChangeRequest: boolean): { isValid: boolean; errorMessage?: string } => {
  const trimmedQuery = query.trim().toUpperCase();
  
  // Check for DDL statements
  const ddlKeywords = ['ALTER', 'DROP', 'CREATE', 'TRUNCATE', 'RENAME'];
  const isDDL = ddlKeywords.some(keyword => 
    trimmedQuery.startsWith(keyword + ' ') || trimmedQuery === keyword
  );
  
  if (isDDL && !isChangeRequest) {
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

// MongoDB query validation functions
const validateMongoDB = (query: string): { isValid: boolean; errorMessage?: string } => {
  const trimmedQuery = query.trim();
  
  // Check for dangerous MongoDB operations
  const dangerousOps = [
    'db.dropDatabase',
    'db.dropCollection',
    'db.collection.drop',
    '.drop()',
    '.remove({})',
    '.deleteMany({})',
    '.updateMany({},'
  ];
  
  const hasDangerousOp = dangerousOps.some(op => trimmedQuery.includes(op));
  
  if (hasDangerousOp) {
    return {
      isValid: false,
      errorMessage: 'Please execute destructive operations as a change request'
    };
  }
  
  // Check for deleteMany/remove without filter (empty object)
  const deleteManyNoFilter = /\.(deleteMany|remove)\s*\(\s*\{\s*\}\s*\)/i.test(trimmedQuery);
  if (deleteManyNoFilter) {
    return {
      isValid: false,
      errorMessage: 'Delete operations must include a filter to prevent accidental mass deletions'
    };
  }
  
  // Check for updateMany without filter
  const updateManyNoFilter = /\.updateMany\s*\(\s*\{\s*\}\s*,/i.test(trimmedQuery);
  if (updateManyNoFilter) {
    return {
      isValid: false,
      errorMessage: 'Update operations must include a filter to prevent accidental mass updates'
    };
  }
  
  return { isValid: true };
};

// Unified validation function
const validateQuery = (query: string, isChangeRequest: boolean, databaseType?: DatabaseType | null): { isValid: boolean; errorMessage?: string } => {
  if (databaseType === DatabaseType.MONGODB) {
    return validateMongoDB(query);
  }
  return validateSQL(query, isChangeRequest);
};

export const SharedQueryComponent = forwardRef<SharedQueryComponentRef, SharedQueryComponentProps>(({
  asset,
  accessRequestId,
  userType,
  showHistory = true,
  showQueryEditor = true,
  customApiEndpoint,
}, ref) => {
  const { showError, showSuccess } = useDamToast();
  const tableHeaderBg = useColorModeValue("gray.50", "gray.700");
  const tableHeaderColor = useColorModeValue("gray.700", "gray.100");
  const tableBorderColor = useColorModeValue("gray.200", "gray.600");
  const tableRowHoverBg = useColorModeValue("gray.50", "gray.700");
  const tableTextColor = useColorModeValue("gray.800", "gray.100");
  const tableCellMutedColor = useColorModeValue("gray.600", "gray.300");
  const scrollbarTrackBg = useColorModeValue("gray.100", "gray.700");
  const scrollbarThumbBg = useColorModeValue("gray.400", "gray.500");
  const scrollbarThumbHoverBg = useColorModeValue("gray.500", "gray.400");
  const columnMinW = "160px";
  const columnMaxW = "380px";
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
    if (userType === 'accessor' && !accessRequestId) {
      showError({ description: 'Access request ID is required' });
      return;
    }

    setIsConverting(true);
    
    // Use different API endpoints based on user type
    const apiEndpoint = userType === 'accessor' 
      ? '/api/accessor/assets/convert_nl_to_sql'
      : '/api/asset_owner/assets/convert_nl_to_sql';
    
    const requestData = userType === 'accessor'
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

    // Validate query before execution (SQL or MongoDB)
    const validation = validateQuery(query, isChangeRequest, asset.databaseType);
    if (!validation.isValid) {
      showError({ description: validation.errorMessage ?? 'Invalid query' });
      return;
    }

    setIsLoading(true);
    
    // Use custom endpoint if provided, otherwise use default based on user type
    const apiEndpoint = customApiEndpoint || (userType === 'accessor' 
      ? '/api/accessor/assets/run_query'
      : '/api/asset_owner/assets/run_query');
    
    // For Freshdesk API, use different request format
    const requestData = customApiEndpoint === '/api/freshdesk/run-query'
      ? {
          assetId: asset.id,
          requestId: accessRequestId ? Number(accessRequestId) : undefined,
          query
        }
      : {
          requestId: accessRequestId,
          assetId: asset.id,
          isChangeRequest,
          ticketReference,
          changeDescription,
          query
        };
    
    handleRequest(apiEndpoint, 'POST', requestData,
      {
        onSuccess: (data: any) => {
          if (!isChangeRequest) {
            if (data.results) {
              setQueryResults(data.results);
              saveQueryToHistory(query, data.results);
            }
          }
          setIsLoading(false);
        },
        onError: (error: any) => {
          setIsLoading(false);
        },
        successTitleId: 'text.SUCCESS',
        successDescriptionId: isChangeRequest ? 'text.change_request_created_successfully' : 'text.query_run_success',
        errorDescriptionId: 'text.failed_to_run_query'
      }
    );
  };

  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
    // Handle objects (including arrays, dates, etc.)
    // Note: typeof null === "object" in JavaScript, but we check for null above
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return "[object Object]";
      }
    }
    // For any other type (symbol, function, etc.), return a safe string representation
    // This will never be reached for objects since they're handled above
    return String(value);
  };

  const renderCell = (value: unknown) => {
    const text = formatCellValue(value);
    const isEmpty = !text || text.trim() === "" || text === "null" || text === "undefined";
    const displayText = isEmpty ? "—" : text;
    const shouldTooltip = !isEmpty && displayText.length > 80;

    return (
      <Tooltip
        label={displayText}
        isDisabled={!shouldTooltip}
        placement="top-start"
        openDelay={400}
        maxW="720px"
      >
        <Text
          color={isEmpty ? tableCellMutedColor : tableTextColor}
          fontSize="sm"
          noOfLines={3}
          wordBreak="break-word"
          whiteSpace="normal"
          lineHeight="1.5"
        >
          {displayText}
        </Text>
      </Tooltip>
    );
  };

  // Reusable query results component
  const renderQueryResults = () => {
    if (!queryResults) return null;
    
    return (
      <Box flex="1" mt={4} minH="300px" display="flex" flexDirection="column" overflow="hidden">
        <Text fontSize="md" fontWeight="bold" mb={2} flexShrink={0}>
          Query Results ({queryResults.totalQueries} {queryResults.totalQueries === 1 ? 'query' : 'queries'}, {queryResults.results.reduce((total, result) => total + result.data.length, 0)} total rows)
        </Text>
        <Box 
          border="1px solid" 
          borderColor={tableBorderColor}
          borderRadius="md" 
          overflow="hidden" 
          flex="1" 
          minH="250px"
          display="flex" 
          flexDirection="column"
        >
          <Box 
            overflowX="scroll" 
            overflowY="auto" 
            flex="1" 
            minH="0"
            maxH="100%"
            sx={{
              // Force horizontal scrollbar to always be visible when content overflows
              '&::-webkit-scrollbar': {
                height: '12px',
              },
              '&::-webkit-scrollbar:horizontal': {
                display: 'block',
              },
              '&::-webkit-scrollbar-track': {
                background: scrollbarTrackBg,
              },
              '&::-webkit-scrollbar-thumb': {
                background: scrollbarThumbBg,
                borderRadius: '6px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: scrollbarThumbHoverBg,
              },
            }}
          >
            <Table
              variant="simple"
              size="sm"
              sx={{
                tableLayout: "auto",
                minWidth: "max-content",
                width: "100%",
              }}
            >
                <Thead 
                  bg={tableHeaderBg}
                  sx={{ 
                    position: 'sticky', 
                    top: 0, 
                    zIndex: 10,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  <Tr>
                    {queryResults.results[0]?.headers.map((header) => (
                      <Th
                        key={header}
                        bg={tableHeaderBg}
                        color={tableHeaderColor}
                        borderBottom="1px solid"
                        borderColor={tableBorderColor}
                        textTransform="none"
                        fontWeight="semibold"
                        whiteSpace="normal"
                        minW={columnMinW}
                        maxW={columnMaxW}
                        px={3}
                        py={2}
                      >
                        <Tooltip label={header} isDisabled={String(header).length < 30} placement="top-start" openDelay={400}>
                          <Text noOfLines={3} wordBreak="break-word">{header}</Text>
                        </Tooltip>
                      </Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {queryResults.results[0]?.data.slice(0, 100).map((row, rowIndex) => (
                    <Tr
                      key={`row-${rowIndex}-${JSON.stringify(row)}`}
                      borderBottom="1px solid"
                      borderColor={tableBorderColor}
                      _hover={{ bg: tableRowHoverBg }}
                    >
                      {queryResults.results[0]?.headers.map((header) => (
                        <Td
                          key={`${header}-${rowIndex}`}
                          borderRight="1px solid"
                          borderColor={tableBorderColor}
                          verticalAlign="top"
                          minW={columnMinW}
                          maxW={columnMaxW}
                          px={3}
                          py={2}
                        >
                          {renderCell(row[header])}
                        </Td>
                      ))}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
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
      {userType === 'accessor' && (
        <Checkbox onChange={(e) => setIsChangeRequest(e.target.checked)}>
          <FormattedMessage id="text.save_as_change_request" />
        </Checkbox>
      )}
    </Flex>
  );

  // Change request fields that show when isChangeRequest is true (only for accessors)
  const changeRequestFields = isChangeRequest && userType === 'accessor' ? (
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
      <FormControl>
        <FormLabel mb={1}>
          <FormattedMessage id="text.natural_language_query" />
        </FormLabel>
        <HStack gap={3} align="flex-end">
          <Box flex={1}>
            <Input
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
      </FormControl>
    </Flex>
  );

  // Reusable query editor content
  const queryEditorContent = (
    <>
      {naturalLanguageSection}
      
      <Text fontSize="md" fontWeight="bold" mb={0} flexShrink={0}>
        <FormattedMessage id="text.query_to_run" />
      </Text>

      <Box flex="0 0 120px" flexShrink={0}>
        <DamQueryInput
          value={query}
          onChange={setQuery}
        />
      </Box>

      <Flex direction={'row'} gap={3} mt={2} flexShrink={0}>
        {actionButtons}
      </Flex>

      {changeRequestFields}

      {/* Query Results */}
      {renderQueryResults()}
    </>
  );

  // If only showing query editor, return just the query editor
  if (showQueryEditor && !showHistory) {
    return (
      <Flex direction={'column'} gap={3} h="full" minH="500px" overflowY="auto">
        {queryEditorContent}
      </Flex>
    );
  }

  // Default: show both query editor and history
  return (
    <>
      <Flex direction="row" gap={4} h="full" minH="500px">
        <Flex direction={'column'} gap={3} flex={2} h="full" minH="500px" overflowY="auto">
          {queryEditorContent}
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
