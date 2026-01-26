import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Collapse,
  Badge,
  Tooltip,
  useColorModeValue,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon
} from '@chakra-ui/react';
import { 
  FiChevronRight, 
  FiChevronDown, 
  FiDatabase, 
  FiTable, 
  FiColumns,
  FiRefreshCw,
  FiKey,
  FiCheck,
} from 'react-icons/fi';
import { FormattedMessage, useIntl } from 'react-intl';
import { DatabaseSchemaDTO, TableSchemaDTO, ColumnSchemaDTO, MongoDBDatabaseDTO } from '@models/DatabaseSchema';
import { DatabaseType } from '@/constants/enums';

interface DatabaseSchemaBrowserProps {
  readonly schema: DatabaseSchemaDTO | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly onRefresh: () => void;
  readonly onTableClick?: (tableName: string) => void;
  readonly onColumnClick?: (tableName: string, columnName: string) => void;
  readonly databaseType?: DatabaseType | null; // Optional: helps determine MongoDB vs SQL
}

interface TableNodeProps {
  readonly table: TableSchemaDTO;
  readonly isExpanded: boolean;
  readonly onToggle: () => void;
  readonly onTableClick?: (tableName: string) => void;
  readonly onColumnClick?: (tableName: string, columnName: string) => void;
}

interface ColumnNodeProps {
  readonly column: ColumnSchemaDTO;
  readonly tableName: string;
  readonly onColumnClick?: (tableName: string, columnName: string) => void;
}

const ColumnNode: React.FC<ColumnNodeProps> = ({ column, tableName, onColumnClick }) => {
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.300');
  const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');

  const getColumnIcon = () => {
    if (column.columnKey === 'PRI') return <Icon as={FiKey} boxSize={3} />;
    if (column.columnKey === 'UNI') return <Icon as={FiCheck} boxSize={3} />;
    return <Icon as={FiColumns} boxSize={3} />;
  };

  const getColumnBadgeColor = () => {
    if (column.columnKey === 'PRI') return 'red';
    if (column.columnKey === 'UNI') return 'blue';
    if (column.columnKey === 'MUL') return 'orange';
    return 'gray';
  };

  const getColumnBadgeText = () => {
    if (column.columnKey === 'PRI') return 'PK';
    if (column.columnKey === 'UNI') return 'UK';
    if (column.columnKey === 'MUL') return 'FK';
    return null;
  };

  const handleClick = () => {
    if (onColumnClick) {
      onColumnClick(tableName, column.columnName);
    }
  };

  return (
    <Box
      pl={8}
      py={1}
      cursor="pointer"
      _hover={{ bg: hoverBg }}
      onClick={handleClick}
      borderLeft="1px solid"
      borderLeftColor={borderColor}
      ml={2}
    >
      <HStack spacing={2} align="center">
        {getColumnIcon()}
        <Text fontSize="sm" fontWeight="medium" color={textColor} mb={0}>
          {column.columnName}
        </Text>
        <Badge size="sm" colorScheme={getColumnBadgeColor()} fontSize="xs">
          {getColumnBadgeText()}
        </Badge>
        <Text fontSize="xs" color={secondaryTextColor} mb={0}>
          {column.dataType}
        </Text>
        {!column.isNullable && (
          <Badge size="sm" colorScheme="red" fontSize="xs">
            NOT NULL
          </Badge>
        )}
        {column.extra && (
          <Badge size="sm" colorScheme="purple" fontSize="xs">
            {column.extra}
          </Badge>
        )}
      </HStack>
      {column.columnComment && (
        <Text fontSize="xs" color={secondaryTextColor} pl={6} mt={0.5} mb={0}>
          {column.columnComment}
        </Text>
      )}
    </Box>
  );
};

