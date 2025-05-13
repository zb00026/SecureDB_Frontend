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
  accessSql: string;
  requestor: User;
  requestTime: string; // ISO DateTime string
  requestReason: string;
  assetCredential: AssetCredential;
  developerApproverStatus: ApprovalStatus;
  assetApproverStatus: ApprovalStatus;
  isTempPassword?: boolean;
  expiryHours: number;
} 