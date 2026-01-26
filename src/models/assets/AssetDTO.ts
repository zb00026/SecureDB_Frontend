import { AssetType, DatabaseType, UnixServerType } from "@/constants/enums";

// Unified DTO for asset operations
export interface AssetDTO {
  // Editable fields
  name: string;
  description: string;
  hostAddress: string;
  portNumber: string;
  databaseName: string;
  hostUrl?: string; // For MongoDB connection strings
  
  // Read-only fields (for display purposes)
  type?: AssetType | '';
  databaseType?: DatabaseType | null;
  unixServerType?: UnixServerType | null;
} 