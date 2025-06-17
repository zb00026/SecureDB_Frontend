export interface AuditTrail {
  id: number;
  timestamp: string;
  instanceId: string | null;
  user: string;
  action: string;
  previousValue: string | null;
  newValue: string | null;
  actionMetadata: string | null;
  synced: boolean;
  ipAddress: string | null;
  // Additional fields for role-based filtering
  assetId?: number;
  assetName?: string;
  userId?: number;
  userEmail?: string;
  targetUserId?: number; // For actions involving other users
  targetUserEmail?: string;
  resourceType?: string; // 'ASSET', 'USER', 'ACCESS_REQUEST', etc.
  resourceId?: number;
}