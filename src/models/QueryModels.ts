/**
 * Query-related models for database query operations
 */

// Import Asset type
import { Asset } from './assets/Asset';

export interface QueryResult {
  readonly headers: readonly string[];
  readonly data: readonly Record<string, any>[];
  readonly query: string;
}

export interface QueryResponse {
  readonly totalQueries: number;
  readonly results: readonly QueryResult[];
}

export interface QueryHistory {
  readonly id: string;
  readonly query: string;
  readonly timestamp: string;
  readonly resultCount?: number;
  readonly results?: QueryResponse;
  readonly accessRequestId?: string;
}

export interface SaveDialogConfig {
  readonly title: string;
  readonly message: string;
}

export type UserType = 'accessor' | 'asset_owner';

export interface SharedQueryComponentProps {
  readonly asset: Asset | null;
  readonly accessRequestId?: string;
  readonly userType: UserType;
  readonly onClose?: () => void;
  readonly showHistory?: boolean;
  readonly showQueryEditor?: boolean;
  readonly customApiEndpoint?: string; // Optional custom API endpoint (e.g., for Freshdesk)
}

export interface SharedQueryComponentRef {
  readonly setQuery: (query: string) => void;
}

