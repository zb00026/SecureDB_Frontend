/**
 * Jira API Client Service
 * Handles API calls to Jira-specific endpoints
 */

import { request } from '@common/index';
import {
  JiraAsset,
  JiraAccessConfigRequest,
  JiraAccessConfigResponse,
  JiraProvisionRequest,
  JiraProvisionResponse,
  JiraRevokeRequest,
  JiraRevokeResponse,
  JiraAccessConfig,
} from '@models/JiraModels';

class JiraApiService {
  /**
   * Get available assets for Jira form
   */
  async getAssets(): Promise<JiraAsset[]> {
    return request('/api/jira/assets', {
      method: 'GET',
      data: {},
    }) as Promise<JiraAsset[]>;
  }

  /**
   * Save access request configuration from Jira
   */
  async saveAccessConfig(
    config: JiraAccessConfigRequest
  ): Promise<JiraAccessConfigResponse> {
    return request('/api/jira/config', {
      method: 'POST',
      data: config,
    }) as Promise<JiraAccessConfigResponse>;
  }

  /**
   * Provision access when approved (called by webhook)
   */
  async provisionAccess(
    provision: JiraProvisionRequest
  ): Promise<JiraProvisionResponse> {
    return request('/api/jira/provision', {
      method: 'POST',
      data: provision,
    }) as Promise<JiraProvisionResponse>;
  }

  /**
   * Revoke access
   */
  async revokeAccess(
    revoke: JiraRevokeRequest
  ): Promise<JiraRevokeResponse> {
    return request('/api/jira/revoke', {
      method: 'POST',
      data: revoke,
    }) as Promise<JiraRevokeResponse>;
  }

  /**
   * Get access configuration by issue key
   */
  async getAccessConfig(issueKey: string): Promise<JiraAccessConfig> {
    return request(`/api/jira/config/${issueKey}`, {
      method: 'GET',
      data: {},
    }) as Promise<JiraAccessConfig>;
  }
}

export const jiraApi = new JiraApiService();
