export const USER_ROLE = {
  ADMIN: 'Admin',
  DEVELOPER: 'Developer',
  ASSET_OWNER: 'Asset Owner',
  APPROVER: 'Approver',
  AUDITOR: 'Auditor',
}

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
  SQLSERVER = "SQLSERVER"
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