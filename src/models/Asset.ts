import { AssetType, DatabaseType } from "@/constants/enums";
import { AssetCredential } from "./AssetCredential";
import { User } from "./User";

export interface Asset {
    id: number;
    name: string;
    description: string;
    type: AssetType;
    databaseType?: DatabaseType;
    hostAddress: string;
    createdAt?: Date;
    updatedAt?: Date;
    owners?: Array<User>;
    credentials?: Array<AssetCredential>;
    approvers?: Array<User>;
}