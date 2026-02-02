import { Asset } from './Asset';
import { User } from '../User';
import { AssetCredential } from './AssetCredential';
export enum ApprovalStatus {
  REQUESTED = 'REQUESTED',
  APPROVAL_IN_PROGRESS = 'APPROVAL_IN_PROGRESS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  RELINQUISHED_AFTER_APPROVED = 'RELINQUISHED_AFTER_APPROVED',
  RELINQUISHED_BEFORE_APPROVAL = 'RELINQUISHED_BEFORE_APPROVAL'
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
  accessorApproverStatus: ApprovalStatus;
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
  groupName: string;
  description?: string;
  assetId: number;
} 