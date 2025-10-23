export interface TimeSeriesDataPoint {
  timestamp: string;
  eventCount: number;
}

export interface TopAsset {
  assetId: number;
  assetName: string;
  activityCount: number;
}

export interface TopUser {
  userEmail: string;
  activityCount: number;
}

export interface TopIpAddress {
  ipAddress: string;
  activityCount: number;
}

export interface AuditStatsData {
  timeSeriesData: TimeSeriesDataPoint[];
  topAssets: TopAsset[];
  topUsers: TopUser[];
  topIpAddresses: TopIpAddress[];
  totalEvents: number;
  startDate: string;
  endDate: string;
}

export interface AvailableFilters {
  canFilterByAsset: boolean;
  canViewAllUsers: boolean;
  canViewAllActions: boolean;
  availableActions: string[];
  availableResourceTypes: string[];
}
