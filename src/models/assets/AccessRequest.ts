import { Asset } from './Asset';
import { User } from '../User';
import { AssetCredential } from './AssetCredential';
export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface AccessRequest {
  id: number;
  asset: Asset;
  assetDTO: Asset;
  assetApprovalsDTO: Asset;
  accessSql: string;
  requestor: User;
  requestTime: string; // ISO DateTime string
  requestReason: string;
  rejectReason?: string;
  assetCredential: AssetCredential;
  developerApproverStatus: ApprovalStatus;
  assetApproverStatus: ApprovalStatus;
  isTempPassword?: boolean;
  expiryHours: number;
  
  // Unix access request fields
  requestedUsername?: string;
  publicKey?: string;
  encryptedPrivateKey?: string;
  approvedTime?: string;
  approvedBy?: User;
  groupMemberships?: UnixGroupMembership[];
}

export interface UnixGroupMembership {
  id: number;
  accessRequestId: number;
  unixGroupId: number;
  unixGroup: UnixGroup;
  status: ApprovalStatus;
  approved: boolean;
}

export interface UnixGroup {
  id: number;
  name: string;
  description?: string;
  assetId: number;
} 