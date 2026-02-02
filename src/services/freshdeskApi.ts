/**
 * Freshdesk API Client Service
 * Handles API calls to Freshdesk-specific endpoints
 */

import { request } from '@common/index';
import { Asset } from '@models/assets/Asset';
import { QueryResponse } from '@models/QueryModels';
import {
  FreshdeskAccessRequestDTO,
  FreshdeskDatabaseSchemaDTO,
  NLToSQLResponse,
} from '@models/FreshdeskModels';

class FreshdeskApiService {
  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    return request('/api/freshdesk/health', {
      method: 'GET',
      data: {},
    }) as Promise<{ status: string; service: string }>;
  }

  /**
   * Get all assets available to the accessor
   */
  async getAssets(): Promise<Asset[]> {
    return request('/api/freshdesk/assets', {
      method: 'GET',
      data: {},
    }) as Promise<Asset[]>;
  }

  /**
   * Get access requests for the accessor
   */
  async getAccessRequests(assetId?: number): Promise<FreshdeskAccessRequestDTO[]> {
    const url = assetId
      ? `/api/freshdesk/access-requests?assetId=${assetId}`
      : '/api/freshdesk/access-requests';
    return request(url, {
      method: 'GET',
      data: {},
    }) as Promise<FreshdeskAccessRequestDTO[]>;
  }

  /**
   * Get database schema for an access request
   */
  async getSchema(requestId: number): Promise<FreshdeskDatabaseSchemaDTO> {
    return request(`/api/freshdesk/schema?requestId=${requestId}`, {
      method: 'GET',
      data: {},
    }) as Promise<FreshdeskDatabaseSchemaDTO>;
  }

  /**
   * Execute a SQL query
   */
  async runQuery(
    assetId: number,
    requestId: number,
    query: string
  ): Promise<QueryResponse> {
    return request('/api/freshdesk/run-query', {
      method: 'POST',
      data: {
        assetId,
        requestId,
        query,
      },
    }) as Promise<QueryResponse>;
  }

  /**
   * Convert natural language to SQL
   */
  async convertNLToSQL(
    requestId: number,
    naturalLanguageQuery: string
  ): Promise<NLToSQLResponse> {
    return request('/api/freshdesk/convert-nl-to-sql', {
      method: 'POST',
      data: {
        requestId,
        naturalLanguageQuery,
      },
    }) as Promise<NLToSQLResponse>;
  }
}

export const freshdeskApi = new FreshdeskApiService();