const TableNode: React.FC<TableNodeProps> = ({ 
  table, 
  isExpanded, 
  onToggle, 
  onTableClick, 
  onColumnClick 
}) => {
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.300');
  const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');

  const handleTableClick = () => {
    if (onTableClick) {
      onTableClick(table.tableName);
    }
  };

  return (
    <Box>
      <HStack
        spacing={2}
        py={2}
        px={2}
        cursor="pointer"
        _hover={{ bg: hoverBg }}
        borderRadius="md"
        onClick={handleTableClick}
      >
        <IconButton
          size="xs"
          variant="ghost"
          icon={isExpanded ? <Icon as={FiChevronDown} /> : <Icon as={FiChevronRight} />}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-label={isExpanded ? 'Collapse table' : 'Expand table'}
        />
        <Icon as={FiTable} boxSize={4} />
        <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={0}>
          {table.tableName}
        </Text>
        <Badge size="sm" colorScheme="blue" fontSize="xs">
          {table.columnCount} cols
        </Badge>
        {table.tableType && table.tableType !== 'TABLE' && (
          <Badge size="sm" colorScheme="purple" fontSize="xs">
            {table.tableType}
          </Badge>
        )}
      </HStack>
      
      {table.tableComment && (
        <Text fontSize="xs" color={secondaryTextColor} pl={8} mb={0}>
          {table.tableComment}
        </Text>
      )}

      <Collapse in={isExpanded}>
        <VStack spacing={0} align="stretch" pl={2}>
          {table.columns.length > 0 ? (
            table.columns.map((column) => (
              <ColumnNode
                key={column.columnName}
                column={column}
                tableName={table.tableName}
                onColumnClick={onColumnClick}
              />
            ))
          ) : (
            <Box p={3} pl={6}>
              <Text fontSize="sm" color={secondaryTextColor} fontStyle="italic" mb={0}>
                <FormattedMessage id="text.no_column_permission" defaultMessage="You do not have permission to view columns for this table" />
              </Text>
            </Box>
          )}
        </VStack>
      </Collapse>
    </Box>
  );
};

// MongoDB Database Node Component
interface MongoDBDatabaseNodeProps {
  readonly database: MongoDBDatabaseDTO;
  readonly isExpanded: boolean;
  readonly onToggle: () => void;
  readonly onTableClick?: (tableName: string) => void;
  readonly onColumnClick?: (tableName: string, columnName: string) => void;
  readonly expandedTables: Set<string>;
  readonly toggleTable: (tableName: string) => void;
}

const MongoDBDatabaseNode: React.FC<MongoDBDatabaseNodeProps> = ({
  database,
  isExpanded,
  onToggle,
  onTableClick,
  onColumnClick,
  expandedTables,
  toggleTable
}) => {
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.300');

  return (
    <Box>
      <HStack
        spacing={2}
        p={2}
        cursor="pointer"
        _hover={{ bg: hoverBg }}
        onClick={onToggle}
      >
        <Icon as={isExpanded ? FiChevronDown : FiChevronRight} boxSize={4} />
        <Icon as={FiDatabase} boxSize={4} color="green" />
        <Text fontSize="sm" fontWeight="bold" color={textColor} mb={0}>
          {database.name}
        </Text>
        <Badge size="sm" colorScheme="blue" fontSize="xs">
          {database.tables.length} {database.tables.length === 1 ? 'collection' : 'collections'}
        </Badge>
      </HStack>
      <Collapse in={isExpanded}>
        <VStack spacing={1} align="stretch" pl={4}>
          {database.tables.map((collection) => {
            const fullCollectionName = `${database.name}.${collection.tableName}`;
            return (
              <TableNode
                key={fullCollectionName}
                table={collection}
                isExpanded={expandedTables.has(fullCollectionName)}
                onToggle={() => toggleTable(fullCollectionName)}
                onTableClick={onTableClick ? () => onTableClick(fullCollectionName) : undefined}
                onColumnClick={onColumnClick}
              />
            );
          })}
        </VStack>
      </Collapse>
    </Box>
  );
};

