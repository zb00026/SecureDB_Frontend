import { User } from '../User';
import { Asset } from '../assets/Asset';

export interface UnixGroup {
  id: number;
  assetId: number;
  asset: Asset;
  groupName: string;
  groupId?: string;
  description?: string;
  isSystemGroup: boolean;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt?: string;
  folderAccesses: UnixFolderAccess[];
  members?: any;
  syncResult?: any;
}

export interface UnixFolderAccess {
  id: number;
  folderPath: string;
  accessType: string;
  permissions: string;
  readPermission?: boolean;
  writePermission?: boolean;
  executePermission?: boolean;
  recursive: boolean;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
  validFolderPath: boolean;
  normalizedFolderPath: string;
}

export type UnixAccessType = 'READ' | 'WRITE' | 'EXECUTE' | 'READ_WRITE' | 'READ_EXECUTE' | 'WRITE_EXECUTE' | 'FULL';

export interface UnixPermissions {
  read: boolean;
  write: boolean;
  execute: boolean;
}

export interface CreateUnixGroup {
  groupName: string;
  assetId: number;
  description?: string;
  folderAccesses: CreateUnixFolderAccess[];
}

export interface CreateUnixFolderAccess {
  folderPath: string;
  accessType: string;
  permissions: string;
}

export interface UpdateUnixGroup {
  groupName?: string;
  description?: string;
  folderAccesses?: UpdateUnixFolderAccess[];
}

export interface UpdateUnixFolderAccess {
  id?: number;
  folderPath: string;
  accessType: string;
  permissions: string;
}

export interface UnixGroupSyncResult {
  totalGroups: number;
  syncedGroups: number;
  newGroups: number;
  updatedGroups: number;
  errors: string[];
  lastSyncAt: string;
}

export interface UnixFolderSuggestion {
  path: string;
  type: 'directory' | 'file';
  permissions: string;
  owner: string;
  group: string;
  size?: number;
  lastModified: string;
}
