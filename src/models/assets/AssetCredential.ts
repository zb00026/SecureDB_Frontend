import { Asset } from "./Asset";
import { User } from "../User";

export interface AssetCredential {
    id: number;
    assetId: number;
    userId: number;
    username: string;
    password: string;
    createdAt?: Date;
    updatedAt?: Date;
    isTemporaryPassword?: boolean;
    
    // Optional references to related entities
    asset?: Asset;
    user?: User;
} 