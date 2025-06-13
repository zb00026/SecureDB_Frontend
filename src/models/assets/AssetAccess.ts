export interface PermissionDTO {
  type: string; // SELECT, INSERT, UPDATE, DELETE, etc.
  scope: string; // database, table name, or object name
  objectType: string; // DATABASE, TABLE, VIEW, PROCEDURE
  grantable: boolean; // Whether user can grant this permission to others
}

export interface UserAccessDTO {
  username: string;
  grantee: string; // The full grantee string from database
  permissions: PermissionDTO[];
}

export interface AssetAccessDTO {
  assetId: number;
  assetName: string;
  databaseType: string;
  users: UserAccessDTO[];
} 