/**
 * Jira API response models
 * These are DTOs returned by the Jira API endpoints
 */

export type JiraAccessLevel = 'READ_ONLY' | 'READ_WRITE' | 'FULL_ACCESS';

export interface JiraAsset {
  readonly id: number;
  readonly name: string;
  readonly type: string;
  readonly description?: string;
}

export interface JiraAccessConfigRequest {
  readonly issueKey: string;
  readonly issueId: string;
  readonly userEmail: string;
  readonly assetId: number;
  readonly tables: string; // Comma-separated string
  readonly accessLevel: JiraAccessLevel;
  readonly durationDays: number;
  readonly businessJustification: string;
}

export interface JiraAccessConfigResponse {
  readonly success: boolean;
  readonly damRequestId: number;
  readonly message: string;
}

export interface JiraProvisionRequest {
  readonly issueKey: string;
  readonly issueId: string;
  readonly approverEmail: string;
  readonly timestamp: number;
}

export interface JiraProvisionResponse {
  readonly success: boolean;
  readonly damRequestId: number;
  readonly message: string;
}

export interface JiraRevokeRequest {
  readonly issueKey: string;
  readonly reason: 'expired' | 'rejected' | 'manual';
}

export interface JiraRevokeResponse {
  readonly success: boolean;
  readonly message: string;
}

export interface JiraAccessConfig {
  readonly damRequestId: number;
  readonly assetId: number;
  readonly assetName: string;
  readonly status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  readonly expiryDate: string;
  readonly isLocked: boolean;
}
