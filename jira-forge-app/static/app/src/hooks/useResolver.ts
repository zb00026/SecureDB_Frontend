import { invoke } from '@forge/bridge';

export interface Asset {
  id: string;
  name: string;
  type: string;
  description?: string;
  tables?: string[] | null;
  /** True if the current user already has access to this asset */
  userHasAccess?: boolean;
  /** Tables the user already has access to (for approved assets only) */
  existingTables?: string[];
}

export type AccessLevel = 'READ_ONLY' | 'READ_WRITE' | 'FULL_ACCESS';

export interface AccessConfig {
  damRequestId?: string;
  assetId: string;
  assetName?: string;
  tables: string;
  accessLevel: AccessLevel;
  durationHours?: number;
  durationDays?: number;
  businessJustification: string;
  status?: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  expiryDate?: string;
  isLocked?: boolean;
  /** When true, current user has Asset Owner role and can approve/reject this request */
  showApproveReject?: boolean;
  /** Asset owner emails returned by POST /api/jira/config – used to assign the issue */
  assetOwnerEmails?: string[];
  /** Jira accountId of the user who created this access request */
  jiraRequesterId?: string;
}

export interface AccessConfigRequest {
  issueKey: string;
  issueId: string;
  userEmail: string;
  /** Jira account ID of the requesting user */
  jiraAccountId: string;
  assetId: string;
  tables: string;
  accessLevel: AccessLevel;
  durationHours: number;
  businessJustification: string;
}

interface ResolverResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  notFound?: boolean;
}

/** Role names returned by backend (e.g. "Accessor", "Asset Owner") */
export const ROLES = { ACCESSOR: 'Accessor', ASSET_OWNER: 'Asset Owner' } as const;

export async function authenticateForgeUser(accountId: string, userEmail?: string): Promise<{ roles: string[] }> {
  const response = await invoke('authenticateForgeUser', { accountId, userEmail }) as {
    success: boolean;
    error?: string;
    data?: { user?: { roles?: string[] }; roles?: string[] };
  };
  if (!response.success) {
    throw new Error(response.error || 'Authentication failed');
  }
  // Prefer user.roles (populated) over top-level roles (may be empty [])
  const userRoles = response.data?.user?.roles;
  const topRoles = response.data?.roles;
  let roles: string[] = [];
  if (Array.isArray(userRoles) && userRoles.length > 0) {
    roles = userRoles;
  } else if (Array.isArray(topRoles) && topRoles.length > 0) {
    roles = topRoles;
  }
  return { roles };
}

export async function getCurrentUserEmail(): Promise<string | null> {
  const response = await invoke('getCurrentUserEmail', {}) as { success: boolean; userEmail?: string | null };
  return response.success ? (response.userEmail ?? null) : null;
}

export async function getIssueType(issueKey: string): Promise<string | null> {
  const response = await invoke('getIssueType', { issueKey }) as { success: boolean; issueType?: string | null };
  return response.success ? (response.issueType ?? null) : null;
}

export const DATABASE_ACCESS_REQUEST_TYPE = 'Database Access Request';

export interface TableSchema {
  tableName: string;
  tableType?: string;
  schema?: string;
}

export interface TableGroup {
  name: string;
  tables: TableSchema[];
}

export interface SchemaResponse {
  databaseName?: string;
  tables?: TableSchema[];
  databases?: { name: string; tables: TableSchema[] }[];
}


/** Assets response - backend may return flat list or split by access */
export interface AssetsResponse {
  /** Assets the user already has access to */
  approvedAssets?: Asset[];
  /** Assets the user does not have access to */
  unapprovedAssets?: Asset[];
  /** Fallback: flat list (all treated as unapproved if no split) */
  data?: Asset[];
}

function normalizeAssetsResponse(data: Asset[] | AssetsResponse | undefined): {
  approved: Asset[];
  unapproved: Asset[];
} {
  if (!data) return { approved: [], unapproved: [] };
  if (Array.isArray(data)) {
    const approved = data.filter((a) => a.userHasAccess === true);
    const unapproved = data.filter((a) => a.userHasAccess !== true);
    return { approved, unapproved };
  }
  if (data.approvedAssets && data.unapprovedAssets) {
    return { approved: data.approvedAssets, unapproved: data.unapprovedAssets };
  }
  const flat = data.data || [];
  const approved = flat.filter((a) => a.userHasAccess === true);
  const unapproved = flat.filter((a) => a.userHasAccess !== true);
  return { approved, unapproved };
}

