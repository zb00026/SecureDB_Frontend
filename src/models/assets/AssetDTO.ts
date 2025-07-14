import { AssetType, DatabaseType } from "@/constants/enums";

// Unified DTO for asset operations
export interface AssetDTO {
  // Editable fields
  name: string;
  description: string;
  hostAddress: string;
  portNumber: string;
  databaseName: string;
  
  // Read-only fields (for display purposes)
  type?: AssetType | '';
  databaseType?: DatabaseType | '';
} 