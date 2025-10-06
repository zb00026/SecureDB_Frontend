import { Asset } from './Asset';
import { User } from '../User';
import { ApprovalStatus } from './AccessRequest';
import { UnixGroupMembership } from './UnixGroupMembership';

export interface UnixAccessRequest {
  id: number;
  asset: Asset;
  requestor: User;
  requestTime: string; // ISO DateTime string
  requestReason: string;
  requestedUsername: string;
  publicKey: string;
  encryptedPrivateKey: string;
  approvedTime?: string;
  approvedBy?: User;
  status: ApprovalStatus;
  groupMemberships: UnixGroupMembership[];
  rejectReason?: string;
  comments?: string;
}

export interface UnixAccessRequestDTO {
  assetId: number;
  requestReason: string;
  requestedUsername: string;
  requestedGroupIds: number[];
  expirationHours: number;
}

export interface UnixAccessApprovalDTO {
  approvedGroupIds: number[];
}

export interface UnixAccessRejectionDTO {
  rejectReason: string;
}
