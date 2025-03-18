import { Asset } from "./Asset";
import { User } from "./User";

export interface AssetCredentials {
    id: number;
    assetId: number;
    userId: number;
    username: string;
    password: string;
    createdAt?: Date;
    updatedAt?: Date;
    
    // Optional references to related entities
    asset?: Asset;
    user?: User;
} 