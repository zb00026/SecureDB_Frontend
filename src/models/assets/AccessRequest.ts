import { Asset } from './Asset';
import { User } from '../User';

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface AccessRequest {
  id: number;
  asset: Asset;
  accessSql: string;
  requestor: User;
  requestTime: string; // ISO DateTime string
  requestReason: string;
  developerApproverStatus: ApprovalStatus;
  assetApproverStatus: ApprovalStatus;
} 