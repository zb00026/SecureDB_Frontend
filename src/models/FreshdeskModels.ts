/**
 * Freshdesk API response models
 * These are simplified DTOs returned by the Freshdesk API endpoints
 */

export interface FreshdeskAccessRequestDTO {
  readonly id: number;
  readonly assetId: number;
  readonly assetName: string;
  readonly status: string;
  readonly expiryDate: string;
  readonly requestedUsername: string;
}

export interface FreshdeskDatabaseSchemaDTO {
  readonly tables: readonly {
    readonly name: string;
    readonly columns: readonly {
      readonly name: string;
      readonly type: string;
      readonly nullable: boolean;
    }[];
  }[];
  readonly totalTables: number;
  readonly totalColumns: number;
}

export interface NLToSQLResponse {
  readonly sql: string;
  readonly confidence: number;
  readonly explanation: string;
}








