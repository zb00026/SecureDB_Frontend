import { ApprovalStatus } from './AccessRequest';

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
