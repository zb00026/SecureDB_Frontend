import { useRef, useState } from "react";
import { 
  Box, 
  Flex, 
  Divider,
  useBreakpointValue,
  IconButton,
  Icon
} from "@chakra-ui/react";
import { FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown } from "react-icons/fi";
import { useQueryAssetData } from "@common/hooks/useQueryAssetPage";
import { SharedQueryComponent } from "@common/components/SharedQueryComponent";
import { DatabaseSchemaBrowser } from "@common/components/DatabaseSchemaBrowser";
import { useDatabaseSchema } from "@common/hooks/useDatabaseSchema";
import { AssetDetailsSection } from "@pages/developer/components/asset_detail_section";
import { DamCardDivider, useDamToast } from "@common/index";
import { DamBasePage } from "@common/components/DamBasePage";

interface QueryAssetPageProps {
  readonly userType: "developer" | "asset_owner";
}

export function QueryAssetPage({ userType }: QueryAssetPageProps) {
  const { currentAsset, accessRequestId } = useQueryAssetData({ userType });
  const queryComponentRef = useRef<{ setQuery: (query: string) => void } | null>(null);
  const { showSuccess } = useDamToast();
  const [isSchemaOpen, setIsSchemaOpen] = useState(true);

  // Responsive breakpoints
  const isLargeScreen = useBreakpointValue({ base: false, xl: true });

  // Database schema browser
  const { schema, isLoading: isSchemaLoading, error: schemaError, fetchSchema } = useDatabaseSchema({
    requestId: userType === "developer" ? accessRequestId : undefined,
    assetId: currentAsset?.id?.toString(),
    userType
  });

  // Schema browser handlers
  const handleTableClick = (tableName: string) => {
    const selectQuery = `SELECT * FROM ${tableName} LIMIT 10;`;
    if (queryComponentRef.current) {
      queryComponentRef.current.setQuery(selectQuery);
    }
    showSuccess({
      description: `Generated query for table: ${tableName}`
    });
  };

  const handleColumnClick = (tableName: string, columnName: string) => {
    const selectQuery = `SELECT ${columnName} FROM ${tableName} LIMIT 10;`;
    if (queryComponentRef.current) {
      queryComponentRef.current.setQuery(selectQuery);
    }
    showSuccess({
      description: `Generated query for column: ${columnName}`
    });
  };

  return (
    <DamBasePage title="Query Asset">
      <Flex flexDir="column" w="full" px={6}>
        <Flex justify="space-between" align="center" w="full">
          <AssetDetailsSection
            asset={currentAsset}
            textSize="md"
            pb={0}
          />
        </Flex>
      </Flex>

      <DamCardDivider />

      {isLargeScreen ? (
        // Large screen: 3-column layout (Schema | Toggle | Query)
        <Flex direction="row" gap={4} h="calc(100vh - 200px)" p={6}>
          {/* Left Panel - Schema Browser (conditional) */}
          {isSchemaOpen && (
            <Box flex="0 0 30%" minW="300px" h="full">
              <DatabaseSchemaBrowser
                schema={schema}
                isLoading={isSchemaLoading}
                error={schemaError}
                onRefresh={fetchSchema}
                onTableClick={handleTableClick}
                onColumnClick={handleColumnClick}
              />
            </Box>
          )}

          {/* Middle Toggle Control (always visible) */}
          <Box flex="0 0 32px" display="flex" alignItems="center" justifyContent="center">
            <IconButton
              size="sm"
              variant="ghost"
              aria-label={isSchemaOpen ? 'Collapse schema' : 'Expand schema'}
              onClick={() => setIsSchemaOpen((v) => !v)}
              icon={<Icon as={isSchemaOpen ? FiChevronLeft : FiChevronRight} />}
            />
          </Box>

          {/* Query Editor and History Panel */}
          <Box flex="1" minW="650px">
            <SharedQueryComponent
              ref={queryComponentRef}
              asset={currentAsset}
              accessRequestId={accessRequestId}
              userType={userType}
            />
          </Box>
        </Flex>
      ) : (
        // Small/Medium screen: 2-row layout (Schema | Toggle | Query)
        <Flex direction="column" gap={4} p={6}>
          {/* Top Panel - Schema Browser (conditional) */}
          {isSchemaOpen && (
            <Box flex="0 0 40%" minH="300px">
              <DatabaseSchemaBrowser
                schema={schema}
                isLoading={isSchemaLoading}
                error={schemaError}
                onRefresh={fetchSchema}
                onTableClick={handleTableClick}
                onColumnClick={handleColumnClick}
              />
            </Box>
          )}

          {/* Middle Toggle Control (always visible) */}
          <Box display="flex" alignItems="center" justifyContent="center">
            <IconButton
              size="sm"
              variant="ghost"
              aria-label={isSchemaOpen ? 'Collapse schema' : 'Expand schema'}
              onClick={() => setIsSchemaOpen((v) => !v)}
              icon={<Icon as={isSchemaOpen ? FiChevronUp : FiChevronDown} />}
            />
          </Box>

          {/* Bottom Panel - SharedQueryComponent */}
          <Box flex="1" minH="400px">
            <SharedQueryComponent
              ref={queryComponentRef}
              asset={currentAsset}
              accessRequestId={accessRequestId}
              userType={userType}
            />
          </Box>
        </Flex>
      )}
    </DamBasePage>
  );
}
