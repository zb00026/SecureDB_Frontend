import { AccessLevelObject } from './AccessLevelObject';
import { AccessRequest } from './AccessRequest';

export interface AccessRequestDTO {
  id: number;
  accessRequest: AccessRequest;
  accessLevelObjects: AccessLevelObject[];
  requestId: number;
  assetId: number;
  expiryHours: number;
  requestReason: string;
} 