export async function getAssets(accountId: string, userEmail?: string): Promise<Asset[]> {
  const response = await invoke('getAssets', { accountId, userEmail }) as ResolverResponse<Asset[] | AssetsResponse>;
  const raw = response.data;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  const { approved, unapproved } = normalizeAssetsResponse(raw);
  return [...approved, ...unapproved];
}

/** Get assets split into approved (user has access) and unapproved */
export async function getAssetsSplit(
  accountId: string,
  userEmail?: string
): Promise<{ approved: Asset[]; unapproved: Asset[] }> {
  const response = await invoke('getAssets', { accountId, userEmail }) as ResolverResponse<Asset[] | AssetsResponse>;
  const raw = response.success ? response.data : undefined;
  return normalizeAssetsResponse(raw);
}

export async function saveAccessConfig(config: AccessConfigRequest, accountId: string): Promise<AccessConfig> {
  const response = await invoke('saveAccessConfig', { ...config, accountId }) as ResolverResponse<AccessConfig>;
  if (response.success) return response.data!;
  throw new Error(response.error || 'Failed to save configuration');
}

export async function getAccessConfig(issueKey: string, accountId: string, userEmail?: string): Promise<AccessConfig | null> {
  const response = await invoke('getAccessConfig', { issueKey, accountId, userEmail }) as ResolverResponse<AccessConfig>;
  if (response.success) return response.data || null;
  if (response.notFound) return null;
  throw new Error(response.error || 'Failed to fetch configuration');
}

function serializeRequestBody(body: Record<string, unknown> | string | undefined): string | undefined {
  if (body == null) return undefined;
  if (typeof body === 'string') return body;
  return JSON.stringify(body);
}

export async function approveAccessRequest(
  accessRequestId: string | number,
  accountId: string,
  userEmail?: string,
  body?: Record<string, unknown> | string,
  issueKey?: string,
  issueId?: string,
  jiraRequesterId?: string
): Promise<{ success: boolean; accessRequestId?: number; status?: string }> {
  const response = await invoke('approveAccessRequest', {
    accessRequestId: String(accessRequestId),
    accountId,
    userEmail,
    body: serializeRequestBody(body),
    issueKey,
    issueId,
    jiraRequesterId,
  }) as ResolverResponse<{ success: boolean; accessRequestId?: number; status?: string }>;
  if (response.success) return response.data ?? { success: true };
  throw new Error(response.error || 'Approve failed');
}

export async function rejectAccessRequest(
  accessRequestId: string | number,
  accountId: string,
  userEmail?: string,
  body?: { rejectReason?: string } | string,
  issueKey?: string,
  issueId?: string,
  jiraRequesterId?: string
): Promise<{ success: boolean; accessRequestId?: number; status?: string }> {
  const response = await invoke('rejectAccessRequest', {
    accessRequestId: String(accessRequestId),
    accountId,
    userEmail,
    body: serializeRequestBody(body),
    issueKey,
    issueId,
    jiraRequesterId,
  }) as ResolverResponse<{ success: boolean; accessRequestId?: number; status?: string }>;
  if (response.success) return response.data ?? { success: true };
  throw new Error(response.error || 'Reject failed');
}

/**
 * Look up hagrids.assetowner role members in Jira, query backend for which
 * one owns the given asset, then assign the issue and transition to
 * Requested (and Pending for Approval if owner found in Jira).
 */
export async function assignAndTransitionIssue(
  issueKey: string,
  assetId: string,
  accountId?: string
): Promise<{ success: boolean; assignedTo?: string | null; transitioned?: string; warning?: string }> {
  const response = await invoke('assignAndTransitionIssue', { issueKey, assetId, accountId }) as ResolverResponse<{
    assignedTo?: string | null;
    transitioned?: string;
    warning?: string;
  }>;
  if (response.success) return { success: true, ...response.data };
  throw new Error(response.error || 'Failed to assign and transition issue');
}
