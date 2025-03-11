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
}