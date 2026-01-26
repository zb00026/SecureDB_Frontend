import { Asset } from "./Asset";
import { User } from "../User";

export interface AssetCredential {
    id: number;
    assetId: number;
    userId: number;
    username: string;
    password: string | null;
    awsSecretsManagerKey?: string | null;
    userAccessType?: string;
    isDeleted?: boolean;
    isTemporaryPassword?: boolean;
    sshKeyFile?: string; // For Unix Server assets
    
    // Optional references to related entities
    asset?: Asset;
    user?: User;
} 