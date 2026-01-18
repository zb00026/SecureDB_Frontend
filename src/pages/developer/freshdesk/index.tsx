import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Flex,
  VStack,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  Select,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { DamBasePage } from '@common/components/DamBasePage';
import { useDamToast } from '@common/index';
import { freshdeskApi } from '@/services/freshdeskApi';
import { Asset } from '@models/assets/Asset';
import {
  FreshdeskAccessRequestDTO,
  FreshdeskDatabaseSchemaDTO,
} from '@models/FreshdeskModels';
import { DatabaseSchemaBrowser } from '@common/components/DatabaseSchemaBrowser';
import { DatabaseSchemaDTO } from '@models/DatabaseSchema';
import { AssetDetailsSection } from '@pages/developer/components/asset_detail_section';
import { SharedQueryComponent } from '@common/components/SharedQueryComponent';
import { SharedQueryComponentRef } from '@models/QueryModels';
import { useIntl } from 'react-intl';

export const isSearchable = true;
export const displayName = 'Freshdesk Integration';

export function Component() {
  const intl = useIntl();
  const { showError, showSuccess } = useDamToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [accessRequests, setAccessRequests] = useState<FreshdeskAccessRequestDTO[]>([]);
  const [selectedAccessRequestId, setSelectedAccessRequestId] = useState<number | null>(null);
  const [selectedAccessRequest, setSelectedAccessRequest] = useState<FreshdeskAccessRequestDTO | null>(null);
  const [schema, setSchema] = useState<DatabaseSchemaDTO | null>(null);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const queryComponentRef = useRef<SharedQueryComponentRef | null>(null);

  // Load assets on mount
  useEffect(() => {
    const loadAssets = async () => {
      try {
        setIsLoadingAssets(true);
        const assetsData = await freshdeskApi.getAssets();
        setAssets(assetsData);
      } catch (error: any) {
        console.error('Failed to load assets:', error);
        showError({
          description: error?.response?.data?.error || error?.message || 'Failed to load assets',
        });
      } finally {
        setIsLoadingAssets(false);
      }
    };

    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update selected asset when ID changes
  useEffect(() => {
    if (selectedAssetId && assets.length > 0) {
      const asset = assets.find((a) => a.id === selectedAssetId);
      setSelectedAsset(asset || null);
    } else {
      setSelectedAsset(null);
    }
  }, [selectedAssetId, assets]);

  // Load access requests when asset is selected
  useEffect(() => {
    if (selectedAssetId) {
      const loadAccessRequests = async () => {
        try {
          setIsLoadingRequests(true);
          const requests = await freshdeskApi.getAccessRequests(selectedAssetId);
          setAccessRequests(requests);
          // Auto-select first request if available
          if (requests.length > 0) {
            setSelectedAccessRequestId(requests[0].id);
          } else {
            setSelectedAccessRequestId(null);
          }
        } catch (error: any) {
          console.error('Failed to load access requests:', error);
          showError({
            description: error?.response?.data?.error || error?.message || 'Failed to load access requests',
          });
        } finally {
          setIsLoadingRequests(false);
        }
      };

      loadAccessRequests();
    } else {
      setAccessRequests([]);
      setSelectedAccessRequestId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAssetId]);

  // Update selected access request when ID changes
  useEffect(() => {
    if (selectedAccessRequestId && accessRequests.length > 0) {
      const request = accessRequests.find((r) => r.id === selectedAccessRequestId);
      setSelectedAccessRequest(request || null);
    } else {
      setSelectedAccessRequest(null);
    }
  }, [selectedAccessRequestId, accessRequests]);

  // Transform Freshdesk schema to DatabaseSchemaDTO format
  const transformSchema = useCallback((freshdeskSchema: FreshdeskDatabaseSchemaDTO): DatabaseSchemaDTO => {
    return {
      databaseName: selectedAsset?.databaseName || '',
      tables: freshdeskSchema.tables.map((table) => ({
        tableName: table.name,
        tableType: 'BASE TABLE',
        tableComment: null,
        schema: selectedAsset?.databaseName || '',
        columnCount: table.columns.length,
        columns: table.columns.map((col, index) => ({
          columnName: col.name,
          dataType: col.type,
          columnType: col.type,
          isNullable: col.nullable,
          columnDefault: null,
          columnComment: null,
          columnKey: null,
          extra: null,
          ordinalPosition: index + 1,
        })),
      })),
      totalTables: freshdeskSchema.totalTables,
      totalColumns: freshdeskSchema.totalColumns,
    };
  }, [selectedAsset]);

  // Load schema when access request is selected
  useEffect(() => {
    if (selectedAccessRequestId) {
      const loadSchema = async () => {
        try {
          setIsLoadingSchema(true);
          setSchemaError(null);
          const freshdeskSchema = await freshdeskApi.getSchema(selectedAccessRequestId);
          const transformedSchema = transformSchema(freshdeskSchema);
          setSchema(transformedSchema);
        } catch (error: any) {
          console.error('Failed to load schema:', error);
          setSchemaError(error?.response?.data?.error || error?.message || 'Failed to load database schema');
        } finally {
          setIsLoadingSchema(false);
        }
      };

      loadSchema();
    } else {
      setSchema(null);
      setSchemaError(null);
    }
  }, [selectedAccessRequestId, transformSchema]);

  // Handle table click in schema browser
  const handleTableClick = useCallback(
    (tableName: string) => {
      const selectQuery = `SELECT * FROM ${tableName} LIMIT 10;`;
      if (queryComponentRef.current) {
        queryComponentRef.current.setQuery(selectQuery);
      }
      showSuccess({
        description: `Generated query for table: ${tableName}`,
      });
    },
    [showSuccess]
  );

  // Handle column click in schema browser
  const handleColumnClick = useCallback(
    (tableName: string, columnName: string) => {
      const selectQuery = `SELECT ${columnName} FROM ${tableName} LIMIT 10;`;
      if (queryComponentRef.current) {
        queryComponentRef.current.setQuery(selectQuery);
      }
      showSuccess({
        description: `Generated query for column: ${columnName}`,
      });
    },
    [showSuccess]
  );

  return (
    <DamBasePage title={intl.formatMessage({ id: 'text.freshdesk_integration' })}>
      <VStack spacing={6} align="stretch" p={6}>
        {/* Info Alert */}
        <Alert status="info">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold" mb={1}>
              Freshdesk Integration
            </Text>
            <Text fontSize="sm">
              This page provides database query functionality for Freshdesk integration. Select an asset and access request to start querying.
            </Text>
          </Box>
        </Alert>

        {/* Asset Selection */}
        <Box>
          <FormControl>
            <FormLabel>
              <Text fontWeight="bold">Select Database Asset</Text>
            </FormLabel>
            {isLoadingAssets ? (
              <Flex align="center" gap={2}>
                <Spinner size="sm" />
                <Text fontSize="sm">Loading assets...</Text>
              </Flex>
            ) : (
              <Select
                placeholder="Select an asset"
                value={selectedAssetId || ''}
                onChange={(e) => setSelectedAssetId(e.target.value ? Number(e.target.value) : null)}
              >
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.databaseType}) - {asset.hostAddress}:{asset.portNumber}
                  </option>
                ))}
              </Select>
            )}
          </FormControl>
        </Box>

        {/* Access Request Selection */}
        {selectedAsset && (
          <Box>
            <FormControl>
              <FormLabel>
                <Text fontWeight="bold">Select Access Request</Text>
              </FormLabel>
              {isLoadingRequests && (
                <Flex align="center" gap={2}>
                  <Spinner size="sm" />
                  <Text fontSize="sm">Loading access requests...</Text>
                </Flex>
              )}
              {!isLoadingRequests && accessRequests.length === 0 && (
                <Alert status="warning">
                  <AlertIcon />
                  <Text fontSize="sm">No approved access requests found for this asset.</Text>
                </Alert>
              )}
              {!isLoadingRequests && accessRequests.length > 0 && (
                <Select
                  placeholder="Select an access request"
                  value={selectedAccessRequestId || ''}
                  onChange={(e) => setSelectedAccessRequestId(e.target.value ? Number(e.target.value) : null)}
                >
                  {accessRequests.map((request) => (
                    <option key={request.id} value={request.id}>
                      {request.assetName} - {request.requestedUsername} (Expires: {new Date(request.expiryDate).toLocaleDateString()})
                    </option>
                  ))}
                </Select>
              )}
            </FormControl>
          </Box>
        )}

        {/* Asset Details */}
        {selectedAsset && (
          <Box>
            <AssetDetailsSection asset={selectedAsset} textSize="md" pb={2} />
          </Box>
        )}

        {/* Schema Browser */}
        {selectedAccessRequest && schema && (
          <Box>
            <DatabaseSchemaBrowser
              schema={schema}
              isLoading={isLoadingSchema}
              error={schemaError}
              onRefresh={async () => {
                if (selectedAccessRequestId) {
                  try {
                    setIsLoadingSchema(true);
                    setSchemaError(null);
                    const freshdeskSchema = await freshdeskApi.getSchema(selectedAccessRequestId);
                    const transformedSchema = transformSchema(freshdeskSchema);
                    setSchema(transformedSchema);
                  } catch (error: any) {
                    setSchemaError(error?.response?.data?.error || error?.message || 'Failed to load schema');
                  } finally {
                    setIsLoadingSchema(false);
                  }
                }
              }}
              onTableClick={handleTableClick}
              onColumnClick={handleColumnClick}
            />
          </Box>
        )}

        {/* Query Component */}
        {selectedAsset && selectedAccessRequest && (
          <Box>
            <SharedQueryComponent
              ref={queryComponentRef}
              asset={selectedAsset}
              accessRequestId={String(selectedAccessRequest.id)}
              userType="developer"
              customApiEndpoint="/api/freshdesk/run-query"
            />
          </Box>
        )}

        {!selectedAsset && !isLoadingAssets && (
          <Alert status="info">
            <AlertIcon />
            <Text>Please select a database asset to start querying.</Text>
          </Alert>
        )}
      </VStack>
    </DamBasePage>
  );
}

