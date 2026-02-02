export const USER_ROLE = {
  ADMIN: 'Admin',
  ACCESSOR: 'Accessor',
  ASSET_OWNER: 'Asset Owner',
  APPROVER: 'Approver',
  AUDITOR: 'Auditor',
}

/**
 * Feature Flags
 * Control feature visibility via environment variables
 * 
 * To enable Approver role features:
 * - Set VITE_ENABLE_APPROVER_ROLE=true in your .env file
 * - Default: false (Approver role is hidden)
 */
export const FEATURE_FLAGS = {
  ENABLE_APPROVER_ROLE: import.meta.env.VITE_ENABLE_APPROVER_ROLE === 'true' || false,
} as const;

export const AUTH_PROVIDER = {
  KEYCLOAK: 'keycloak',
  GOOGLE: 'google',
  KEYCLOAK_SSO: 'keycloak_sso'
}

export enum AssetType {
  DATABASE = "DATABASE",
  UNIX_SERVER = "UNIX_SERVER"
  // Add more asset types here as needed
}

export enum DatabaseType {
  MYSQL = "MYSQL",
  POSTGRESQL = "POSTGRESQL",
  ORACLE = "ORACLE",
  SQLSERVER = "SQLSERVER",
  MONGODB = "MONGODB"
  // Add more database types here as needed
}

export enum UnixServerType {
  LINUX = "LINUX",
  UNIX = "UNIX",
  FREEBSD = "FREEBSD",
  SOLARIS = "SOLARIS"
  // Add more Unix server types here as needed
} 

export enum ChangeRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

export enum LockType {
  LOCK_HAGRID_ONLY = "LOCK_HAGRID_ONLY",
  LOCK_ALL_DB_USERS = "LOCK_ALL_DB_USERS"
}