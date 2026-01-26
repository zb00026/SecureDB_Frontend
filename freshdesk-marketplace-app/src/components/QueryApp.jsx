/**
 * Main Query App Component for Freshdesk Marketplace
 * This is a minimal implementation that uses Hagrids backend API
 * 
 * API Documentation: https://ami.hagrids.com/api/freshdesk
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

export function QueryApp({ apiBaseUrl, freshdeskUser, client }) {
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [assets, setAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [accessRequests, setAccessRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [schema, setSchema] = useState(null);
  const [query, setQuery] = useState('');
  const [queryResults, setQueryResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [isReloadingAssets, setIsReloadingAssets] = useState(false);
  
  // Detect if running in full-screen mode (no client means full-screen)
  const isFullScreen = !client;

  /**
   * Helper function to make API requests
   * Uses native fetch() - backend must have CORS enabled
   */
  const makeRequest = async (url, options = {}) => {
    const method = (options.method || 'GET').toUpperCase();
    
    const fetchOptions = {
      method,
      headers: options.headers || {},
      mode: 'cors',
    };
    
    if (options.body && method !== 'GET') {
      fetchOptions.body = options.body;
    }

    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  };

  /**
   * Load assets available to the developer
   * GET /api/freshdesk/assets
   * Response: Array of asset objects
   */
  const loadAssets = useCallback(async (token, showLoading = false) => {
    if (!apiBaseUrl) {
      console.error('[Hagrids] Cannot load assets: API URL not configured');
      return;
    }

    if (!token) {
      console.error('[Hagrids] Cannot load assets: No authentication token');
      return;
    }

    try {
      if (showLoading) {
        setIsReloadingAssets(true);
      }
      console.log('[Hagrids] Loading assets with token:', token ? 'present' : 'missing');
      const data = await makeRequest(`${apiBaseUrl}/api/freshdesk/assets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('[Hagrids] Assets loaded:', data);
      setAssets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[Hagrids] Failed to load assets:', error);
      setAssets([]);
    } finally {
      if (showLoading) {
        setIsReloadingAssets(false);
      }
    }
  }, [apiBaseUrl]);

  /**
   * Authenticate with Hagrids backend
   * POST /api/freshdesk/auth
   * Request: { email: string, freshdeskToken?: string }
   * Response: { success: boolean, token: string, user: object, message: string }
   */
  const authenticate = useCallback(async () => {
    // Validate that we have required data
    if (!freshdeskUser || !freshdeskUser.email) {
      setAuthError('User email is not available. Please refresh the page.');
      setIsAuthenticating(false);
      return;
    }
    
    if (!apiBaseUrl) {
      setAuthError('API URL is not configured.');
      setIsAuthenticating(false);
      return;
    }

    try {
      setIsAuthenticating(true);
      setAuthError(null);

      console.log('[Hagrids] Authenticating with email:', freshdeskUser.email);

      const data = await makeRequest(`${apiBaseUrl}/api/freshdesk/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: freshdeskUser.email,
          freshdeskToken: null, // Optional - can be used for additional validation
        }),
      });

      if (data.success && data.token) {
        console.log('[Hagrids] Authentication successful, token received');
        setAuthToken(data.token);
        console.log('[Hagrids] Calling loadAssets...');
        await loadAssets(data.token);
        console.log('[Hagrids] loadAssets completed');
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('[Hagrids] Authentication error:', error);
      const errorMessage = error?.message || error?.data?.message || 'Failed to authenticate with Hagrids';
      setAuthError(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  }, [apiBaseUrl, freshdeskUser?.email, loadAssets]);

  // Run authentication on mount and when dependencies change
  useEffect(() => {
    authenticate();
  }, [authenticate]);

  /**
   * Load access requests when asset is selected
   * GET /api/freshdesk/access-requests?assetId=123
   * Response: Array of { id, assetId, assetName, status, expiryDate, requestedUsername }
   */
  useEffect(() => {
    if (selectedAssetId && authToken) {
      const loadRequests = async () => {
        try {
          setAccessRequests([]);
          setSelectedRequestId(null);
          setSchema(null);
          
          const data = await makeRequest(`${apiBaseUrl}/api/freshdesk/access-requests?assetId=${selectedAssetId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          });

          const requests = Array.isArray(data) ? data : [];
          setAccessRequests(requests);
          
          // Auto-select first approved request
          const approvedRequest = requests.find(r => r.status === 'APPROVED');
          if (approvedRequest) {
            setSelectedRequestId(approvedRequest.id);
          } else if (requests.length > 0) {
            setSelectedRequestId(requests[0].id);
          }
        } catch (error) {
          console.error('Failed to load access requests:', error);
          setAccessRequests([]);
        }
      };

      loadRequests();
    } else {
      setAccessRequests([]);
      setSelectedRequestId(null);
      setSchema(null);
    }
  }, [selectedAssetId, authToken, apiBaseUrl]);

  /**
   * Load schema when request is selected
   * GET /api/freshdesk/schema?requestId=456
   * Response: { databaseName, tables: [...], totalTables, totalColumns }
   * Each table: { tableName, tableType, tableComment, columns: [...], columnCount, schema }
   * Each column: { columnName, dataType, columnType, isNullable, columnDefault, columnComment, columnKey, extra, ordinalPosition }
   */
  useEffect(() => {
    if (selectedRequestId && authToken) {
      const loadSchema = async () => {
        try {
          setIsLoadingSchema(true);
          setSchema(null);
          
          const data = await makeRequest(`${apiBaseUrl}/api/freshdesk/schema?requestId=${selectedRequestId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          });

          setSchema(data);
        } catch (error) {
          console.error('Failed to load schema:', error);
          setSchema(null);
        } finally {
          setIsLoadingSchema(false);
        }
      };

      loadSchema();
    } else {
      setSchema(null);
    }
  }, [selectedRequestId, authToken, apiBaseUrl]);

  /**
   * Normalize query response to handle different API response formats
   */
  const normalizeQueryResponse = useCallback((data, originalQuery) => {
    // Handle different response formats:
    // Format 1: { totalQueries, results: [{ headers, data, query, ... }] }
    // Format 2: { headers, data, query, ... }
    let resultData = data;
    
    if (data.results && Array.isArray(data.results) && data.results.length > 0) {
      resultData = data.results[0];
      console.log('[Hagrids] Using nested results[0] format');
    }
    
    return {
      query: resultData.query || originalQuery,
      headers: Array.isArray(resultData.headers) ? resultData.headers : [],
      data: Array.isArray(resultData.data) ? resultData.data : [],
    };
  }, []);

  /**
   * Execute query
   * POST /api/freshdesk/run-query
   * Request: { requestId, assetId, query, ticketReference?, changeDescription?, approvalStatus?, rejectReason?, isChangeRequest? }
   * Response: { query, headers: string[], data: object[] }
   */
  const runQuery = async () => {
    if (!query.trim() || !selectedAssetId || !selectedRequestId || !authToken) {
      alert('Please select an asset, access request, and enter a query');
      return;
    }

    try {
      setIsLoading(true);
      setQueryResults(null);
      
      console.log('[Hagrids] Executing query:', {
        requestId: selectedRequestId,
        assetId: selectedAssetId,
        query: query.trim(),
      });
      
      const data = await makeRequest(`${apiBaseUrl}/api/freshdesk/run-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          requestId: selectedRequestId,
          assetId: selectedAssetId,
          query: query.trim(),
          isChangeRequest: false,
        }),
      });

      console.log('[Hagrids] Query response:', data);
      const normalizedResults = normalizeQueryResponse(data, query.trim());
      console.log('[Hagrids] Normalized results:', normalizedResults);
      setQueryResults(normalizedResults);
    } catch (error) {
      console.error('[Hagrids] Query execution error:', error);
      const errorMessage = error?.message || error?.data?.message || 'Failed to execute query';
      alert(`Error: ${errorMessage}`);
      setQueryResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle table click to generate sample query
   */
  const handleTableClick = (tableName) => {
    const selectedAsset = assets.find(a => a.id === selectedAssetId);
    const isMongoDB = selectedAsset?.databaseType === 'MONGODB';
    const sampleQuery = isMongoDB 
      ? `db.${tableName}.find({}).limit(10)`
      : `SELECT * FROM ${tableName} LIMIT 10;`;
    setQuery(sampleQuery);
  };

  /**
   * Render loading state
   */
  const renderLoadingState = () => (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ marginBottom: '10px' }}>⏳</div>
      <div>Authenticating with Hagrids...</div>
    </div>
  );

  /**
   * Render error state
   */
  const renderErrorState = () => (
    <div style={{ padding: '15px', color: '#d32f2f', background: '#fff', margin: '10px', borderRadius: '4px', border: '1px solid #ffcdd2' }}>
      <h3 style={{ marginBottom: '10px', fontSize: '14px' }}>Authentication Failed</h3>
      <p style={{ fontSize: '12px', marginBottom: '10px', wordBreak: 'break-word' }}>{authError}</p>
      <div style={{ fontSize: '11px', color: '#666', marginBottom: '15px' }}>
        Please ensure:
        <ul style={{ marginTop: '5px', paddingLeft: '20px', lineHeight: '1.6', marginBottom: '15px' }}>
          <li>Your email ({freshdeskUser?.email || 'N/A'}) matches your Hagrids account</li>
          <li>You have DEVELOPER role in Hagrids</li>
          <li>Your account is active</li>
          <li>The API URL is correctly configured</li>
        </ul>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
        <button
          onClick={() => {
            console.log('[Hagrids] Retry button clicked');
            authenticate();
          }}
          disabled={isAuthenticating}
          style={{
            padding: '10px 20px',
            fontSize: '13px',
            backgroundColor: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: isAuthenticating ? 'not-allowed' : 'pointer',
            opacity: isAuthenticating ? 0.6 : 1,
            fontWeight: '500',
            minWidth: '150px',
          }}
          type="button"
        >
          {isAuthenticating ? '⏳ Retrying...' : '🔄 Retry Login'}
        </button>
      </div>
    </div>
  );

  // Early returns for loading and error states
  if (isAuthenticating) {
    return renderLoadingState();
  }

  if (authError) {
    return renderErrorState();
  }

  /**
   * Render asset selection section
   */
  const renderAssetSelection = () => {
    const handleReload = () => {
      if (authToken) {
        loadAssets(authToken, true);
      }
    };

    return (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <label htmlFor="asset-select" style={{ fontWeight: '600', fontSize: '12px' }}>
            Database Asset
          </label>
          <button
            onClick={handleReload}
            disabled={isReloadingAssets || !authToken}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              backgroundColor: '#f5f5f5',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: (isReloadingAssets || !authToken) ? 'not-allowed' : 'pointer',
              opacity: (isReloadingAssets || !authToken) ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            type="button"
            title="Reload assets list"
          >
            {isReloadingAssets ? '⏳' : '🔄'} {isReloadingAssets ? 'Loading...' : 'Reload'}
          </button>
        </div>
        <select
          id="asset-select"
          value={selectedAssetId || ''}
          onChange={(e) => setSelectedAssetId(e.target.value ? Number(e.target.value) : null)}
          disabled={isReloadingAssets}
          style={{ 
            width: '100%', 
            padding: '6px 8px', 
            borderRadius: '4px', 
            border: '1px solid #ddd', 
            fontSize: '12px',
            opacity: isReloadingAssets ? 0.6 : 1,
          }}
        >
          <option value="">-- Select Asset --</option>
          {assets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.name} ({asset.databaseType})
            </option>
          ))}
        </select>
        {assets.length === 0 && !isReloadingAssets && (
          <div style={{ marginTop: '4px', fontSize: '11px', color: '#666' }}>
            No assets available. Request access from an asset owner.
          </div>
        )}
      </div>
    );
  };

  /**
   * Render access request selection section
   */
  const renderAccessRequestSelection = () => {
    if (!selectedAssetId) {
      return null;
    }

    return (
      <div style={{ marginBottom: '12px' }}>
        <label htmlFor="request-select" style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '12px' }}>
          Access Request
        </label>
        <select
          id="request-select"
          value={selectedRequestId || ''}
          onChange={(e) => setSelectedRequestId(e.target.value ? Number(e.target.value) : null)}
          style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px' }}
        >
          <option value="">-- Select Request --</option>
          {accessRequests.map((request) => (
            <option key={request.id} value={request.id}>
              {request.requestedUsername} ({request.status})
            </option>
          ))}
        </select>
        {accessRequests.length === 0 && (
          <div style={{ marginTop: '4px', fontSize: '11px', color: '#f57c00' }}>
            No approved access requests for this asset.
          </div>
        )}
      </div>
    );
  };

  /**
   * Render asset and request details
   */
  const renderAssetDetails = () => {
    const selectedAsset = assets.find(a => a.id === selectedAssetId);
    const selectedRequest = accessRequests.find(r => r.id === selectedRequestId);

    if (!selectedAsset || !selectedRequest) {
      return null;
    }

    return (
      <div style={{ marginBottom: '12px', padding: '8px', background: '#f5f5f5', borderRadius: '4px', fontSize: '11px' }}>
        <div><strong>Host:</strong> {selectedAsset.hostAddress}:{selectedAsset.portNumber}</div>
        <div><strong>Database:</strong> {selectedAsset.databaseName || 'N/A'}</div>
        <div><strong>Type:</strong> {selectedAsset.databaseType}</div>
        <div><strong>Username:</strong> {selectedRequest.requestedUsername}</div>
        {selectedRequest.expiryDate && (
          <div><strong>Expires:</strong> {new Date(selectedRequest.expiryDate).toLocaleDateString()}</div>
        )}
      </div>
    );
  };

  /**
   * Get schema browser styles based on fullscreen mode
   */
  const getSchemaBrowserStyles = () => {
    if (isFullScreen) {
      return {
        marginBottom: '16px',
        padding: '12px',
        fontSize: '13px',
        maxHeight: '300px',
        headerFontSize: '15px',
        tableLimit: 20,
        tablePadding: '6px 10px',
      };
    }
    return {
      marginBottom: '12px',
      padding: '8px',
      fontSize: '11px',
      maxHeight: '150px',
      headerFontSize: '12px',
      tableLimit: 10,
      tablePadding: '3px 6px',
    };
  };

  /**
   * Render schema table item
   */
  const renderSchemaTableItem = (table, styles) => {
    const handleMouseEnter = (e) => {
      e.target.style.background = '#e3f2fd';
    };

    const handleMouseLeave = (e) => {
      e.target.style.background = 'transparent';
    };

    const columnCount = table.columnCount || table.columns?.length || 0;

    return (
      <button
        key={table.tableName}
        type="button"
        style={{ 
          width: '100%',
          padding: styles.tablePadding, 
          cursor: 'pointer',
          borderRadius: '2px',
          marginBottom: '2px',
          outline: 'none',
          border: 'none',
          background: 'transparent',
          textAlign: 'left',
          fontSize: styles.fontSize,
        }}
        onClick={() => handleTableClick(table.tableName)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        title={`Click to query: ${table.tableName}`}
      >
        📁 <strong>{table.tableName}</strong>
        <span style={{ color: '#666', marginLeft: '4px' }}>
          ({columnCount} cols)
        </span>
        {table.tableType === 'VIEW' && (
          <span style={{ color: '#9c27b0', marginLeft: '4px' }}>[VIEW]</span>
        )}
      </button>
    );
  };

  /**
   * Render schema browser
   */
  const renderSchemaBrowser = () => {
    if (isLoadingSchema) {
      const styles = getSchemaBrowserStyles();
      return (
        <div style={{
          marginBottom: styles.marginBottom,
          padding: styles.padding,
          background: '#e3f2fd',
          borderRadius: '4px',
          fontSize: styles.fontSize,
          textAlign: 'center',
        }}>
          Loading schema...
        </div>
      );
    }

    if (!schema || !schema.tables) {
      return null;
    }

    const styles = getSchemaBrowserStyles();
    const displayedTables = schema.tables.slice(0, styles.tableLimit);
    const remainingCount = schema.tables.length - styles.tableLimit;

    return (
      <div style={{
        marginBottom: styles.marginBottom,
        maxHeight: styles.maxHeight,
        overflowY: 'auto',
        padding: styles.padding,
        background: '#fafafa',
        borderRadius: '4px',
        fontSize: styles.fontSize,
        border: '1px solid #e0e0e0',
      }}>
        <div style={{
          fontWeight: '600',
          marginBottom: '8px',
          fontSize: styles.headerFontSize,
        }}>
          📋 Schema: {schema.totalTables} tables, {schema.totalColumns} columns
        </div>
        <div>
          {displayedTables.map((table) => renderSchemaTableItem(table, styles))}
          {remainingCount > 0 && (
            <div style={{
              color: '#666',
              fontStyle: 'italic',
              padding: styles.tablePadding,
            }}>
              ... and {remainingCount} more tables
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Render query editor
   */
  const renderQueryEditor = () => {
    const selectedAsset = assets.find(a => a.id === selectedAssetId);
    const isMongoDB = selectedAsset?.databaseType === 'MONGODB';

    if (!selectedAssetId || !selectedRequestId) {
      return null;
    }

    return (
      <div style={{ marginBottom: '12px' }}>
        <label htmlFor="query-textarea" style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '12px' }}>
          {isMongoDB ? 'MongoDB Query' : 'SQL Query'}
        </label>
        <textarea
          id="query-textarea"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isMongoDB 
            ? "db.collection.find({}).limit(10)" 
            : "SELECT * FROM table_name LIMIT 10;"}
          rows={isFullScreen ? 8 : 5}
          style={{ 
            width: '100%', 
            padding: isFullScreen ? '12px' : '8px', 
            borderRadius: '4px', 
            border: '1px solid #ddd', 
            fontFamily: 'Consolas, Monaco, monospace', 
            fontSize: isFullScreen ? '13px' : '11px',
            resize: 'vertical',
            minHeight: isFullScreen ? '120px' : '80px',
          }}
        />
        <button
          onClick={runQuery}
          disabled={isLoading || !query.trim()}
          style={{
            marginTop: '8px',
            padding: '6px 12px',
            background: isLoading ? '#ccc' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '12px',
          }}
        >
          {isLoading ? '⏳ Running...' : '▶ Run Query'}
        </button>
      </div>
    );
  };

  /**
   * Render query results table
   */
  const renderQueryResultsTable = () => {
    if (!queryResults.headers || !Array.isArray(queryResults.headers) || queryResults.headers.length === 0) {
      return (
        <div style={{ padding: '10px', background: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107', fontSize: '12px' }}>
          ⚠️ Query executed but no results structure found. Check console for response details.
          <div style={{ marginTop: '5px', fontSize: '10px', color: '#666' }}>
            Response: {JSON.stringify(queryResults, null, 2).substring(0, 200)}...
          </div>
        </div>
      );
    }

    const rowCount = queryResults.data?.length || 0;
    const hasMoreRows = rowCount > 100;
    const displayData = (queryResults.data || []).slice(0, 100);

    return (
      <>
        <h3 style={{ marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
          📊 Results ({rowCount} rows)
        </h3>
        <div style={{ overflowX: 'auto', maxHeight: isFullScreen ? '600px' : '300px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isFullScreen ? '12px' : '10px', background: 'white' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', position: 'sticky', top: 0 }}>
                {queryResults.headers.map((header) => (
                  <th key={String(header)} style={{ padding: '5px 6px', border: '1px solid #ddd', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>
                    {String(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, rIdx) => {
                // Create a unique key from the first column value or row index as fallback
                const firstHeader = queryResults.headers[0];
                const rowKey = firstHeader && row[firstHeader] !== undefined 
                  ? `row-${String(row[firstHeader])}-${rIdx}` 
                  : `row-${rIdx}`;
                
                return (
                  <tr key={rowKey} style={{ background: rIdx % 2 === 0 ? 'white' : '#fafafa' }}>
                    {queryResults.headers.map((header) => {
                      const cellValue = row[header] ?? '';
                      return (
                        <td key={`${String(header)}-${rowKey}`} style={{ padding: '4px 6px', border: '1px solid #ddd', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {String(cellValue)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {hasMoreRows && (
            <div style={{ marginTop: '5px', fontSize: '10px', color: '#666', textAlign: 'center' }}>
              Showing first 100 of {rowCount} rows
            </div>
          )}
          {rowCount === 0 && (
            <div style={{ padding: '10px', textAlign: 'center', color: '#666', fontSize: '11px' }}>
              No rows returned
            </div>
          )}
        </div>
      </>
    );
  };

  /**
   * Render query results section
   */
  const renderQueryResults = () => {
    if (!queryResults) {
      return null;
    }

    return (
      <div style={{ marginTop: '12px' }}>
        {renderQueryResultsTable()}
      </div>
    );
  };

  /**
   * Open query interface in full screen window
   */
  const openFullScreen = () => {
    try {
      // Store data in both sessionStorage (backup) and pass via URL parameters
      const appData = {
        apiBaseUrl,
        freshdeskUser,
        timestamp: Date.now(),
      };
      
      // Store in sessionStorage as backup
      try {
        sessionStorage.setItem('hagrids_query_app_data', JSON.stringify(appData));
      } catch (e) {
        console.warn('[Hagrids] Could not write to sessionStorage:', e);
      }
      
      // Encode data for URL parameters
      const encodedData = encodeURIComponent(JSON.stringify(appData));
      
      // Open new window with full screen interface
      const width = Math.min(globalThis.screen.width - 100, 1400);
      const height = Math.min(globalThis.screen.height - 100, 900);
      const left = (globalThis.screen.width - width) / 2;
      const top = (globalThis.screen.height - height) / 2;
      
      // Construct fullscreen URL - handle both dev and production paths
      let fullScreenUrl;
      const currentPath = globalThis.location.pathname;
      if (currentPath.includes('/app/')) {
        // Production build path
        fullScreenUrl = currentPath.replace(/\/[^/]*$/, '/fullscreen.html');
      } else {
        // Development path
        fullScreenUrl = currentPath.replace(/\/[^/]*$/, '/fullscreen.html');
        if (!fullScreenUrl.startsWith('/')) {
          fullScreenUrl = '/' + fullScreenUrl;
        }
      }
      fullScreenUrl = `${globalThis.location.origin}${fullScreenUrl}?data=${encodedData}`;
      
      globalThis.open(
        fullScreenUrl,
        'HagridsQueryFullScreen',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no`
      );
    } catch (error) {
      console.error('[Hagrids] Failed to open full screen:', error);
      alert('Failed to open full screen. Please check if pop-ups are blocked.');
    }
  };

  // Container styles based on mode
  const containerStyle = isFullScreen
    ? {
        padding: '24px',
        fontSize: '14px',
        maxWidth: '1600px',
        margin: '0 auto',
        minHeight: '100vh',
      }
    : {
        padding: '12px',
        fontSize: '13px',
      };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isFullScreen ? '20px' : '12px', flexDirection: 'column'}}>
        <h2 style={{ margin: 0, fontSize: isFullScreen ? '24px' : '15px', fontWeight: 'bold', color: '#1976d2', marginBottom: '5px' }}>
          🗄️ Database Query
        </h2>
        {!isFullScreen && (
          <button
            onClick={openFullScreen}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              backgroundColor: '#ffffff',
              color: '#1976d2',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
              e.currentTarget.style.borderColor = '#1976d2';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(25,118,210,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e0e0e0';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
            }}
            title="Open in full screen for better experience"
          >
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
            <span>Full Screen</span>
          </button>
        )}
        {isFullScreen && (
          <button
            onClick={() => globalThis.close()}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
            title="Close full screen window"
          >
            ✕ Close
          </button>
        )}
      </div>

      {renderAssetSelection()}
      {renderAccessRequestSelection()}
      {renderAssetDetails()}
      {renderSchemaBrowser()}
      {renderQueryEditor()}
      {renderQueryResults()}

      {!selectedAssetId && (
        <div style={{ padding: '15px', background: '#e3f2fd', borderRadius: '4px', color: '#1565c0', fontSize: '12px', textAlign: 'center' }}>
          👆 Select a database asset to start querying
        </div>
      )}
    </div>
  );
}

QueryApp.propTypes = {
  apiBaseUrl: PropTypes.string.isRequired,
  freshdeskUser: PropTypes.shape({
    email: PropTypes.string.isRequired,
    name: PropTypes.string,
  }).isRequired,
  client: PropTypes.object, // Freshworks client (optional, not used for API calls)
};