export const DatabaseSchemaBrowser: React.FC<DatabaseSchemaBrowserProps> = ({
  schema,
  isLoading,
  error,
  onRefresh,
  onTableClick,
  onColumnClick,
  databaseType
}) => {
  const intl = useIntl();
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [expandedDatabases, setExpandedDatabases] = useState<Set<string>>(new Set());
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.300');
  const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');

  // Detect if MongoDB based on schema structure or databaseType prop
  const isMongoDB = databaseType === DatabaseType.MONGODB || (schema?.databases !== undefined && schema.databases.length > 0);

  const toggleTable = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  const toggleDatabase = (databaseName: string) => {
    const newExpanded = new Set(expandedDatabases);
    if (newExpanded.has(databaseName)) {
      newExpanded.delete(databaseName);
    } else {
      newExpanded.add(databaseName);
    }
    setExpandedDatabases(newExpanded);
  };

  const handleTableClick = (tableName: string) => {
    if (onTableClick) {
      onTableClick(tableName);
    }
  };

  const handleColumnClick = (tableName: string, columnName: string) => {
    if (onColumnClick) {
      onColumnClick(tableName, columnName);
    }
  };

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <AlertTitle>Error loading schema:</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Box p={4} textAlign="center">
        <Spinner size="lg" />
        <Text mt={2} color={secondaryTextColor} mb={0}>
          <FormattedMessage id="text.loading_schema" />
        </Text>
      </Box>
    );
  }

  if (!schema) {
    return (
      <Box p={4} textAlign="center">
        <Text color={secondaryTextColor} mb={0}>
          <FormattedMessage id="text.no_schema_data" />
        </Text>
      </Box>
    );
  }

  // Render SQL tables if available
  const renderSqlTables = () => {
    if (!schema.tables) {
      return null;
    }
    return schema.tables.map((table) => (
      <TableNode
        key={table.tableName}
        table={table}
        isExpanded={expandedTables.has(table.tableName)}
        onToggle={() => toggleTable(table.tableName)}
        onTableClick={handleTableClick}
        onColumnClick={handleColumnClick}
      />
    ));
  };

  return (
    <Box bg={bgColor} borderRadius="md" border="1px solid" borderColor={borderColor} h="full">
      {/* Header */}
      <Flex justify="space-between" align="center" p={3} borderBottom="1px solid" borderBottomColor={borderColor}>
        <HStack spacing={2}>
          <Icon as={FiDatabase} boxSize={5} color="green" />
          <VStack spacing={0} align="start">
            <Text fontSize="lg" fontWeight="bold" color={textColor} mb={0}>
              <FormattedMessage id="text.database_schema" />
            </Text>
            <Text fontSize="xs" color={secondaryTextColor} mb={0}>
              {isMongoDB 
                ? `${schema.databases?.length || 0} databases • ${schema.totalTables} collections • ${schema.totalColumns} fields`
                : `${schema.databaseName || 'N/A'} • ${schema.totalTables} tables • ${schema.totalColumns} columns`
              }
            </Text>
          </VStack>
        </HStack>
        <Tooltip label={intl.formatMessage({ id: 'text.refresh_schema' })}>
          <IconButton
            size="sm"
            variant="ghost"
            icon={<Icon as={FiRefreshCw} />}
            onClick={onRefresh}
            aria-label="Refresh schema"
          />
        </Tooltip>
      </Flex>

      {/* Schema Tree */}
      <Box flex="1" maxH="calc(100vh - 350px)" overflowY="auto" overflowX="auto" p={2}>
        <VStack spacing={1} align="stretch">
          {isMongoDB && schema.databases ? (
            // MongoDB: Display databases and their collections
            schema.databases.map((database) => (
              <MongoDBDatabaseNode
                key={database.name}
                database={database}
                isExpanded={expandedDatabases.has(database.name)}
                onToggle={() => toggleDatabase(database.name)}
                onTableClick={handleTableClick}
                onColumnClick={handleColumnClick}
                expandedTables={expandedTables}
                toggleTable={toggleTable}
              />
            ))
          ) : (
            renderSqlTables()
          )}
        </VStack>
      </Box>
    </Box>
  );
};
