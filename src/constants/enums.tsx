export const USER_ROLE = {
  ADMIN: 'Admin',
  DEVELOPER: 'Developer',
  RESOURCE_OWNER: 'Resource Owner',
  APPROVER: 'Approver',
  AUDITOR: 'Auditor',
}

export const AUTH_PROVIDER = {
  KEYCLOAK: 'keycloak',
  GOOGLE: 'google'
}



export enum AssetType {
  DATABASE = "DATABASE"
  // Add more asset types here as needed
}

export enum DatabaseType {
  MYSQL = "MYSQL",
  POSTGRESQL = "POSTGRESQL",
  ORACLE = "ORACLE",
  SQLSERVER = "SQLSERVER"
  // Add more database types here as needed
} 